package com.truthbyte.dto.integration;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IntegrationMessageRequest {

    @NotBlank(message = "platform is required")
    private String platform;

    @NotBlank(message = "chatType is required")
    private String chatType;

    @NotBlank(message = "chatId is required")
    private String chatId;

    private String groupName;

    private String senderId;

    @NotBlank(message = "text is required")
    private String text;

    private String language;

    private String region;
}
