package com.truthbyte.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "url_analyses", indexes = {
    @Index(name = "idx_url_analyses_url", columnList = "url"),
    @Index(name = "idx_url_analyses_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UrlAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String domain;

    @Column
    private String title;

    @Column(name = "political_bias")
    private Integer politicalBias;

    @Column(name = "credibility_score")
    private Integer credibilityScore;

    @Column(name = "fact_ratio")
    private Integer factRatio;

    @Column(name = "opinion_ratio")
    private Integer opinionRatio;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String manipulativeWords;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
