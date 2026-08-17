package com.enda.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter
@Setter
public class DemandeClient {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(nullable = false)
    private Integer numeroDemande = 1;

    private LocalDate dateSaisie;

    @Enumerated(EnumType.STRING)
    private TypeDemande typeDemande;

    private String agence;
    private String activite;
    private String secteurActivite;
    private String besoin;
    private String adresseProjet;
    private String typeClient;
    private String montant;
    private String dureePret;
    private Integer capaciteRemboursement;
    private Boolean joignable;
    private String statutProjet;
    private String retourAgence;
    private String verrouillePar;
    private Instant verrouilleDepuis;
    private Boolean interesse;

    private Double eligibilityScore;

    @Column(name = "ppe")
    private Boolean ppe;

    @Column(name = "repertorie")
    private Boolean repertorie;


    @Enumerated(EnumType.STRING)
    private Canal canal;

    @Column(nullable = false)
    private Boolean contacte = false;

    @Column(nullable = false)
    private Boolean valide = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDemande statut = StatutDemande.NON_SAISIE;

    @Column(length = 2000)
    private String observation;

    private LocalDate datePrevuTraitement;
}