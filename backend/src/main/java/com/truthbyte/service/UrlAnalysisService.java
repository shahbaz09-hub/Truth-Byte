package com.truthbyte.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.truthbyte.dto.url.UrlResponse;
import com.truthbyte.entity.UrlAnalysis;
import com.truthbyte.entity.User;
import com.truthbyte.exception.AiServiceException;
import com.truthbyte.repository.UrlAnalysisRepository;
import com.truthbyte.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UrlAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(UrlAnalysisService.class);

    private final UrlAnalysisRepository urlRepository;
    private final UserRepository userRepository;
    private final GeminiClientService geminiClient;
    private final ObjectMapper objectMapper;

    @Value("${truthbyte.ai.fallback-on-quota:true}")
    private boolean fallbackOnQuota;

    private static final String SYSTEM_PROMPT = """
        You are an expert media analyst specializing in bias detection.
        Analyze the news source URL provided and return a JSON object with this exact structure:
        {
          "domain": "<extracted domain name>",
          "title": "<full name of the publication>",
          "politicalBias": <number from -100 to +100>,
          "factOpinionRatio": { "fact": <0-100>, "opinion": <0-100> },
          "manipulativeWords": ["<word 1>", "<word 2>", "<word 3>", "<word 4>", "<word 5>"],
          "credibilityScore": <number 0-100>,
          "summary": "<2-3 sentence explanation of credibility and bias>"
        }
        
        Rules:
        - Base analysis on known reputation of the source/domain
        - If unknown, give best assessment based on domain name
        - DO NOT include markdown formatting like ```json in the output. Just return the raw JSON.
        """;

    @Transactional
    public UrlResponse analyzeUrl(String url, UUID userId) {
        logger.info("Analyzing URL: {} for userId: {}", url, userId);

        // Check cache
        Optional<UrlAnalysis> cached = urlRepository.findByUrl(url);
        if (cached.isPresent()) {
            logger.debug("Cache hit for URL: {}", url);
            UrlAnalysis ua = cached.get();
            try {
                UrlResponse.FactOpinion ratio = new UrlResponse.FactOpinion();
                ratio.setFact(ua.getFactRatio());
                ratio.setOpinion(ua.getOpinionRatio());

                return UrlResponse.builder()
                        .url(ua.getUrl())
                        .domain(ua.getDomain())
                        .title(ua.getTitle())
                        .politicalBias(ua.getPoliticalBias())
                        .credibilityScore(ua.getCredibilityScore())
                        .summary(ua.getSummary())
                        .factOpinionRatio(ratio)
                        .manipulativeWords(objectMapper.readValue(ua.getManipulativeWords(),
                                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)))
                        .createdAt(ua.getCreatedAt())
                        .build();
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse cached URL analysis, re-fetching from AI: {}", e.getMessage());
            }
        }

        // Call AI
        logger.info("Calling Gemini AI for URL analysis...");
        String rawJson;
        try {
            rawJson = geminiClient.generateContent(SYSTEM_PROMPT, "Analyze this news source URL: " + url).block();
        } catch (Exception e) {
            if (fallbackOnQuota && isGeminiUnavailable(e)) {
                logger.warn("Gemini unavailable. Returning fallback URL analysis for: {}", url);
                return buildQuotaFallbackUrlResponse(url);
            }
            throw new AiServiceException("Failed to get response from AI service for URL analysis: " + e.getMessage(), e);
        }

        if (rawJson != null && rawJson.startsWith("```json")) {
            rawJson = rawJson.replace("```json", "").replace("```", "").trim();
        }

        try {
            UrlResponse aiResponse = objectMapper.readValue(rawJson, UrlResponse.class);

            // Resolve User within transaction
            User user = null;
            if (userId != null) {
                user = userRepository.findById(userId).orElse(null);
            }

            UrlAnalysis newAnalysis = UrlAnalysis.builder()
                    .user(user)
                    .url(url)
                    .domain(aiResponse.getDomain())
                    .title(aiResponse.getTitle())
                    .politicalBias(aiResponse.getPoliticalBias())
                    .credibilityScore(aiResponse.getCredibilityScore())
                    .summary(aiResponse.getSummary())
                    .factRatio(aiResponse.getFactOpinionRatio() != null ? aiResponse.getFactOpinionRatio().getFact() : null)
                    .opinionRatio(aiResponse.getFactOpinionRatio() != null ? aiResponse.getFactOpinionRatio().getOpinion() : null)
                    .manipulativeWords(objectMapper.writeValueAsString(aiResponse.getManipulativeWords()))
                    .build();

            urlRepository.save(newAnalysis);
            logger.info("URL analysis saved for domain: {}", aiResponse.getDomain());

            aiResponse.setUrl(url);
            aiResponse.setCreatedAt(newAnalysis.getCreatedAt());
            return aiResponse;
        } catch (JsonProcessingException e) {
            throw new AiServiceException("Failed to parse URL analysis AI response: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<UrlResponse> getUserUrlHistory(UUID userId) {
        logger.info("Fetching URL analysis history for userId: {}", userId);

        return urlRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ua -> {
                    try {
                        UrlResponse.FactOpinion ratio = new UrlResponse.FactOpinion();
                        ratio.setFact(ua.getFactRatio());
                        ratio.setOpinion(ua.getOpinionRatio());

                        return UrlResponse.builder()
                                .url(ua.getUrl())
                                .domain(ua.getDomain())
                                .title(ua.getTitle())
                                .politicalBias(ua.getPoliticalBias())
                                .credibilityScore(ua.getCredibilityScore())
                                .summary(ua.getSummary())
                                .factOpinionRatio(ratio)
                                .manipulativeWords(objectMapper.readValue(ua.getManipulativeWords(),
                                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)))
                                .createdAt(ua.getCreatedAt())
                                .build();
                    } catch (JsonProcessingException e) {
                        logger.error("Failed to parse stored URL analysis data: {}", e.getMessage());
                        return null;
                    }
                })
                .filter(r -> r != null)
                .collect(java.util.stream.Collectors.toList());
    }

    private boolean isGeminiUnavailable(Throwable throwable) {
        Throwable cursor = throwable;
        while (cursor != null) {
            String message = cursor.getMessage();
            if (message != null) {
                String normalized = message.toLowerCase();
                if (normalized.contains("quota exceeded")
                        || normalized.contains("resource_exhausted")
                    || normalized.contains("too_many_requests")
                    || normalized.contains("rate limit")
                        || normalized.contains("permission_denied")
                        || normalized.contains("forbidden")
                        || normalized.contains("api key was reported as leaked")
                        || normalized.contains("gemini_api_key is not configured")
                        || normalized.contains("gemini_api_key (or gemini_api_keys) is not configured")
                        || (normalized.contains("gemini_api_key") && normalized.contains("not configured"))) {
                    return true;
                }
            }
            cursor = cursor.getCause();
        }
        return false;
    }

    private UrlResponse buildQuotaFallbackUrlResponse(String inputUrl) {
        UrlResponse.FactOpinion ratio = new UrlResponse.FactOpinion(50, 50);
        String domain = extractDomain(inputUrl);

        return UrlResponse.builder()
                .url(inputUrl)
                .domain(domain)
                .title("AI analysis unavailable")
                .politicalBias(0)
                .factOpinionRatio(ratio)
                .manipulativeWords(List.of(
                        "unverified",
                        "needs context",
                        "source check",
                        "fact-check pending",
                    "ai unavailable"
                ))
                .credibilityScore(0)
                .summary("Live AI URL analysis is temporarily unavailable due to Gemini rate/quota limits or key issues. If you rotate keys, use keys from different Gemini projects and retry after a short wait.")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private String extractDomain(String inputUrl) {
        if (inputUrl == null || inputUrl.isBlank()) {
            return "unknown";
        }

        try {
            String normalized = inputUrl.startsWith("http://") || inputUrl.startsWith("https://")
                    ? inputUrl
                    : "https://" + inputUrl;
            URI uri = URI.create(normalized);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return inputUrl;
            }
            return host.replaceFirst("^www\\.", "");
        } catch (Exception ex) {
            return inputUrl;
        }
    }
}
