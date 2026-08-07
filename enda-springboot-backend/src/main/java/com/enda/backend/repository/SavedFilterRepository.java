package com.enda.backend.repository;

import com.enda.backend.entity.SavedFilter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SavedFilterRepository extends JpaRepository<SavedFilter, UUID> {

    List<SavedFilter> findByKeycloakIdOrderByCreatedAtAsc(String keycloakId);

    long deleteByIdAndKeycloakId(UUID id, String keycloakId);
}