package com.truthbyte.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "integration_messages",
        indexes = {
                @Index(name = "idx_integration_messages_hash", columnList = "normalizedHash"),
                @Index(name = "idx_integration_messages_chat", columnList = "chatId")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String platform; // WHATSAPP | TELEGRAM

    @Column(nullable = false, length = 20)
    private String chatType; // PRIVATE | GROUP

    @Column(nullable = false, length = 120)
    private String chatId;

    @Column(length = 180)
    private String groupName;

    @Column(length = 120)
    private String senderId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String originalText;

    @Column(nullable = false, length = 80)
    private String normalizedHash;

    @Column(length = 12)
    private String detectedLanguage;

    @Column(length = 20)
    private String verdict;

    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Builder.Default
    @Column(nullable = false)
    private Integer occurrenceCount = 1;

    @Builder.Default
    @Column(nullable = false)
    private Boolean viral = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
