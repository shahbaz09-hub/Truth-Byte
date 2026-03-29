package com.truthbyte.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.truthbyte.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommunityReportService {

    private static final Logger logger = LoggerFactory.getLogger(CommunityReportService.class);

    private final GeminiClientService geminiClient;
    private final ObjectMapper objectMapper;

    @Value("${truthbyte.ai.fallback-on-quota:true}")
    private boolean fallbackOnQuota;

    @Value("${truthbyte.ai.community.cache-minutes:15}")
    private long cacheMinutes;

    private volatile List<Map<String, Object>> cachedReports = Collections.emptyList();
    private volatile Instant cacheExpiresAt = Instant.EPOCH;

    private static final String SYSTEM_PROMPT = """
        You are a misinformation tracking system. Return a JSON object with a "reports" array of 6-8 currently trending or notable misinformation claims being discussed online.
        Structure:
        {
          "reports": [
            {
              "id": 1,
              "claim": "<a specific, realistic misinformation claim currently circulating>",
              "category": "Health" | "Politics" | "Finance" | "Tech",
              "status": "PENDING" | "VERIFIED" | "FAKE",
              "reportedBy": "<realistic username or organization name>",
              "date": "<relative time like '2 hours ago'>",
              "votes": <number between 50 and 900>
            }
          ]
        }
        """;

    /**
     * Returns trending misinformation reports.
     * Note: In a fully fleshed-out system, this data would come from the database (CommunityReportRepository).
     * For this MVP phase, we simulate the "trending" endpoint by dynamically requesting it from AI.
     */
    public List<Map<String, Object>> getTrendingReports() {
        logger.info("Fetching trending community reports from AI...");

        if (isCacheFresh()) {
            logger.debug("Returning cached community reports ({} items)", cachedReports.size());
            return cachedReports;
        }

        String rawJson;
        try {
            rawJson = geminiClient.generateContent(SYSTEM_PROMPT, "Give me the latest trending misinformation reports from the community.").block();
        } catch (Exception e) {
            if (fallbackOnQuota && isGeminiUnavailable(e)) {
                logger.warn("Gemini unavailable for community reports. Returning fallback list: {}", e.getMessage());
                List<Map<String, Object>> fallback = buildFallbackReports();
                cacheReports(fallback);
                return fallback;
            }
            throw new AiServiceException("Failed to fetch trending reports from AI service", e);
        }

        if (rawJson != null && rawJson.startsWith("```json")) {
            rawJson = rawJson.replace("```json", "").replace("```", "").trim();
        }

        try {
            Map<String, List<Map<String, Object>>> response = objectMapper.readValue(rawJson, new TypeReference<>() {});
            List<Map<String, Object>> reports = response.get("reports");

            if (reports == null) {
                logger.warn("AI response did not contain 'reports' key");
                List<Map<String, Object>> fallback = buildFallbackReports();
                cacheReports(fallback);
                return fallback;
            }

            logger.info("Fetched {} trending reports from AI", reports.size());
            cacheReports(reports);
            return reports;
        } catch (JsonProcessingException e) {
            logger.warn("Failed to parse AI community reports. Returning fallback list: {}", e.getMessage());
            List<Map<String, Object>> fallback = buildFallbackReports();
            cacheReports(fallback);
            return fallback;
        }
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

    private boolean isCacheFresh() {
        return !cachedReports.isEmpty() && cacheExpiresAt.isAfter(Instant.now());
    }

    private void cacheReports(List<Map<String, Object>> reports) {
        long ttlMinutes = Math.max(1, cacheMinutes);
        cachedReports = List.copyOf(reports);
        cacheExpiresAt = Instant.now().plusSeconds(ttlMinutes * 60);
    }

    private List<Map<String, Object>> buildFallbackReports() {
        return List.of(
                Map.of(
                        "id", 1,
                        "claim", "A viral post claims a common kitchen ingredient can cure all viral infections overnight.",
                        "category", "Health",
                        "status", "PENDING",
                        "reportedBy", "FactCheckCommunity",
                        "date", "just now",
                        "votes", 120
                ),
                Map.of(
                        "id", 2,
                        "claim", "A circulating message says election results were changed by a hidden app update.",
                        "category", "Politics",
                        "status", "PENDING",
                        "reportedBy", "CivicWatch",
                        "date", "just now",
                        "votes", 95
                ),
                Map.of(
                        "id", 3,
                        "claim", "An investment thread guarantees fixed daily returns with zero risk using AI bots.",
                        "category", "Finance",
                        "status", "PENDING",
                        "reportedBy", "ScamAlertDesk",
                        "date", "just now",
                        "votes", 88
                )
        );
    }
}
