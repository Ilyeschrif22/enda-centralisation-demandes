package com.enda.backend.service;

import com.enda.backend.entity.AuditAction;
import com.enda.backend.entity.AuditEntry;
import com.enda.backend.repository.AuditEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEntryRepository auditEntryRepository;

    private String toDisplay(Object value) {
        if (value == null) return "—";
        String s = String.valueOf(value);
        return s.isBlank() ? "—" : s;
    }

    public void logCreation(UUID demandeId, String username, String nomUtilisateur) {
        AuditEntry entry = new AuditEntry();
        entry.setDemandeId(demandeId);
        entry.setAuteurUsername(username);
        entry.setAuteurNom(nomUtilisateur);
        entry.setAction(AuditAction.CREATION);
        entry.setDateAction(Instant.now());
        auditEntryRepository.save(entry);
    }

    public void logSuppression(UUID demandeId, String username, String nomUtilisateur) {
        AuditEntry entry = new AuditEntry();
        entry.setDemandeId(demandeId);
        entry.setAuteurUsername(username);
        entry.setAuteurNom(nomUtilisateur);
        entry.setAction(AuditAction.SUPPRESSION);
        entry.setDateAction(Instant.now());
        auditEntryRepository.save(entry);
    }

    public void logChampSiModifie(UUID demandeId, String username, String nomUtilisateur,
                                  String champ, Object ancienneValeur, Object nouvelleValeur) {

        String ancienne = toDisplay(ancienneValeur);
        String nouvelle = toDisplay(nouvelleValeur);

        if (Objects.equals(ancienne, nouvelle)) {
            return;
        }

        AuditEntry entry = new AuditEntry();
        entry.setDemandeId(demandeId);
        entry.setAuteurUsername(username);
        entry.setAuteurNom(nomUtilisateur);
        entry.setAction(AuditAction.MODIFICATION);
        entry.setChamp(champ);
        entry.setAncienneValeur(ancienne);
        entry.setNouvelleValeur(nouvelle);
        entry.setDateAction(Instant.now());
        auditEntryRepository.save(entry);
    }

    public List<AuditEntry> findByDemande(UUID demandeId) {
        return auditEntryRepository.findByDemandeIdOrderByDateActionAsc(demandeId);
    }
}