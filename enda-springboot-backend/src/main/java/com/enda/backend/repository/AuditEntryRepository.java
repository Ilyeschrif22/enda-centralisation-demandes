package com.enda.backend.repository;

import com.enda.backend.entity.AuditEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditEntryRepository extends JpaRepository<AuditEntry, UUID> {
    List<AuditEntry> findByDemandeIdOrderByDateActionAsc(UUID demandeId);
}