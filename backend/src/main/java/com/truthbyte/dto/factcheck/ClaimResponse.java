package com.truthbyte.dto.factcheck;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimResponse {
    private String verdict;
    private Double confidence;
    private String summary;
    private List<String> keyPoints;
    private List<String> sources;
    private String claimText;
    private LocalDateTime createdAt;
}
