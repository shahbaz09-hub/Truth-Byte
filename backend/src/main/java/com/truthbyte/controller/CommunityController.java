package com.truthbyte.controller;

import com.truthbyte.service.CommunityReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityReportService reportService;

    @GetMapping("/trending")
    public ResponseEntity<List<Map<String, Object>>> getTrendingReports() {
        return ResponseEntity.ok(reportService.getTrendingReports());
    }
}
