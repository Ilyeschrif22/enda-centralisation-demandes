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
            @RequestBody Map<String, Object> fields) {

        return demandeClientService.updateFields(id, fields);
    }

    @PatchMapping("/{id}/statut")
    public DemandeClient changerStatut(
            @PathVariable UUID id,
            @RequestBody StatutDemande nouveauStatut) {

        return demandeClientService.changerStatut(id, nouveauStatut);
    }

    @PatchMapping("/{id}/contacte")
    public DemandeClient changerContacte(
            @PathVariable UUID id,
            @RequestBody Boolean contacte) {
        return demandeClientService.changerContacte(id, contacte);
    }

    @PatchMapping("/{id}/joignable")
    public DemandeClient changerJoignable(
            @PathVariable UUID id,
            @RequestBody(required = false) Boolean joignable) {
        return demandeClientService.changerJoignable(id, joignable);
    }

    @PostMapping
    public DemandeClient creerDemande(@RequestBody Map<String, Object> fields) {
        return demandeClientService.creerDemande(fields);
    }

    @GetMapping("/region/{region}")
    public List<DemandeClient> getDemandesParRegion(@PathVariable String region) {
        return demandeClientService.findByRegion(region);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDemande(@PathVariable UUID id) {
        demandeClientService.deleteDemande(id);
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
}