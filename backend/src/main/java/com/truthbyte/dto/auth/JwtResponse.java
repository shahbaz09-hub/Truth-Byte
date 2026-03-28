package com.truthbyte.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private final String type = "Bearer";
    private UUID id;
    private String email;
    private String fullName;
}
