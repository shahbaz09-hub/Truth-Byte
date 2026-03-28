package com.truthbyte.dto.search;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SearchResultResponse {
    private String id;
    private String claim;
    private String verdict;
    private String date;
    private double confidence;
    private String snippet;
}
