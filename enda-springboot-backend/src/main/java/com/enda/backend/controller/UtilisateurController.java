package com.enda.backend.controller;

import com.enda.backend.entity.Utilisateur;
import com.enda.backend.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    public List<Utilisateur> getUtilisateurs() {
        return utilisateurService.findAll();
    }

    @GetMapping("/{id}")
    public Utilisateur getUtilisateur(@PathVariable UUID id) {
        return utilisateurService.findById(id);
    }

    @GetMapping("/check-cin/{cin}")
    public ResponseEntity<Map<String, Boolean>> checkCin(@PathVariable String cin) {
        boolean exists = utilisateurService.existsByCin(cin);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}