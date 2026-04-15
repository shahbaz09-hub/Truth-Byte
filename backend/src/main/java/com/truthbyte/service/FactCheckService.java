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

import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
        You are an expert fact-checker. Analyze the given claim and return a JSON object with these fields:
        - "verdict": one of "TRUE", "FALSE", or "MISLEADING"
        - "confidence": a number between 60 and 99 (no % sign)
        - "summary": a clear 2-3 sentence explanation of your verdict
        - "keyPoints": an array of exactly 4 key findings
        - "sources": an array of exactly 4 credible source names or URLs that support your analysis
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
            logger.warn("Malformed AI JSON on first attempt. Trying recovery. Error: {}",
                    firstParseError.getOriginalMessage());

            // Try to recover structured data from the malformed response
            ClaimResponse recovered = tryRecoverClaimResponse(rawJsonBlock, claimText);
            if (recovered != null) {
                logger.info("Successfully recovered fact-check from malformed AI output.");
                return recovered;
            }

            // One more AI call as last resort
            try {
                String retryRawJson = geminiClient
                        .generateContent(SYSTEM_PROMPT, "Fact-check this claim: \"" + claimText + "\"")
                        .block();
                aiResponse = parseClaimResponse(retryRawJson);
            } catch (Exception retryError) {
                if (fallbackOnQuota && isGeminiUnavailable(retryError)) {
                    logger.warn("Gemini unavailable during retry. Returning fallback.");
                    return buildQuotaFallbackClaim(claimText);
                }
                logger.warn("AI retry also failed. Returning fallback. Error: {}", retryError.getMessage());
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

    private ClaimResponse tryRecoverClaimResponse(String rawResponse, String claimText) {
        String cleaned = sanitizeAiJson(rawResponse);
        if (cleaned.isBlank()) {
            return null;
        }

        String verdict = extractVerdict(cleaned);
        Double confidence = extractConfidence(cleaned);
        String summary = extractQuotedField(cleaned, "summary");
        List<String> keyPoints = extractQuotedArray(cleaned, "keyPoints");
        List<String> sources = extractQuotedArray(cleaned, "sources");

        if (verdict == null && summary == null && keyPoints.isEmpty() && sources.isEmpty()) {
            return null;
        }

        List<String> defaultKeyPoints = List.of(
                "AI response format was partially malformed and has been recovered.",
                "Treat this result as a provisional automated assessment.",
                "Cross-check the claim with trusted fact-check outlets.",
                "Retry the same claim if you need a cleaner model response."
        );
        List<String> defaultSources = List.of(
                "Reuters Fact Check",
                "AP Fact Check",
                "Snopes",
                "PolitiFact"
        );

        String safeVerdict = verdict != null ? verdict : "MISLEADING";
        Double safeConfidence = confidence != null ? confidence : 62.0;
        String safeSummary = (summary != null && !summary.isBlank())
                ? summary
                : "AI output was partially recovered from malformed JSON. Verify this claim with trusted sources.";

        return ClaimResponse.builder()
                .verdict(safeVerdict)
                .confidence(safeConfidence)
                .summary(safeSummary)
                .keyPoints(normalizeList(keyPoints, defaultKeyPoints, 4))
                .sources(normalizeList(sources, defaultSources, 4))
                .claimText(claimText)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private String extractVerdict(String raw) {
        Matcher matcher = Pattern.compile("\\b(TRUE|FALSE|MISLEADING)\\b", Pattern.CASE_INSENSITIVE).matcher(raw);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group(1).toUpperCase();
    }

    private Double extractConfidence(String raw) {
        Matcher matcher = Pattern.compile("\"confidence\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE)
                .matcher(raw);
        if (!matcher.find()) {
            return null;
        }

        try {
            double parsed = Double.parseDouble(matcher.group(1));
            return Math.max(0.0, Math.min(100.0, parsed));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String extractQuotedField(String raw, String field) {
        String regex = "\\\"" + Pattern.quote(field) + "\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"";
        Matcher matcher = Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(raw);
        if (!matcher.find()) {
            return null;
        }

        String value = matcher.group(1);
        return value != null ? value.trim() : null;
    }

    private List<String> extractQuotedArray(String raw, String field) {
        String regex = "\\\"" + Pattern.quote(field) + "\\\"\\s*:\\s*\\[(.*?)]";
        Matcher blockMatcher = Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(raw);
        if (!blockMatcher.find()) {
            return List.of();
        }

        String block = blockMatcher.group(1);
        if (block == null || block.isBlank()) {
            return List.of();
        }

        List<String> values = new ArrayList<>();
        Matcher valueMatcher = Pattern.compile("\\\"([^\\\"]+)\\\"").matcher(block);
        while (valueMatcher.find()) {
            String value = valueMatcher.group(1);
            if (value != null && !value.isBlank()) {
                values.add(value.trim());
            }
        }
        return values;
    }

    private List<String> normalizeList(List<String> parsedValues, List<String> defaultValues, int expectedSize) {
        List<String> normalized = new ArrayList<>();

        if (parsedValues != null) {
            for (String value : parsedValues) {
                if (value != null && !value.isBlank()) {
                    normalized.add(value.trim());
                }
                if (normalized.size() == expectedSize) {
                    break;
                }
            }
        }

        for (String fallback : defaultValues) {
            if (normalized.size() == expectedSize) {
                break;
            }
            normalized.add(fallback);
        }

        return normalized;
    }
}
