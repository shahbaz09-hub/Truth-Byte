package com.truthbyte.service;

import com.truthbyte.dto.integration.IntegrationMessageRequest;
import com.truthbyte.dto.integration.IntegrationMessageResponse;
import com.truthbyte.dto.multilingual.MultilingualFactCheckResponse;
import com.truthbyte.entity.IntegrationMessage;
import com.truthbyte.repository.IntegrationMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class IntegrationMessageService {

    private static final int VIRAL_THRESHOLD = 4;

    private final IntegrationMessageRepository integrationMessageRepository;
    private final MultilingualService multilingualService;

    @Transactional
    public IntegrationMessageResponse ingest(IntegrationMessageRequest request) {
        String normalizedHash = hashClaim(request.getText());

        IntegrationMessage message = integrationMessageRepository
                .findTopByNormalizedHashOrderByCreatedAtDesc(normalizedHash)
                .map(existing -> {
                    existing.setOccurrenceCount(existing.getOccurrenceCount() + 1);
                    existing.setViral(existing.getOccurrenceCount() >= VIRAL_THRESHOLD);
                    return existing;
                })
                .orElseGet(() -> {
                    MultilingualFactCheckResponse check = multilingualService.factCheckClaim(
                            request.getText(), request.getLanguage(), request.getRegion());

                    return IntegrationMessage.builder()
                            .platform(safe(request.getPlatform(), "WHATSAPP").toUpperCase(Locale.ROOT))
                            .chatType(safe(request.getChatType(), "PRIVATE").toUpperCase(Locale.ROOT))
                            .chatId(request.getChatId())
                            .groupName(request.getGroupName())
                            .senderId(request.getSenderId())
                            .originalText(request.getText())
                            .normalizedHash(normalizedHash)
                            .detectedLanguage(check.getDetectedLanguage())
                            .verdict(check.getVerdict())
                            .confidence(check.getConfidence())
                            .summary(check.getTranslatedResponse())
                            .occurrenceCount(1)
                            .viral(false)
                            .build();
                });

        IntegrationMessage saved = integrationMessageRepository.save(message);

        return IntegrationMessageResponse.builder()
                .id(saved.getId().toString())
                .platform(saved.getPlatform())
                .chatId(saved.getChatId())
                .groupName(saved.getGroupName())
                .detectedLanguage(saved.getDetectedLanguage())
                .verdict(saved.getVerdict())
                .confidence(saved.getConfidence())
                .summary(saved.getSummary())
                .occurrenceCount(saved.getOccurrenceCount())
                .viral(saved.getViral())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    private String safe(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private String hashClaim(String claim) {
        try {
            String normalized = claim == null ? "" : claim.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(normalized.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }
}
