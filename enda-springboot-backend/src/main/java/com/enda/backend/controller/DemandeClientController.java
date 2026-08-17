package com.enda.backend.controller;

import com.enda.backend.entity.DemandeClient;
import com.enda.backend.entity.StatutDemande;
import com.enda.backend.service.DemandeClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/demandes")
@RequiredArgsConstructor
public class DemandeClientController {

    private final DemandeClientService demandeClientService;

    private static final String SYSTEM_USERNAME = "system";
    private static final String SYSTEM_NOM = "Système";


    private String resolveUsername(String username) {
        return (username != null && !username.isBlank()) ? username : SYSTEM_USERNAME;
    }

    private String resolveNomUtilisateur(String nomUtilisateur, String username) {
        if (nomUtilisateur != null && !nomUtilisateur.isBlank()) return nomUtilisateur;
        if (username != null && !username.isBlank()) return username;
        return SYSTEM_NOM;
    }

    @PostMapping("/import")
    public void importerDemandes() {
        demandeClientService.ajouterDemandes();
    }

    @GetMapping
    public List<DemandeClient> getDemandes() {
        return demandeClientService.findAll();
    }

    @GetMapping("/{id}")
    public DemandeClient getDemande(@PathVariable UUID id) {
        return demandeClientService.findById(id);
    }

    @PatchMapping("/{id}")
    public DemandeClient updateFields(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> fields,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nomUtilisateur) {

        return demandeClientService.updateFields(
                id, fields,
                resolveUsername(username),
                resolveNomUtilisateur(nomUtilisateur, username)
        );
    }

    @PatchMapping("/{id}/statut")
    public DemandeClient changerStatut(
            @PathVariable UUID id,
            @RequestBody StatutDemande nouveauStatut,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nomUtilisateur) {

        return demandeClientService.changerStatut(
                id, nouveauStatut,
                resolveUsername(username),
                resolveNomUtilisateur(nomUtilisateur, username)
        );
    }

    @PatchMapping("/{id}/contacte")
    public DemandeClient changerContacte(
            @PathVariable UUID id,
            @RequestBody Boolean contacte,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nomUtilisateur) {

        return demandeClientService.changerContacte(
                id, contacte,
                resolveUsername(username),
                resolveNomUtilisateur(nomUtilisateur, username)
        );
    }

    @PatchMapping("/{id}/joignable")
    public DemandeClient changerJoignable(
            @PathVariable UUID id,
            @RequestBody(required = false) Boolean joignable,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nomUtilisateur) {

        return demandeClientService.changerJoignable(
                id, joignable,
                resolveUsername(username),
                resolveNomUtilisateur(nomUtilisateur, username)
        );
    }

    @PatchMapping("/{id}/interesse")
    public DemandeClient changerInteresse(
            @PathVariable UUID id,
            @RequestBody(required = false) Boolean interesse,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nomUtilisateur) {

        return demandeClientService.changerInteresse(
                id, interesse,
                resolveUsername(username),
                resolveNomUtilisateur(nomUtilisateur, username)
        );
    }

    @PostMapping
    public DemandeClient creerDemande(
            @RequestBody Map<String, Object> fields,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nomUtilisateur) {

        return demandeClientService.creerDemande(
                fields,
                resolveUsername(username),
                resolveNomUtilisateur(nomUtilisateur, username)
        );
    }

    @GetMapping("/region/{region}")
    public List<DemandeClient> getDemandesParRegion(@PathVariable String region) {
        return demandeClientService.findByRegion(region);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDemande(
            @PathVariable UUID id,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nomUtilisateur) {

        demandeClientService.deleteDemande(
                id,
                resolveUsername(username),
                resolveNomUtilisateur(nomUtilisateur, username)
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/lock")
    public DemandeClient acquireLock(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return demandeClientService.acquireLock(id, body.get("username"));
    }

    @DeleteMapping("/{id}/lock")
    public DemandeClient releaseLock(@PathVariable UUID id, @RequestParam String username) {
        return demandeClientService.releaseLock(id, username);
    }

    @PatchMapping("/{cin}/eligibility")
    public ResponseEntity<Void> updateEligibilityData(
            @PathVariable String cin,
            @RequestBody Map<String, Object> body) {

        Double eligibilityScore = body.get("eligibilityScore") != null
                ? ((Number) body.get("eligibilityScore")).doubleValue()
                : null;

        Boolean ppe = (Boolean) body.get("ppe");
        Boolean repertorie = (Boolean) body.get("repertorie");

        demandeClientService.updateEligibilityData(
                cin,
                eligibilityScore,
                ppe,
                repertorie
        );

        return ResponseEntity.noContent().build();
    }
}