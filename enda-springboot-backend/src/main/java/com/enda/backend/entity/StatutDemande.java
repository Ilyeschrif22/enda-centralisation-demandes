package com.enda.backend.entity;

public enum StatutDemande {
    NON_SAISIE("Non saisie"),
    SAISIE("Saisie"),
    MANQUE_INFORMATION("Manque d'information"),
    DEMANDE_RENOUVELLEMENT("Demande de renouvellement"),
    DEMANDE_COMPLEMENT("Demande de complément");

    private final String libelle;

    StatutDemande(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}