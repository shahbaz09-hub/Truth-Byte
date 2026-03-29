package com.truthbyte.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.truthbyte.dto.factcheck.ClaimResponse;
import com.truthbyte.dto.search.SearchResultResponse;
import com.truthbyte.entity.FactCheck;
import com.truthbyte.entity.User;
import com.truthbyte.exception.AiServiceException;
import com.truthbyte.repository.FactCheckRepository;
import com.truthbyte.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FactCheckService {

    private static final Logger logger = LoggerFactory.getLogger(FactCheckService.class);

    private final FactCheckRepository factCheckRepository;
    private final UserRepository userRepository;
    private final GeminiClientService geminiClient;
    private final ObjectMapper objectMapper;

    @Value("${truthbyte.ai.fallback-on-quota:true}")
    private boolean fallbackOnQuota;

    private static final String SYSTEM_PROMPT = """
        You are an expert fact-checker. \
        Analyze claims with rigorous journalistic standards. \
        Always respond with a JSON object matching this exact structure:
        {
          "verdict": "TRUE" | "FALSE" | "MISLEADING",
          "confidence": <number 60-99>,
          "summary": "<2-4 sentence explanation of why this verdict was reached>",
          "keyPoints": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>"],
          "sources": ["<source name 1>", "<source name 2>", "<source name 3>", "<source name 4>"]
        }
        
        Rules:
        - verdict must be exactly "TRUE", "FALSE", or "MISLEADING"
        - confidence is a number (no % sign)
        - keyPoints must have exactly 4 items
        - sources must have exactly 4 items
        - DO NOT include markdown formatting like ```json in the output. Just return the raw JSON.
        """;

    private static final String STRICT_JSON_RETRY_APPENDIX = """
        CRITICAL OUTPUT RULES (must follow exactly):
        - Return ONLY one valid JSON object.
        - Close all quotes and braces.
        - Do not include markdown, explanation, or extra text.
        """;

    @Transactional
    public ClaimResponse verifyClaim(String claimText, UUID userId) {
        logger.info("Verifying claim for userId: {}", userId);

        // 1. Check Cache (Database)
        Optional<FactCheck> cached = factCheckRepository.findFirstByClaimTextIgnoreCaseOrderByCreatedAtDesc(claimText);
        if (cached.isPresent()) {
            logger.debug("Cache hit for claim: {}", claimText.substring(0, Math.min(50, claimText.length())));
            FactCheck fc = cached.get();
            try {
                return ClaimResponse.builder()
                        .verdict(fc.getAiVerdict())
                        .confidence(fc.getAiConfidence())
                        .summary(fc.getAiSummary())
                        .keyPoints(objectMapper.readValue(fc.getKeyPoints(),
                                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)))
                        .sources(objectMapper.readValue(fc.getSources(),
                                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)))
                        .claimText(fc.getClaimText())
                        .createdAt(fc.getCreatedAt())
                        .build();
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse cached fact-check, re-checking via AI: {}", e.getMessage());
            }
        }

        // 2. Call AI
        logger.info("Calling Gemini AI for fact-check...");
        String rawJsonBlock;
        try {
            rawJsonBlock = geminiClient.generateContent(SYSTEM_PROMPT, "Fact-check this claim: \"" + claimText + "\"").block();
        } catch (Exception e) {
            if (fallbackOnQuota && isGeminiUnavailable(e)) {
                logger.warn("Gemini unavailable. Returning fallback claim response for: {}", claimText);
                return buildQuotaFallbackClaim(claimText);
            }
            throw new AiServiceException("Failed to get response from AI service: " + e.getMessage(), e);
        }

        // 3. Parse JSON with recovery (sanitize/extract + one strict retry)
        ClaimResponse aiResponse;
        try {
            aiResponse = parseClaimResponse(rawJsonBlock);
        } catch (JsonProcessingException firstParseError) {
            logger.warn("Malformed AI JSON on first attempt. Retrying once with stricter JSON prompt. Error: {}",
                    firstParseError.getOriginalMessage());

            String retryRawJson;
            try {
                retryRawJson = geminiClient
                        .generateContent(SYSTEM_PROMPT + "\n" + STRICT_JSON_RETRY_APPENDIX,
                                "Fact-check this claim: \"" + claimText + "\"")
                        .block();
                aiResponse = parseClaimResponse(retryRawJson);
            } catch (Exception retryError) {
                if (fallbackOnQuota && isGeminiUnavailable(retryError)) {
                    logger.warn("Gemini unavailable during strict retry. Returning quota fallback response for claim.");
                    return buildQuotaFallbackClaim(claimText);
                }
                logger.warn("AI returned malformed output after retry. Returning malformed-response fallback. Error: {}",
                        retryError.getMessage());
                return buildMalformedFallbackClaim(claimText);
            }
        }

        // 4. Resolve User within transaction and save
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        try {
            FactCheck newCheck = FactCheck.builder()
                    .user(user)
                    .claimText(claimText)
                    .aiVerdict(aiResponse.getVerdict())
                    .aiConfidence(aiResponse.getConfidence())
                    .aiSummary(aiResponse.getSummary())
                    .keyPoints(objectMapper.writeValueAsString(aiResponse.getKeyPoints()))
                    .sources(objectMapper.writeValueAsString(aiResponse.getSources()))
                    .build();

            factCheckRepository.save(newCheck);
            logger.info("Fact-check saved with verdict: {}", aiResponse.getVerdict());

            aiResponse.setClaimText(claimText);
            aiResponse.setCreatedAt(newCheck.getCreatedAt());
            return aiResponse;
        } catch (JsonProcessingException e) {
            throw new AiServiceException("Failed to serialize fact-check response for persistence: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getUserHistory(UUID userId) {
        logger.info("Fetching fact-check history for userId: {}", userId);

        return factCheckRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(fc -> {
                    try {
                        return ClaimResponse.builder()
                                .verdict(fc.getAiVerdict())
                                .confidence(fc.getAiConfidence())
                                .summary(fc.getAiSummary())
                                .keyPoints(objectMapper.readValue(fc.getKeyPoints(),
                                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)))
                                .sources(objectMapper.readValue(fc.getSources(),
                                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)))
                                .claimText(fc.getClaimText())
                                .createdAt(fc.getCreatedAt())
                                .build();
                    } catch (JsonProcessingException e) {
                        logger.error("Failed to parse stored fact-check data: {}", e.getMessage());
                        return null;
                    }
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SearchResultResponse> searchClaims(String query) {
        logger.info("Searching fact-checks for query: {}", query);

        return factCheckRepository.findTop20ByClaimTextContainingIgnoreCaseOrderByCreatedAtDesc(query)
                .stream()
                .map(fc -> SearchResultResponse.builder()
                        .id(fc.getId().toString())
                        .claim(fc.getClaimText())
                        .verdict(fc.getAiVerdict())
                        .date(fc.getCreatedAt() != null ? fc.getCreatedAt().toString() : "Recent")
                        .confidence(fc.getAiConfidence() != null ? fc.getAiConfidence() : 0.0)
                        .snippet(fc.getAiSummary())
                        .build())
                .collect(Collectors.toList());
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

    private ClaimResponse buildQuotaFallbackClaim(String claimText) {
        return ClaimResponse.builder()
                .verdict("MISLEADING")
                .confidence(0.0)
                .summary("Live AI analysis is temporarily unavailable due to Gemini rate/quota limits or key issues. If you rotate keys, use keys from different Gemini projects and retry after a short wait.")
                .keyPoints(List.of(
                "Gemini service is currently unavailable for this request.",
                        "A full automated fact-check could not be completed right now.",
                "Try again later or switch to a valid Gemini key/project.",
                        "Use known trusted sources before acting on this claim."
                ))
                .sources(List.of(
                "Google Gemini API dashboard",
                        "Backend service logs",
                        "Configured API key project usage",
                "Retry with a valid key"
                ))
                .claimText(claimText)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ClaimResponse parseClaimResponse(String rawJsonBlock) throws JsonProcessingException {
        String cleaned = sanitizeAiJson(rawJsonBlock);
        return objectMapper.readValue(cleaned, ClaimResponse.class);
    }

    private String sanitizeAiJson(String rawJsonBlock) {
        if (rawJsonBlock == null) {
            return "";
        }

        String cleaned = rawJsonBlock.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace("```json", "").replace("```", "").trim();
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace("```", "").trim();
        }

        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        return cleaned.trim();
    }

    private ClaimResponse buildMalformedFallbackClaim(String claimText) {
        return ClaimResponse.builder()
                .verdict("MISLEADING")
                .confidence(0.0)
                .summary("AI returned an incomplete response for this claim. Please retry once; if it persists, check backend logs and Gemini limits.")
                .keyPoints(List.of(
                        "The model output was truncated or not valid JSON.",
                        "A strict retry was attempted but still failed.",
                        "Please retry the claim once after a short wait.",
                        "Use trusted sources before taking action."
                ))
                .sources(List.of(
                        "Backend service logs",
                        "Gemini API response traces",
                        "Google AI Studio usage dashboard",
                        "Trusted fact-check organizations"
                ))
                .claimText(claimText)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
