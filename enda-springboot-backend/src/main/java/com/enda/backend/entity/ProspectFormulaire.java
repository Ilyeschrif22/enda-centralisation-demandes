package com.enda.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
public class ProspectFormulaire {

    @Id
    @GeneratedValue
    private UUID id;

    private LocalDateTime timestamp;

    private String typeDemande;

    private String nom;

    private String prenom;

    private LocalDate dateNaissance;

    private String genre;

    private String situationFamiliale;

    private String secteurActivite;

    private String cin;

    private String telephone;

    private String projet;

    private String utilisationPret;

    private String adresse;

    private String gouvernorat;

    private String delegation;

    private String codePostal;

    private String montantDemande;

    private String agenceProche;

    private Integer capaciteRemboursement;

    private String dureePret;

    @Enumerated(EnumType.STRING)
    private Canal canal;

    @Column(length = 2000)
    private String remarques;
}