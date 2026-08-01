package com.enda.backend.service;

import com.enda.backend.entity.*;
import com.enda.backend.repository.AgenceRepository;
import com.enda.backend.repository.AppUserRepository;
import com.enda.backend.repository.DemandeClientRepository;
import com.enda.backend.repository.ProspectRepository;
import com.enda.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DemandeClientService {

    private static final long LOCK_TIMEOUT_SECONDS = 300;
    private static final int AGE_MIN = 18;
    private static final int AGE_MAX = 65;
    private static final String ROLE_DIRECTEUR_AGENCE = "Directeur Agence";
    private static final String ROLE_DIRECTEUR_REGIONAL = "Directeur Régional";

    private final DemandeClientRepository demandeClientRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ProspectRepository prospectRepository;
    private final AgenceRepository agenceRepository;
    private final NotificationService notificationService;
    private final AppUserRepository appUserRepository;

    public List<DemandeClient> findAll() {
        return demandeClientRepository.findAll();
    }

    public DemandeClient findById(UUID id) {
        return demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
    }

    public DemandeClient creerDemande(Map<String, Object> fields) {

        String cin = normalizeCin((String) fields.get("cin"));

        long demandesExistantes = (cin != null) ? demandeClientRepository.countByUtilisateur_Cin(cin) : 0;

        String telephone = (String) fields.get("telephone");

        Utilisateur utilisateur = utilisateurRepository
                .findByCin(cin)
                .orElseGet(() -> {
                    Utilisateur u = new Utilisateur();
                    u.setTelephone(telephone);
                    return utilisateurRepository.save(u);
                });

        utilisateur.setNom((String) fields.get("nomFamille"));
        utilisateur.setPrenom((String) fields.get("prenom"));
        utilisateur.setCin(cin);
        utilisateur.setAdresseDomicile((String) fields.get("adresse"));
        utilisateur.setGenre((String) fields.get("genre"));
        utilisateur.setSituationFamiliale((String) fields.get("situationFamiliale"));
        utilisateur.setGouvernorat((String) fields.get("gouvernorat"));
        utilisateur.setDelegation((String) fields.get("delegation"));
        utilisateur.setCodePostal((String) fields.get("codePostal"));

        if (fields.get("dateNaissance") != null) {
            utilisateur.setDateNaissance(LocalDate.parse((String) fields.get("dateNaissance")));
        }

        utilisateurRepository.save(utilisateur);

        DemandeClient demande = new DemandeClient();
        demande.setUtilisateur(utilisateur);
        demande.setDateSaisie(LocalDate.now());
        demande.setNumeroDemande((int) demandesExistantes + 1);

        demande.setActivite((String) fields.get("secteurActivite"));
        demande.setActivite((String) fields.get("activite"));
        demande.setSecteurActivite((String) fields.get("secteurActivite"));
        demande.setAdresseProjet((String) fields.get("adresse"));
        demande.setBesoin((String) fields.get("utilisationPret"));
        demande.setDureePret((String) fields.get("dureePret"));
        demande.setTypeClient(demandesExistantes > 0 ? "ancien client" : "nouveau client");
        demande.setStatut(StatutDemande.NON_SAISIE);
        demande.setAgence((String) fields.get("agence"));
        demande.setCanal(Canal.CALL_CENTER);

        String regionFromAgence = getRegionByAgence(demande.getAgence());
        if (regionFromAgence != null) {
            utilisateur.setRegion(regionFromAgence);
            utilisateurRepository.save(utilisateur);
        }

        if (fields.get("typeDemande") != null) {
            demande.setTypeDemande(TypeDemande.valueOf((String) fields.get("typeDemande")));
        }

        if (fields.get("capaciteRemboursement") != null) {
            demande.setCapaciteRemboursement(toInteger(fields.get("capaciteRemboursement")));
        }

        if (fields.get("montantDemande") != null) {
            demande.setMontant((String) fields.get("montantDemande"));
        } else if (fields.get("montant") != null) {
            demande.setMontant((String) fields.get("montant"));
        }

        DemandeClient saved = demandeClientRepository.save(demande);
        notifierDirecteursSiHorsAge(saved);
        return saved;
    }

    private String getRegionByGouvernoratAndDelegation(String gouvernorat, String delegation) {

        if (gouvernorat == null || delegation == null) {
            return null;
        }

        return agenceRepository
                .findByGouvernoratAndDelegation(gouvernorat, delegation)
                .map(Agence::getRegion)
                .orElse(null);
    }

    private String getRegionByAgence(String agence) {
        if (agence == null || agence.isBlank()) {
            return null;
        }

        return agenceRepository
                .findByAgence(agence)
                .stream()
                .findFirst()
                .map(Agence::getRegion)
                .orElse(null);
    }

    private Integer calculateAge(LocalDate dateNaissance) {
        if (dateNaissance == null) return null;
        return Period.between(dateNaissance, LocalDate.now()).getYears();
    }


    private void notifierDirecteursSiHorsAge(DemandeClient demande) {
        if (demande.getUtilisateur() == null || demande.getAgence() == null || demande.getAgence().isBlank()) {
            return;
        }

        Integer age = calculateAge(demande.getUtilisateur().getDateNaissance());
        if (age == null) {
            return;
        }

        boolean horsAge = age < AGE_MIN || age > AGE_MAX;
        if (!horsAge) {
            return;
        }

        String nom = demande.getUtilisateur().getNom() != null ? demande.getUtilisateur().getNom() : "";
        String prenom = demande.getUtilisateur().getPrenom() != null ? demande.getUtilisateur().getPrenom() : "";
        String nomClient = (nom + " " + prenom).trim();

        String raison = age < AGE_MIN ? "moins de " + AGE_MIN + " ans" : "plus de " + AGE_MAX + " ans";

        String message = "Le client " + nomClient + " (" + age + " ans, " + raison
                + ") a soumis une demande à l'agence " + demande.getAgence() + ".";

        List<AppUser> directeursAgence = appUserRepository.findByAgenceAndRolesContaining(
                demande.getAgence(), ROLE_DIRECTEUR_AGENCE
        );

        for (AppUser directeur : directeursAgence) {
            notificationService.create(
                    directeur.getKeycloakId(),
                    "Demande hors limite d'âge",
                    message,
                    "/demandes/" + demande.getId()
            );
        }

        String region = demande.getUtilisateur().getRegion();
        if (region != null && !region.isBlank()) {
            List<AppUser> directeursRegion = appUserRepository.findByRegionAndRolesContaining(
                    region, ROLE_DIRECTEUR_REGIONAL
            );

            for (AppUser directeur : directeursRegion) {
                notificationService.create(
                        directeur.getKeycloakId(),
                        "Demande hors limite d'âge",
                        message,
                        "/demandes/" + demande.getId()
                );
            }
        }
    }

    @Scheduled(fixedRate = 60000)
    public void ajouterDemandes() {

        List<ProspectFormulaire> prospects = prospectRepository.findAll();

        for (ProspectFormulaire prospect : prospects) {

            String cin = normalizeCin(prospect.getCin());


            if (cin == null || cin.isBlank()) {
                continue;
            }

            if (demandeClientRepository.existsByUtilisateur_Cin(cin)) {
                continue;
            }

            Utilisateur utilisateur = utilisateurRepository
                    .findByCin(cin)
                    .orElseGet(Utilisateur::new);

            utilisateur.setNom(prospect.getNom());
            utilisateur.setPrenom(prospect.getPrenom());
            utilisateur.setTelephone(prospect.getTelephone());
            utilisateur.setCin(cin);
            utilisateur.setDateNaissance(prospect.getDateNaissance());
            utilisateur.setGenre(prospect.getGenre());
            utilisateur.setSituationFamiliale(prospect.getSituationFamiliale());
            String gouvernorat = prospect.getGouvernorat();
            String delegation = prospect.getDelegation();

            utilisateur.setGouvernorat(gouvernorat);
            utilisateur.setDelegation(delegation);

            String region = getRegionByGouvernoratAndDelegation(
                    gouvernorat,
                    delegation
            );

            utilisateur.setRegion(region);
            utilisateur.setCodePostal(prospect.getCodePostal());

            utilisateur = utilisateurRepository.save(utilisateur);

            DemandeClient demande = new DemandeClient();
            demande.setUtilisateur(utilisateur);
            demande.setDateSaisie(prospect.getTimestamp().toLocalDate());


            demande.setStatutProjet(prospect.getProjet());
            demande.setActivite(prospect.getSecteurActivite());
            demande.setBesoin(prospect.getUtilisationPret());
            demande.setDureePret(prospect.getDureePret());
            demande.setCapaciteRemboursement(prospect.getCapaciteRemboursement());
            demande.setMontant(prospect.getMontantDemande());
            demande.setAdresseProjet(prospect.getAdresse());
            demande.setTypeClient("nouveau client");
            demande.setStatut(StatutDemande.NON_SAISIE);
            demande.setContacte(Boolean.FALSE);
            demande.setJoignable(null);
            demande.setRetourCommercial(Boolean.FALSE);
            demande.setCanal(prospect.getCanal());
            long demandesExistantes = (cin != null) ? demandeClientRepository.countByUtilisateur_Cin(cin) : 0;
            demande.setNumeroDemande((int) demandesExistantes + 1);

            if (prospect.getTypeDemande() != null && !prospect.getTypeDemande().isBlank()) {
                try {
                    demande.setTypeDemande(TypeDemande.valueOf(prospect.getTypeDemande()));
                } catch (IllegalArgumentException ignored) {
                }
            }

            try {
                DemandeClient saved = demandeClientRepository.save(demande);
                notifierDirecteursSiHorsAge(saved);
            } catch (DataIntegrityViolationException e) {

            }
        }
    }

    @Scheduled(fixedRate = 30000)
    public void remplirAgencesManquantes() {
        List<DemandeClient> demandes = demandeClientRepository.findAll();

        for (DemandeClient demande : demandes) {
            boolean agenceManquante = demande.getAgence() == null || demande.getAgence().isBlank();
            if (!agenceManquante) continue;

            Utilisateur utilisateur = demande.getUtilisateur();
            if (utilisateur == null) continue;

            String gouvernorat = utilisateur.getGouvernorat();
            String delegation = utilisateur.getDelegation();
            if (gouvernorat == null || gouvernorat.isBlank() || delegation == null || delegation.isBlank()) continue;

            agenceRepository.findByGouvernoratAndDelegation(gouvernorat, delegation)
                    .ifPresent(agenceEntity -> demande.setAgence(agenceEntity.getAgence()));

            if (demande.getAgence() != null && !demande.getAgence().isBlank()) {
                String regionFromAgence = getRegionByAgence(demande.getAgence());
                if (regionFromAgence != null) {
                    utilisateur.setRegion(regionFromAgence);
                    utilisateurRepository.save(utilisateur);
                }
                demandeClientRepository.save(demande);
                notifierDirecteursSiHorsAge(demande);
            }
        }
    }


    public DemandeClient updateFields(UUID id, Map<String, Object> fields) {

        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        Utilisateur utilisateur = demande.getUtilisateur();
        boolean gouvernoratOuDelegationChange = false;
        boolean dateNaissanceChanged = false;

        if (fields.containsKey("telephone")) {
            utilisateur.setTelephone((String) fields.get("telephone"));
        }

        if (fields.containsKey("adresseDomicile")) {
            utilisateur.setAdresseDomicile((String) fields.get("adresseDomicile"));
        }
        if (fields.containsKey("dateNaissance") && fields.get("dateNaissance") != null) {
            utilisateur.setDateNaissance(LocalDate.parse((String) fields.get("dateNaissance")));
            dateNaissanceChanged = true;
        }
        if (fields.containsKey("dateEmissionCin") && fields.get("dateEmissionCin") != null) {
            utilisateur.setDateEmissionCin(LocalDate.parse((String) fields.get("dateEmissionCin")));
        }
        if (fields.containsKey("nomPrenom")) {
            String[] parts = ((String) fields.get("nomPrenom")).trim().split(" ", 2);
            utilisateur.setNom(parts[0]);
            utilisateur.setPrenom(parts.length > 1 ? parts[1] : "");
        }
        if (fields.containsKey("genre")) {
            utilisateur.setGenre((String) fields.get("genre"));
        }
        if (fields.containsKey("situationFamiliale")) {
            utilisateur.setSituationFamiliale((String) fields.get("situationFamiliale"));
        }
        if (fields.containsKey("gouvernorat")) {
            utilisateur.setGouvernorat((String) fields.get("gouvernorat"));
            gouvernoratOuDelegationChange = true;
        }
        if (fields.containsKey("delegation")) {
            utilisateur.setDelegation((String) fields.get("delegation"));
            gouvernoratOuDelegationChange = true;
        }
        if (fields.containsKey("codePostal")) {
            utilisateur.setCodePostal((String) fields.get("codePostal"));
        }

        utilisateurRepository.save(utilisateur);

        fields.remove("statut");

        if (fields.containsKey("typeDemande") && fields.get("typeDemande") != null) {
            demande.setTypeDemande(TypeDemande.valueOf((String) fields.get("typeDemande")));
            fields.remove("typeDemande");
        }
        if (fields.containsKey("capaciteRemboursement")) {
            demande.setCapaciteRemboursement(toInteger(fields.get("capaciteRemboursement")));
            fields.remove("capaciteRemboursement");
        }

        boolean agenceChanged = false;

        if (fields.containsKey("agence")) {
            String nouvelleAgence = (String) fields.get("agence");
            String ancienneAgence = demande.getAgence();

            boolean isReassignation = ancienneAgence != null
                    && !ancienneAgence.isBlank()
                    && nouvelleAgence != null
                    && !nouvelleAgence.equals(ancienneAgence);

            if (isReassignation) {
                demande.setRetourCommercial(true);
                agenceChanged = true;
            }

            String regionFromAgence = getRegionByAgence(nouvelleAgence);
            if (regionFromAgence != null) {
                utilisateur.setRegion(regionFromAgence);
                utilisateurRepository.save(utilisateur);
            }
        }

        BeanWrapper beanWrapper = new BeanWrapperImpl(demande);
        fields.forEach((key, value) -> {
            if (beanWrapper.isWritableProperty(key)) {
                beanWrapper.setPropertyValue(key, value);
            }
        });

        demande.setVerrouillePar(null);
        demande.setVerrouilleDepuis(null);

        DemandeClient saved = demandeClientRepository.save(demande);

        if (agenceChanged || dateNaissanceChanged) {
            notifierDirecteursSiHorsAge(saved);
        }

        return saved;
    }

    public DemandeClient acquireLock(UUID id, String username) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        boolean isLockedByOther = demande.getVerrouillePar() != null
                && !demande.getVerrouillePar().equals(username)
                && demande.getVerrouilleDepuis() != null
                && Duration.between(demande.getVerrouilleDepuis(), Instant.now()).getSeconds() < LOCK_TIMEOUT_SECONDS;

        if (isLockedByOther) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, demande.getVerrouillePar());
        }

        demande.setVerrouillePar(username);
        demande.setVerrouilleDepuis(Instant.now());
        return demandeClientRepository.save(demande);
    }

    public DemandeClient releaseLock(UUID id, String username) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        if (username != null && username.equals(demande.getVerrouillePar())) {
            demande.setVerrouillePar(null);
            demande.setVerrouilleDepuis(null);
        }

        return demandeClientRepository.save(demande);
    }

    public DemandeClient changerStatut(UUID id, StatutDemande nouveauStatut) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        demande.setStatut(nouveauStatut);
        return demandeClientRepository.save(demande);
    }

    public DemandeClient changerJoignable(UUID id, Boolean joignable) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        demande.setJoignable(joignable);
        return demandeClientRepository.save(demande);
    }

    public DemandeClient changerRetourCommercial(UUID id, Boolean retourCommercial) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        demande.setRetourCommercial(retourCommercial);
        return demandeClientRepository.save(demande);
    }

    public DemandeClient changerContacte(UUID id, Boolean contacte) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        demande.setContacte(contacte);
        return demandeClientRepository.save(demande);
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(((String) value).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String normalizeCin(String cin) {
        if (cin == null) {
            return null;
        }

        String normalized = cin.trim().toUpperCase();
        return normalized.isBlank() ? null : normalized;
    }

    public List<DemandeClient> findByRegion(String region) {
        return demandeClientRepository.findByUtilisateur_Region(region);
    }

    public void deleteDemande(UUID id) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        String cin = demande.getUtilisateur() != null ? demande.getUtilisateur().getCin() : null;

        demandeClientRepository.deleteById(id);

        if (cin == null || cin.isBlank()) {
            return;
        }

        List<DemandeClient> restantes = demandeClientRepository.findByUtilisateur_CinOrderByNumeroDemande(cin);

        int numero = 1;
        for (DemandeClient d : restantes) {
            if (!d.getNumeroDemande().equals(numero)) {
                d.setNumeroDemande(numero);
                demandeClientRepository.save(d);
            }
            numero++;
        }
    }
}