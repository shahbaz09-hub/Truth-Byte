package com.truthbyte.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.truthbyte.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommunityReportService {

    private static final Logger logger = LoggerFactory.getLogger(CommunityReportService.class);

    private final GeminiClientService geminiClient;
    private final ObjectMapper objectMapper;

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

        String rawJson;
        try {
            rawJson = geminiClient.generateContent(SYSTEM_PROMPT, "Give me the latest trending misinformation reports from the community.").block();
        } catch (Exception e) {
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
                return Collections.emptyList();
            }

            logger.info("Fetched {} trending reports from AI", reports.size());
            return reports;
        } catch (JsonProcessingException e) {
            throw new AiServiceException("Failed to parse community reports AI response", e);
        }
    }
}
