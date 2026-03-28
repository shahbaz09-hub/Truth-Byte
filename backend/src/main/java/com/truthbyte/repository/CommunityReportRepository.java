package com.truthbyte.repository;

import com.truthbyte.entity.CommunityReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommunityReportRepository extends JpaRepository<CommunityReport, UUID> {
    List<CommunityReport> findAllByOrderByUpvotesDescCreatedAtDesc();
}
