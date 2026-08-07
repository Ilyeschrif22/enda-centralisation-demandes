package com.enda.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
public class AuditEntry {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID demandeId;

    @Column(nullable = false)
    private String auteurUsername;

    private String auteurNom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    private String champ;

    @Column(length = 500)
    private String ancienneValeur;

    @Column(length = 500)
    private String nouvelleValeur;

    @Column(nullable = false)
    private Instant dateAction = Instant.now();
}