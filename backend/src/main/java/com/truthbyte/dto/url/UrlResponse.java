package com.truthbyte.dto.url;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class UrlResponse {
    private String url;
    private String domain;
    private String title;
    private Integer politicalBias;

    @JsonProperty("factOpinionRatio")
    private FactOpinion factOpinionRatio;

    private List<String> manipulativeWords;
    private Integer credibilityScore;
    private String summary;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FactOpinion {
        private Integer fact;
        private Integer opinion;
    }
}
