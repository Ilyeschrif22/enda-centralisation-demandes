package com.enda.backend.service;

import com.enda.backend.entity.Commentaire;
import com.enda.backend.entity.DemandeClient;
import com.enda.backend.repository.CommentaireRepository;
import com.enda.backend.repository.DemandeClientRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final DemandeClientRepository demandeClientRepository;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<Commentaire> findByDemande(UUID demandeId) {
        List<Commentaire> commentaires =
                commentaireRepository.findByDemande_IdOrderByDateCreationAsc(demandeId);

        commentaires.forEach(c -> c.setDemande(null));

        return commentaires;
    }

    @Transactional
    public Commentaire ajouterCommentaire(UUID demandeId, String auteurUsername, String auteurNom, String texte) {
        DemandeClient demande = demandeClientRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        Commentaire commentaire = new Commentaire();
        commentaire.setDemande(demande);
        commentaire.setAuteurUsername(auteurUsername);
        commentaire.setAuteurNom(auteurNom);
        commentaire.setTexte(texte);
        commentaire.setDateCreation(Instant.now());

        Commentaire saved = commentaireRepository.saveAndFlush(commentaire);


        entityManager.detach(saved);
        saved.setDemande(null);

        return saved;
    }
}