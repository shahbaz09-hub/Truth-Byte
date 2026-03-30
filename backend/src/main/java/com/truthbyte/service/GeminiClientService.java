package com.truthbyte.service;

import com.truthbyte.dto.gemini.GeminiRequest;
import com.truthbyte.dto.gemini.GeminiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class GeminiClientService {

        private static final Logger logger = LoggerFactory.getLogger(GeminiClientService.class);

        private final WebClient webClient;
        private final List<String> geminiApiUrls;
        private final List<String> geminiApiKeys;
        private final Duration requestTimeout;
        private final long retryCount;
        private final Duration retryDelay;
        private final Integer maxOutputTokens;

        // Round-robin counter to distribute load across API keys
        private final AtomicInteger keyRotationCounter = new AtomicInteger(0);

        // Per-key cooldown tracking: key -> cooldown expiry instant
        private final Map<String, Instant> keyCooldowns = new ConcurrentHashMap<>();
        private static final Duration KEY_COOLDOWN_DURATION = Duration.ofSeconds(90);

        public GeminiClientService(
                        WebClient.Builder webClientBuilder,
                        @Value("${truthbyte.ai.gemini.url}") String primaryGeminiApiUrl,
                        @Value("${truthbyte.ai.gemini.fallback-url:}") String fallbackGeminiApiUrl,
                        @Value("${truthbyte.ai.gemini.api-key:}") String geminiApiKey,
                        @Value("${truthbyte.ai.gemini.api-keys:}") String geminiApiKeys,
                        @Value("${truthbyte.ai.gemini.request-timeout-ms:55000}") long requestTimeoutMs,
                        @Value("${truthbyte.ai.gemini.retry-count:1}") long retryCount,
                        @Value("${truthbyte.ai.gemini.retry-delay-ms:800}") long retryDelayMs,
                        @Value("${truthbyte.ai.gemini.max-output-tokens:768}") Integer maxOutputTokens
        ) {
                this.webClient = webClientBuilder
                                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                                .build();
                this.geminiApiUrls = buildApiUrls(primaryGeminiApiUrl, fallbackGeminiApiUrl);
                this.geminiApiKeys = buildApiKeys(geminiApiKey, geminiApiKeys);
                this.requestTimeout = Duration.ofMillis(Math.max(1000, requestTimeoutMs));
                this.retryCount = Math.max(0, retryCount);
                this.retryDelay = Duration.ofMillis(Math.max(100, retryDelayMs));
                int configuredTokens = (maxOutputTokens != null && maxOutputTokens > 0) ? maxOutputTokens : 768;
                this.maxOutputTokens = Math.max(512, configuredTokens);

                logger.info("GeminiClientService initialized — {} model URL(s), {} API key(s), timeout={}ms",
                                this.geminiApiUrls.size(), this.geminiApiKeys.size(), requestTimeoutMs);
        }

        public Mono<String> generateContent(String systemInstruction, String userMessage) {
                if (geminiApiKeys.isEmpty()) {
                        return Mono.error(new RuntimeException(
                                        "GEMINI_API_KEY (or GEMINI_API_KEYS) is not configured on backend. Please set it and retry."
                        ));
                }

                GeminiRequest request = GeminiRequest.builder()
                                .systemInstruction(GeminiRequest.SystemInstruction.builder()
                                                .parts(List.of(GeminiRequest.Part.builder().text(systemInstruction).build()))
                                                .build())
                                .contents(List.of(GeminiRequest.Content.builder()
                                                .role("user")
                                                .parts(List.of(GeminiRequest.Part.builder().text(userMessage).build()))
                                                .build()))
                                .generationConfig(GeminiRequest.GenerationConfig.builder()
                                                .temperature(0.1)
                                                .responseMimeType("application/json")
                                                .maxOutputTokens(maxOutputTokens)
                                                .build())
                                .build();

                // Round-robin: pick a starting key index so each request starts from a different key
                int startingKeyIndex = Math.abs(keyRotationCounter.getAndIncrement()) % geminiApiKeys.size();

                return callWithFailover(request, 0, startingKeyIndex, null)
                                .doOnError(e -> logger.error("Error communicating with Gemini AI: {}", rootMessage(e)))
                                .onErrorMap(e -> new RuntimeException("Error communicating with Gemini AI: " + rootMessage(e), e));
        }

        private Mono<String> callWithFailover(GeminiRequest request, int attempt, int startingKeyIndex, Throwable lastError) {
                int totalTargets = geminiApiUrls.size() * geminiApiKeys.size();
                if (attempt >= totalTargets) {
                        String reason = lastError != null ? rootMessage(lastError) : "No valid Gemini model/key combination available.";
                        return Mono.error(new RuntimeException(
                                        "Gemini API exhausted all configured model/key attempts. Last error: " + reason,
                                        lastError
                        ));
                }

                int urlIndex = attempt / geminiApiKeys.size();
                // Round-robin: offset the key index by the starting index
                int keyIndex = (startingKeyIndex + (attempt % geminiApiKeys.size())) % geminiApiKeys.size();
                String apiUrl = geminiApiUrls.get(urlIndex);
                String apiKey = geminiApiKeys.get(keyIndex);

                // Check per-key cooldown
                Instant cooldownExpiry = keyCooldowns.get(apiKey);
                if (cooldownExpiry != null && Instant.now().isBefore(cooldownExpiry)) {
                        logger.debug("Skipping cooled-down key #{} for model '{}' (cooldown until {})",
                                        keyIndex + 1, extractModelName(apiUrl), cooldownExpiry);
                        return callWithFailover(request, attempt + 1, startingKeyIndex, lastError);
                }

                return executeRequest(apiUrl, apiKey, request)
                                .onErrorResume(ex -> {
                                        // If quota/rate limit hit, put this key on cooldown
                                        if (isQuotaError(ex)) {
                                                keyCooldowns.put(apiKey, Instant.now().plus(KEY_COOLDOWN_DURATION));
                                                logger.warn("Key #{} hit quota limit. Cooling down for {}s.",
                                                                keyIndex + 1, KEY_COOLDOWN_DURATION.getSeconds());
                                        }

                                        if (shouldTryNextTarget(ex) && attempt + 1 < totalTargets) {
                                                logger.warn(
                                                                "Gemini attempt failed for model '{}' with key #{} (attempt {}/{}). Trying next. Cause: {}",
                                                                extractModelName(apiUrl),
                                                                keyIndex + 1,
                                                                attempt + 1,
                                                                totalTargets,
                                                                rootMessage(ex)
                                                );
                                                return callWithFailover(request, attempt + 1, startingKeyIndex, ex);
                                        }
                                        return Mono.error(ex);
                                });
        }

        private Mono<String> executeRequest(String apiUrl, String apiKey, GeminiRequest request) {
                Mono<GeminiResponse> responseMono = webClient.post()
                                .uri(apiUrl + "?key=" + apiKey)
                                .bodyValue(request)
                                .retrieve()
                                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                                                .defaultIfEmpty("")
                                                .flatMap(body -> Mono.error(buildGeminiException(response.statusCode().value(), body, apiUrl))))
                                .bodyToMono(GeminiResponse.class)
                                .timeout(requestTimeout);

                if (retryCount > 0) {
                        responseMono = responseMono.retryWhen(
                                        Retry.backoff(retryCount, retryDelay)
                                                        .filter(this::isRetryable)
                                                        .doBeforeRetry(signal -> logger.warn(
                                                                        "Retrying Gemini call for model '{}' after transient issue: {}",
                                                                        extractModelName(apiUrl),
                                                                        rootMessage(signal.failure())
                                                        ))
                                                        .onRetryExhaustedThrow((spec, signal) -> signal.failure())
                        );
                }

                return responseMono.map(response -> {
                        String extractedText = response.getExtractedText();
                        if (extractedText == null || extractedText.isBlank()) {
                                throw new RuntimeException("Invalid or empty response from Gemini API");
                        }
                        return extractedText;
                });
        }

        private RuntimeException buildGeminiException(int statusCode, String body, String apiUrl) {
                String model = extractModelName(apiUrl);
                String normalizedBody = body == null ? "" : body.toLowerCase(Locale.ROOT);

                if (statusCode == 429 || normalizedBody.contains("resource_exhausted")) {
                        return new RuntimeException(
                                        "RESOURCE_EXHAUSTED: Gemini rate/quota limit reached for model '" + model + "'. " + body
                        );
                }

                if (statusCode == 401
                                || statusCode == 403
                                || normalizedBody.contains("permission_denied")
                                || normalizedBody.contains("api key")) {
                        return new RuntimeException(
                                        "PERMISSION_DENIED: Gemini key was rejected for model '" + model + "'. " + body
                        );
                }

                return new RuntimeException(
                                "Gemini API returned status " + statusCode + " for model '" + model + "': " + body
                );
        }

        private boolean isQuotaError(Throwable throwable) {
                String normalized = rootMessage(throwable).toLowerCase(Locale.ROOT);
                return normalized.contains("resource_exhausted")
                                || normalized.contains("quota")
                                || normalized.contains("too_many_requests")
                                || normalized.contains("rate limit")
                                || normalized.contains("429");
        }

        private boolean isRetryable(Throwable throwable) {
                Throwable root = unwrap(throwable);

                if (root instanceof TimeoutException) {
                        return true;
                }

                if (root instanceof WebClientResponseException responseException) {
                        int status = responseException.getStatusCode().value();
                        return status == 429 || status == 500 || status == 502 || status == 503 || status == 504;
                }

                String normalized = rootMessage(root).toLowerCase(Locale.ROOT);
                return normalized.contains("timeout")
                                || normalized.contains("resource_exhausted")
                                || normalized.contains("too_many_requests")
                                || normalized.contains("rate limit")
                                || normalized.contains("temporarily unavailable")
                                || normalized.contains("connection reset")
                                || normalized.contains("connection refused")
                                || normalized.contains("broken pipe");
        }

        private boolean shouldTryNextTarget(Throwable throwable) {
                String normalized = rootMessage(throwable).toLowerCase(Locale.ROOT);
                return normalized.contains("resource_exhausted")
                                || normalized.contains("quota")
                                || normalized.contains("too_many_requests")
                                || normalized.contains("permission_denied")
                                || normalized.contains("forbidden")
                                || normalized.contains("api key")
                                || normalized.contains("timeout");
        }

        private List<String> buildApiUrls(String primaryUrl, String fallbackUrl) {
                List<String> urls = new ArrayList<>();
                addUniqueNonBlank(urls, primaryUrl);
                addUniqueNonBlank(urls, fallbackUrl);

                if (urls.isEmpty()) {
                        urls.add("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent");
                }

                return List.copyOf(urls);
        }

        private List<String> buildApiKeys(String primaryKey, String additionalKeysCsv) {
                List<String> keys = new ArrayList<>();
                addUniqueNonBlank(keys, primaryKey);

                if (additionalKeysCsv != null && !additionalKeysCsv.isBlank()) {
                        String[] split = additionalKeysCsv.split(",");
                        for (String candidate : split) {
                                addUniqueNonBlank(keys, candidate);
                        }
                }

                return List.copyOf(keys);
        }

        private void addUniqueNonBlank(List<String> values, String candidate) {
                if (candidate == null) {
                        return;
                }
                String trimmed = candidate.trim();
                if (trimmed.isEmpty() || values.contains(trimmed)) {
                        return;
                }
                values.add(trimmed);
        }

        private String extractModelName(String apiUrl) {
                if (apiUrl == null || apiUrl.isBlank()) {
                        return "unknown-model";
                }

                int marker = apiUrl.indexOf("/models/");
                if (marker < 0) {
                        return apiUrl;
                }

                int start = marker + "/models/".length();
                int end = apiUrl.indexOf(":generateContent", start);
                if (end < 0) {
                        end = apiUrl.length();
                }
                if (start >= end) {
                        return apiUrl;
                }

                return apiUrl.substring(start, end);
        }

        private Throwable unwrap(Throwable throwable) {
                Throwable cursor = throwable;
                while (cursor != null && cursor.getCause() != null && cursor.getCause() != cursor) {
                        cursor = cursor.getCause();
                }
                return cursor != null ? cursor : throwable;
        }

        private String rootMessage(Throwable throwable) {
                Throwable root = unwrap(throwable);
                if (root == null) {
                        return "unknown error";
                }

                String message = root.getMessage();
                return message == null || message.isBlank() ? root.getClass().getSimpleName() : message;
        }
}
