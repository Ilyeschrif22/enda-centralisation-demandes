package com.enda.backend.service;

import com.enda.backend.entity.Commentaire;
import com.enda.backend.entity.DemandeClient;
import com.enda.backend.repository.CommentaireRepository;
import com.enda.backend.repository.DemandeClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final DemandeClientRepository demandeClientRepository;

    public List<Commentaire> findByDemande(UUID demandeId) {
        return commentaireRepository.findByDemande_IdOrderByDateCreationAsc(demandeId);
    }

    public Commentaire ajouterCommentaire(UUID demandeId, String auteurUsername, String auteurNom, String texte) {
        DemandeClient demande = demandeClientRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        Commentaire commentaire = new Commentaire();
        commentaire.setDemande(demande);
        commentaire.setAuteurUsername(auteurUsername);
        commentaire.setAuteurNom(auteurNom);
        commentaire.setTexte(texte);
        commentaire.setDateCreation(Instant.now());

        return commentaireRepository.save(commentaire);
    }
}