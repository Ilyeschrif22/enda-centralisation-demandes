package com.enda.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
public class Utilisateur {

    @Id
    @GeneratedValue
    private UUID id;

    private String telephone;

    @Column(unique = true)
    private String cin;

    private String nom;

    private String prenom;

    private LocalDate dateNaissance;

    private LocalDate dateEmissionCin;

    private String adresseDomicile;

    private String genre;

    private String situationFamiliale;

    private String gouvernorat;

    private String delegation;

    private String codePostal;

    private String region;

    @JsonIgnore
    @OneToMany(mappedBy = "utilisateur")
    private List<DemandeClient> demandes = new ArrayList<>();
}