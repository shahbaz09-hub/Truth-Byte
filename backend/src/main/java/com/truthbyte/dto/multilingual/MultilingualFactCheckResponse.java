package com.truthbyte.dto.multilingual;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MultilingualFactCheckResponse {

    private String inputLanguage;
    private String detectedLanguage;
    private String translatedEnglish;
    private String translatedResponse;
    private String verdict;
    private Double confidence;
    private String summary;
    private List<String> localSources;
}
