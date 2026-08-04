package com.enda.backend.controller;

import com.enda.backend.entity.Commentaire;
import com.enda.backend.service.CommentaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/demandes/{demandeId}/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireService commentaireService;

    @GetMapping
    public List<Commentaire> list(@PathVariable UUID demandeId) {
        return commentaireService.findByDemande(demandeId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Commentaire create(@PathVariable UUID demandeId, @RequestBody Map<String, String> body) {
        String texte = body.get("texte");
        String auteurUsername = body.get("auteurUsername");
        String auteurNom = body.get("auteurNom");

        if (texte == null || texte.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Commentaire vide");
        }

        return commentaireService.ajouterCommentaire(demandeId, auteurUsername, auteurNom, texte.trim());
    }
}