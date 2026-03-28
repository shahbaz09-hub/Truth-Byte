package com.truthbyte.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fact_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Can be null if checked anonymously before login

    @Column(columnDefinition = "TEXT", nullable = false)
    private String claimText;

    @Column(nullable = false)
    private String aiVerdict; // TRUE, FALSE, MISLEADING

    @Column(nullable = false)
    private Double aiConfidence;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String aiSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String keyPoints; // Stored as JSON string mapped to JSONB

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String sources; // Stored as JSON string mapped to JSONB

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
