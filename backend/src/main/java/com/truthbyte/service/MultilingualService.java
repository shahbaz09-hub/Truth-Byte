package com.truthbyte.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.truthbyte.dto.multilingual.MultilingualFactCheckResponse;
import com.truthbyte.dto.multilingual.SupportedLanguageResponse;
import com.truthbyte.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MultilingualService {

    private final GeminiClientService geminiClient;
    private final ObjectMapper objectMapper;

    private static final Map<String, String> SUPPORTED_LANGUAGES = new LinkedHashMap<>();

    private static final Map<String, List<String>> LOCAL_SOURCES = Map.of(
            "hi", List.of("PIB Fact Check", "Alt News Hindi", "Dainik Bhaskar Fact Check"),
            "ur", List.of("Geo Fact Check", "AFP Fact Check Urdu", "Dawn Verification Desk"),
            "bn", List.of("Boom Bangladesh", "BBC Bangla Reality Check", "Prothom Alo Fact Watch"),
            "ta", List.of("Tamil Fact Crescendo", "NewsMinute Fact Check", "OneIndia Tamil Verify")
    );

    static {
        SUPPORTED_LANGUAGES.put("hi", "Hindi");
        SUPPORTED_LANGUAGES.put("ur", "Urdu");
        SUPPORTED_LANGUAGES.put("bn", "Bengali");
        SUPPORTED_LANGUAGES.put("ta", "Tamil");
        SUPPORTED_LANGUAGES.put("en", "English");
    }

    public MultilingualFactCheckResponse factCheckClaim(String claim, String language, String region) {
        String safeLanguage = sanitizeLanguage(language);
        String safeRegion = region == null || region.isBlank() ? "IN" : region.toUpperCase(Locale.ROOT);

        String systemPrompt = """
                You are a multilingual fact-checking engine. Analyze the given claim and return a JSON object with these fields:
                - "detectedLanguage": the ISO language code of the input claim
                - "translatedEnglish": the English translation of the claim
                - "translatedResponse": a short explanation of your verdict translated back into the input language
                - "verdict": one of "TRUE", "FALSE", or "MISLEADING"
                - "confidence": a number between 60 and 99
                - "summary": a 2-sentence summary in English
                - "localSources": an array of 3 fact-checking sources relevant to the language and region
                """;

        String userPrompt = "Language code: " + safeLanguage
                + "\nRegion: " + safeRegion
                + "\nClaim: " + claim;

        try {
            String raw = geminiClient.generateContent(systemPrompt, userPrompt).block();
            Map<String, Object> parsed = parseJson(raw);

            return MultilingualFactCheckResponse.builder()
                    .inputLanguage(safeLanguage)
                    .detectedLanguage(asString(parsed.get("detectedLanguage"), safeLanguage))
                    .translatedEnglish(asString(parsed.get("translatedEnglish"), claim))
                    .translatedResponse(asString(parsed.get("translatedResponse"), asString(parsed.get("summary"), "")))
                    .verdict(asString(parsed.get("verdict"), "MISLEADING"))
                    .confidence(asDouble(parsed.get("confidence"), 70.0))
                    .summary(asString(parsed.get("summary"), "No summary available."))
                    .localSources(asStringList(parsed.get("localSources"), getLocalSources(safeLanguage, safeRegion)))
                    .build();
        } catch (Exception ex) {
            throw new AiServiceException("Multilingual fact-check failed", ex);
        }
    }

    public List<SupportedLanguageResponse> getSupportedLanguages() {
        List<SupportedLanguageResponse> result = new ArrayList<>();
        for (Map.Entry<String, String> entry : SUPPORTED_LANGUAGES.entrySet()) {
            result.add(SupportedLanguageResponse.builder().code(entry.getKey()).label(entry.getValue()).build());
        }
        return result;
    }

    public List<String> getLocalSources(String language, String region) {
        String code = sanitizeLanguage(language);
        List<String> sources = LOCAL_SOURCES.get(code);
        if (sources != null && !sources.isEmpty()) {
            return sources;
        }
        return List.of("AFP Fact Check", "Reuters Fact Check", "Snopes");
    }

    private String sanitizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "en";
        }
        String normalized = language.toLowerCase(Locale.ROOT).trim();
        if (!SUPPORTED_LANGUAGES.containsKey(normalized)) {
            return "en";
        }
        return normalized;
    }

    private Map<String, Object> parseJson(String raw) throws Exception {
        String clean = raw == null ? "{}" : raw.trim();
        if (clean.startsWith("```json")) {
            clean = clean.replace("```json", "").replace("```", "").trim();
        }
        return objectMapper.readValue(clean, new TypeReference<>() {});
    }

    private String asString(Object value, String fallback) {
        return value instanceof String s && !s.isBlank() ? s : fallback;
    }

    private Double asDouble(Object value, Double fallback) {
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        return fallback;
    }

    @SuppressWarnings("unchecked")
    private List<String> asStringList(Object value, List<String> fallback) {
        if (value instanceof List<?> list && !list.isEmpty()) {
            return list.stream().map(String::valueOf).toList();
        }
        return fallback;
    }
}
