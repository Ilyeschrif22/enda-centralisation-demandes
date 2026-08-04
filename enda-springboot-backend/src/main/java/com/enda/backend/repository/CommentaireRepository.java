package com.enda.backend.repository;

import com.enda.backend.entity.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentaireRepository extends JpaRepository<Commentaire, UUID> {
    List<Commentaire> findByDemande_IdOrderByDateCreationAsc(UUID demandeId);
}