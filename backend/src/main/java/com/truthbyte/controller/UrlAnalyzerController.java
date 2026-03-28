package com.truthbyte.controller;

import com.truthbyte.dto.url.UrlRequest;
import com.truthbyte.dto.url.UrlResponse;
import com.truthbyte.security.UserDetailsImpl;
import com.truthbyte.service.UrlAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analyze")
@RequiredArgsConstructor
public class UrlAnalyzerController {

    private final UrlAnalysisService urlService;

    @PostMapping("/url")
    public ResponseEntity<UrlResponse> analyzeUrl(
            @Valid @RequestBody UrlRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        UUID userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(urlService.analyzeUrl(request.getUrl(), userId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<UrlResponse>> getUserUrlHistory(
            @AuthenticationPrincipal UserDetailsImpl principal) {

        return ResponseEntity.ok(urlService.getUserUrlHistory(principal.getId()));
    }
}
