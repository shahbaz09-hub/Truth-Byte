package com.truthbyte.dto.multilingual;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MultilingualFactCheckRequest {

    @NotBlank(message = "claim is required")
    private String claim;

    @NotBlank(message = "language is required")
    private String language;

    private String region;
}
