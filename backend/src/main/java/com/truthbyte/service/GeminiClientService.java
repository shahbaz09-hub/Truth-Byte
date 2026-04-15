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

        // Per-key consecutive failure count for exponential cooldown
        private final Map<String, Integer> keyFailureCounts = new ConcurrentHashMap<>();

        // Base cooldown duration (30s) — scales up with repeated failures
        private static final Duration BASE_COOLDOWN = Duration.ofSeconds(30);
        private static final Duration MAX_COOLDOWN = Duration.ofMinutes(5);



        public GeminiClientService(
                        WebClient.Builder webClientBuilder,
                        @Value("${truthbyte.ai.gemini.url}") String primaryGeminiApiUrl,
                        @Value("${truthbyte.ai.gemini.fallback-url:}") String fallbackGeminiApiUrl,
                        @Value("${truthbyte.ai.gemini.api-key:}") String geminiApiKey,
                        @Value("${truthbyte.ai.gemini.api-keys:}") String geminiApiKeys,
                        @Value("${truthbyte.ai.gemini.request-timeout-ms:60000}") long requestTimeoutMs,
                        @Value("${truthbyte.ai.gemini.retry-count:2}") long retryCount,
                        @Value("${truthbyte.ai.gemini.retry-delay-ms:1500}") long retryDelayMs,
                        @Value("${truthbyte.ai.gemini.max-output-tokens:8192}") Integer maxOutputTokens
        ) {
                this.webClient = webClientBuilder
                                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
                                .build();
                this.geminiApiUrls = buildApiUrls(primaryGeminiApiUrl, fallbackGeminiApiUrl);
                this.geminiApiKeys = buildApiKeys(geminiApiKey, geminiApiKeys);
                this.requestTimeout = Duration.ofMillis(Math.max(1000, requestTimeoutMs));
                this.retryCount = Math.max(0, retryCount);
                this.retryDelay = Duration.ofMillis(Math.max(100, retryDelayMs));
                int configuredTokens = (maxOutputTokens != null && maxOutputTokens > 0) ? maxOutputTokens : 8192;
                this.maxOutputTokens = Math.max(1024, configuredTokens);

                logger.info("GeminiClientService initialized — {} model URL(s), {} API key(s), timeout={}ms, maxTokens={}",
                                this.geminiApiUrls.size(), this.geminiApiKeys.size(), requestTimeoutMs, this.maxOutputTokens);
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
                                                .temperature(0.3)
                                                .responseMimeType("application/json")
                                                .maxOutputTokens(maxOutputTokens)
                                                .build())
                                .build();

                // Round-robin: pick a starting key index so each request starts from a different key
                int startingKeyIndex = Math.abs(keyRotationCounter.getAndIncrement()) % geminiApiKeys.size();

                return callWithFailover(request, 0, startingKeyIndex, null)
                                .doOnError(e -> logger.error("All Gemini attempts exhausted: {}", rootMessage(e)))
                                .onErrorMap(e -> new RuntimeException("Error communicating with Gemini AI: " + rootMessage(e), e));
        }

        private Mono<String> callWithFailover(GeminiRequest request, int attempt, int startingKeyIndex, Throwable lastError) {
                int totalTargets = geminiApiUrls.size() * geminiApiKeys.size();
                if (attempt >= totalTargets) {
                        // All keys/models exhausted — check if any key cooldown is about to expire
                        String reason = lastError != null ? rootMessage(lastError) : "No valid Gemini model/key combination available.";
                        return Mono.error(new RuntimeException(
                                        "RESOURCE_EXHAUSTED: Gemini API exhausted all configured model/key attempts. Last error: " + reason,
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
                                .doOnNext(response -> {
                                        // Success — reset failure count for this key
                                        keyFailureCounts.remove(apiKey);
                                        keyCooldowns.remove(apiKey);
                                })
                                .onErrorResume(ex -> {
                                        // If quota/rate limit hit, put this key on exponential cooldown
                                        if (isQuotaError(ex)) {
                                                int failures = keyFailureCounts.merge(apiKey, 1, Integer::sum);
                                                Duration cooldown = calculateCooldown(failures);
                                                keyCooldowns.put(apiKey, Instant.now().plus(cooldown));
                                                logger.warn("Key #{} hit quota limit (failure #{}). Cooling down for {}s.",
                                                                keyIndex + 1, failures, cooldown.getSeconds());
                                        }

                                        if (shouldTryNextTarget(ex) && attempt + 1 < totalTargets) {
                                                logger.warn(
                                                                "Gemini attempt failed — model '{}', key #{} (attempt {}/{}). Trying next. Cause: {}",
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

        /**
         * Calculate exponential cooldown based on consecutive failure count.
         * 1st failure: 30s, 2nd: 60s, 3rd: 120s, capped at 5 minutes.
         */
        private Duration calculateCooldown(int failureCount) {
                long seconds = BASE_COOLDOWN.getSeconds() * (long) Math.pow(2, Math.min(failureCount - 1, 4));
                return Duration.ofSeconds(Math.min(seconds, MAX_COOLDOWN.getSeconds()));
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
                                                                        "Retrying Gemini call for model '{}' (retry #{}) after: {}",
                                                                        extractModelName(apiUrl),
                                                                        signal.totalRetries() + 1,
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
                String errorDetail = extractErrorMessage(body);

                if (statusCode == 429 || normalizedBody.contains("resource_exhausted")) {
                        return new RuntimeException(
                                        "RESOURCE_EXHAUSTED: Rate/quota limit reached for model '" + model + "'. " + errorDetail
                        );
                }

                if (statusCode == 401
                                || statusCode == 403
                                || normalizedBody.contains("permission_denied")
                                || normalizedBody.contains("api key")) {
                        return new RuntimeException(
                                        "PERMISSION_DENIED: Key rejected for model '" + model + "'. " + errorDetail
                        );
                }

                if (statusCode == 500 || statusCode == 502 || statusCode == 503 || statusCode == 504) {
                        return new RuntimeException(
                                        "SERVER_ERROR: Gemini returned " + statusCode + " for model '" + model + "'. " + errorDetail
                        );
                }

                return new RuntimeException(
                                "Gemini API returned status " + statusCode + " for model '" + model + "': " + errorDetail
                );
        }

        /**
         * Extract the human-readable error message from Gemini's JSON error response.
         * Falls back to raw body if parsing fails.
         */
        private String extractErrorMessage(String body) {
                if (body == null || body.isBlank()) {
                        return "(no details)";
                }
                try {
                        // Gemini errors look like: {"error":{"code":429,"message":"...","status":"RESOURCE_EXHAUSTED"}}
                        int msgStart = body.indexOf("\"message\"");
                        if (msgStart >= 0) {
                                int colonPos = body.indexOf(":", msgStart);
                                int quoteStart = body.indexOf("\"", colonPos + 1);
                                int quoteEnd = body.indexOf("\"", quoteStart + 1);
                                if (quoteStart >= 0 && quoteEnd > quoteStart) {
                                        return body.substring(quoteStart + 1, quoteEnd);
                                }
                        }
                } catch (Exception ignored) {
                        // Fall through to raw body
                }
                // Return truncated body to avoid log flooding
                return body.length() > 300 ? body.substring(0, 300) + "..." : body;
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
                                || normalized.contains("server_error")
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
                                || normalized.contains("server_error")
                                || normalized.contains("500")
                                || normalized.contains("502")
                                || normalized.contains("503")
                                || normalized.contains("timeout");
        }

        private List<String> buildApiUrls(String primaryUrl, String fallbackUrl) {
                List<String> urls = new ArrayList<>();
                addUniqueNonBlank(urls, primaryUrl);
                addUniqueNonBlank(urls, fallbackUrl);

                if (urls.isEmpty()) {
                        urls.add("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
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
