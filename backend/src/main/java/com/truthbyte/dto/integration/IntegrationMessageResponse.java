package com.truthbyte.dto.integration;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class IntegrationMessageResponse {

    private String id;
    private String platform;
    private String chatId;
    private String groupName;
    private String detectedLanguage;
    private String verdict;
    private Double confidence;
    private String summary;
    private Integer occurrenceCount;
    private Boolean viral;
    private LocalDateTime createdAt;
}
