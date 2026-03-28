package com.truthbyte.controller;

import com.truthbyte.dto.integration.IntegrationMessageRequest;
import com.truthbyte.dto.integration.IntegrationMessageResponse;
import com.truthbyte.service.IntegrationMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationMessageService integrationMessageService;

    @PostMapping("/messages/ingest")
    public ResponseEntity<IntegrationMessageResponse> ingestMessage(@Valid @RequestBody IntegrationMessageRequest request) {
        return ResponseEntity.ok(integrationMessageService.ingest(request));
    }
}
