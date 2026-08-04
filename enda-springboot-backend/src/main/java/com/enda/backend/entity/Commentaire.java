package com.enda.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
public class Commentaire {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    private DemandeClient demande;

    @Column(nullable = false)
    private String auteurUsername;

    private String auteurNom;

    @Column(nullable = false, length = 1000)
    private String texte;

    @Column(nullable = false)
    private Instant dateCreation = Instant.now();
}