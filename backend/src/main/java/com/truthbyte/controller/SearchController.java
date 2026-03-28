package com.truthbyte.controller;

import com.truthbyte.dto.search.SearchResultResponse;
import com.truthbyte.service.FactCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final FactCheckService factCheckService;

    @GetMapping("/claims")
    public ResponseEntity<List<SearchResultResponse>> searchClaims(@RequestParam("q") String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(factCheckService.searchClaims(query.trim()));
    }
}
