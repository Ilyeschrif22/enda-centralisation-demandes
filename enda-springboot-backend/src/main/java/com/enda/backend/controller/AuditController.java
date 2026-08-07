package com.enda.backend.controller;

import com.enda.backend.entity.AuditEntry;
import com.enda.backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/demandes/{demandeId}/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public List<AuditEntry> list(@PathVariable UUID demandeId) {
        return auditService.findByDemande(demandeId);
    }
}