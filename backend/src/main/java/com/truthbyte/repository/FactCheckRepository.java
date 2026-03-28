package com.truthbyte.repository;

import com.truthbyte.entity.FactCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FactCheckRepository extends JpaRepository<FactCheck, UUID> {
    List<FactCheck> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<FactCheck> findTop20ByClaimTextContainingIgnoreCaseOrderByCreatedAtDesc(String query);
    
    // Exact match cache for saving identical AI API calls
    Optional<FactCheck> findFirstByClaimTextIgnoreCaseOrderByCreatedAtDesc(String claimText);
}
