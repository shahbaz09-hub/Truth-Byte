package com.truthbyte.repository;

import com.truthbyte.entity.UrlAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UrlAnalysisRepository extends JpaRepository<UrlAnalysis, UUID> {
    Optional<UrlAnalysis> findByUrl(String url);
    java.util.List<UrlAnalysis> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
