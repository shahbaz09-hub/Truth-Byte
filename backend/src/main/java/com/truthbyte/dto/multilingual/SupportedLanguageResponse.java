package com.truthbyte.dto.multilingual;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupportedLanguageResponse {

    private String code;
    private String label;
}
