package com.truthbyte.repository;

import com.truthbyte.entity.IntegrationMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IntegrationMessageRepository extends JpaRepository<IntegrationMessage, UUID> {

    Optional<IntegrationMessage> findTopByNormalizedHashOrderByCreatedAtDesc(String normalizedHash);

    List<IntegrationMessage> findTop30ByViralTrueOrderByOccurrenceCountDescCreatedAtDesc();

    List<IntegrationMessage> findTop50ByChatIdOrderByCreatedAtDesc(String chatId);
}
