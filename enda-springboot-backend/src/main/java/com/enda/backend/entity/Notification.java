package com.enda.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private AppUser destinataire;

    @Column(nullable = false)
    private String titre;

    @Column(length = 1000)
    private String message;

    @Column(nullable = false)
    private Boolean lu = false;

    @Column(nullable = false)
    private Instant dateCreation = Instant.now();

    private String lien;
}