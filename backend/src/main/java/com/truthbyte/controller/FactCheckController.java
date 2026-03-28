package com.truthbyte.controller;

import com.truthbyte.dto.factcheck.ClaimRequest;
import com.truthbyte.dto.factcheck.ClaimResponse;
import com.truthbyte.security.UserDetailsImpl;
import com.truthbyte.service.FactCheckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/verify")
@RequiredArgsConstructor
public class FactCheckController {

    private final FactCheckService factCheckService;

    @PostMapping("/claim")
    public ResponseEntity<ClaimResponse> verifyClaim(
            @Valid @RequestBody ClaimRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        UUID userId = principal != null ? principal.getId() : null;
        ClaimResponse response = factCheckService.verifyClaim(request.getClaim(), userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ClaimResponse>> getUserHistory(
            @AuthenticationPrincipal UserDetailsImpl principal) {

        return ResponseEntity.ok(factCheckService.getUserHistory(principal.getId()));
    }
}
