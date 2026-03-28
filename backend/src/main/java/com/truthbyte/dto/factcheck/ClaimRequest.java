package com.truthbyte.dto.factcheck;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClaimRequest {
    @NotBlank(message = "Claim cannot be empty")
    private String claim;
}
