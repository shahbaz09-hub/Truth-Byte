package com.truthbyte.service;

import com.truthbyte.dto.gemini.GeminiRequest;
import com.truthbyte.dto.gemini.GeminiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class GeminiClientService {

        private static final Logger logger = LoggerFactory.getLogger(GeminiClientService.class);

        private final WebClient webClient;
        private final String geminiApiUrl;
        private final String geminiApiKey;

        public GeminiClientService(WebClient.Builder webClientBuilder,
                        @Value("${truthbyte.ai.gemini.url}") String geminiApiUrl,
                        @Value("${truthbyte.ai.gemini.api-key}") String geminiApiKey) {
                this.webClient = webClientBuilder
                                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)) // 2MB
                                                                                                                   // buffer
                                .build();
                this.geminiApiUrl = geminiApiUrl;
                this.geminiApiKey = geminiApiKey;
        }

        public Mono<String> generateContent(String systemInstruction, String userMessage) {
                if (geminiApiKey == null || geminiApiKey.isBlank()) {
                        return Mono.error(new RuntimeException(
                                        "GEMINI_API_KEY is not configured on backend. Please set it and retry."));
                }

                GeminiRequest request = GeminiRequest.builder()
                                .systemInstruction(GeminiRequest.SystemInstruction.builder()
                                                .parts(List.of(GeminiRequest.Part.builder().text(systemInstruction)
                                                                .build()))
                                                .build())
                                .contents(List.of(GeminiRequest.Content.builder()
                                                .role("user")
                                                .parts(List.of(GeminiRequest.Part.builder().text(userMessage).build()))
                                                .build()))
                                .generationConfig(GeminiRequest.GenerationConfig.builder()
                                                .temperature(0.3)
                                                .responseMimeType("application/json")
                                                .build())
                                .build();

                return webClient.post()
                                .uri(geminiApiUrl + "?key=" + geminiApiKey)
                                .bodyValue(request)
                                .retrieve()
                                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                                                .flatMap(body -> {
                                                        logger.error("Gemini API error [{}]: {}", response.statusCode(),
                                                                        body);
                                                        if (response.statusCode().value() == 429) {
                                                                return Mono.error(new RuntimeException(
                                                                                "Gemini API quota exceeded. Please wait and retry, or use a key with available quota."));
                                                        }
                                                        return Mono.error(new RuntimeException(
                                                                        "Gemini API returned status "
                                                                                        + response.statusCode() + ": "
                                                                                        + body));
                                                }))
                                .bodyToMono(GeminiResponse.class)
                                .map(response -> {
                                        String extractedText = response.getExtractedText();
                                        if (extractedText == null || extractedText.isBlank()) {
                                                throw new RuntimeException("Invalid or empty response from Gemini API");
                                        }
                                        return extractedText;
                                })
                                .doOnError(e -> logger.error("Error communicating with Gemini AI: {}", e.getMessage()))
                                .onErrorResume(e -> Mono.error(new RuntimeException(
                                                "Error communicating with Gemini AI: " + e.getMessage())));
        }
}
