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
    private static final String SYSTEM_NOM = "Système";

    private final DemandeClientRepository demandeClientRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ProspectRepository prospectRepository;
    private final AgenceRepository agenceRepository;
    private final NotificationService notificationService;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;

    public List<DemandeClient> findAll() {
        return demandeClientRepository.findAll();
    }

    public DemandeClient findById(UUID id) {
        return demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
    }


    public DemandeClient creerDemande(Map<String, Object> fields, String systemNom) {
        return creerDemande(fields, SYSTEM_NOM);
    }

    public DemandeClient creerDemande(Map<String, Object> fields, String username, String nomUtilisateur) {

        String cin = normalizeCin((String) fields.get("cin"));

        List<DemandeClient> demandesExistantesList = (cin != null)
                ? new java.util.ArrayList<>(demandeClientRepository.findByUtilisateur_CinOrderByNumeroDemande(cin))
                : new java.util.ArrayList<>();


        if (!demandesExistantesList.isEmpty()) {
            DemandeClient derniereDemande = demandesExistantesList.get(demandesExistantesList.size() - 1);
            if (LocalDate.now().equals(derniereDemande.getDateSaisie())) {
                try {
                    auditService.logSuppression(derniereDemande.getId(), username, nomUtilisateur);
                } catch (Exception e) {
                    System.err.println("Echec de l'écriture de l'audit (suppression pour remplacement même jour) pour la demande " + derniereDemande.getId());
                    e.printStackTrace();
                }
                demandeClientRepository.deleteById(derniereDemande.getId());
                demandesExistantesList.remove(demandesExistantesList.size() - 1);
            }
        }

        long demandesExistantes = demandesExistantesList.size();

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

        Object dateNaissanceRaw = fields.get("dateNaissance");
        if (dateNaissanceRaw != null && !((String) dateNaissanceRaw).isBlank()) {
            try {
                utilisateur.setDateNaissance(LocalDate.parse((String) dateNaissanceRaw));
            } catch (Exception e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Date de naissance invalide: " + dateNaissanceRaw
                );
            }
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

        Object typeDemandeRaw = fields.get("typeDemande");
        if (typeDemandeRaw != null && !((String) typeDemandeRaw).isBlank()) {
            try {
                demande.setTypeDemande(TypeDemande.valueOf((String) typeDemandeRaw));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Type de demande invalide: " + typeDemandeRaw
                );
            }
        }

        if (fields.get("capaciteRemboursement") != null) {
            demande.setCapaciteRemboursement(toInteger(fields.get("capaciteRemboursement")));
        }

        if (fields.get("montantDemande") != null) {
            demande.setMontant((String) fields.get("montantDemande"));
        } else if (fields.get("montant") != null) {
            demande.setMontant((String) fields.get("montant"));
        }

        DemandeClient saved;
        try {
            saved = demandeClientRepository.save(demande);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Contrainte de données violée lors de la création de la demande"
            );
        }

        try {
            auditService.logCreation(saved.getId(), username, nomUtilisateur);
        } catch (Exception e) {
            System.err.println("Echec de l'écriture de l'audit (création) pour la demande " + saved.getId());
            e.printStackTrace();
        }

        try {
            notifierDirecteursSiHorsAge(saved);
        } catch (Exception e) {
            System.err.println("Echec de la notification hors-âge pour la demande " + saved.getId());
            e.printStackTrace();
        }

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

    private String normalizeRegion(String region) {
        if (region == null) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(region.trim(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toUpperCase();
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
            String regionNormalisee = normalizeRegion(region);

            List<AppUser> directeursRegion = appUserRepository.findByRolesContaining(ROLE_DIRECTEUR_REGIONAL)
                    .stream()
                    .filter(directeur -> regionNormalisee.equals(normalizeRegion(directeur.getRegion())))
                    .toList();

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

    @Scheduled(fixedRate = 1000)
    public void ajouterDemandes() {

        List<ProspectFormulaire> prospects = prospectRepository.findAll();

        for (ProspectFormulaire prospect : prospects) {

            String cin = normalizeCin(prospect.getCin());


            if (cin == null || cin.isBlank()) {
                continue;
            }

            LocalDate dateProspect = prospect.getTimestamp().toLocalDate();

            if (demandeClientRepository.existsByUtilisateur_CinAndDateSaisie(cin, dateProspect)) {
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
            long demandesExistantes = (cin != null) ? demandeClientRepository.countByUtilisateur_Cin(cin) : 0;
            demande.setTypeClient(demandesExistantes > 0 ? "ancien client" : "nouveau client");
            demande.setStatut(StatutDemande.NON_SAISIE);
            demande.setContacte(Boolean.FALSE);
            demande.setJoignable(null);
            demande.setCanal(prospect.getCanal());
            demande.setNumeroDemande((int) demandesExistantes + 1);

            if (prospect.getTypeDemande() != null && !prospect.getTypeDemande().isBlank()) {
                try {
                    demande.setTypeDemande(TypeDemande.valueOf(prospect.getTypeDemande()));
                } catch (IllegalArgumentException ignored) {
                }
            }

            try {
                DemandeClient saved = demandeClientRepository.save(demande);

                try {
                    auditService.logCreation(saved.getId(), "prospect-import", "Import prospect (auto)");
                } catch (Exception e) {
                    System.err.println("Echec de l'écriture de l'audit (import) pour la demande " + saved.getId());
                    e.printStackTrace();
                }

                try {
                    notifierDirecteursSiHorsAge(saved);
                } catch (Exception e) {
                    System.err.println("Echec de la notification hors-âge (import prospect) pour la demande " + saved.getId());
                    e.printStackTrace();
                }
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
                try {
                    notifierDirecteursSiHorsAge(demande);
                } catch (Exception e) {
                    System.err.println("Echec de la notification hors-âge (remplissage agence) pour la demande " + demande.getId());
                    e.printStackTrace();
                }
            }
        }
    }

    public DemandeClient updateFields(UUID id, Map<String, Object> fields, String systemNom) {
        return updateFields(id, fields , SYSTEM_NOM);
    }

    public DemandeClient updateFields(UUID id, Map<String, Object> fields, String username, String nomUtilisateur) {

        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        Utilisateur utilisateur = demande.getUtilisateur();
        boolean gouvernoratOuDelegationChange = false;
        boolean dateNaissanceChanged = false;

        if (fields.containsKey("telephone")) {
            String oldValue = utilisateur.getTelephone();
            String newValue = (String) fields.get("telephone");
            utilisateur.setTelephone(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Téléphone", oldValue, newValue);
        }

        if (fields.containsKey("adresseDomicile")) {
            String oldValue = utilisateur.getAdresseDomicile();
            String newValue = (String) fields.get("adresseDomicile");
            utilisateur.setAdresseDomicile(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Adresse domicile", oldValue, newValue);
        }
        if (fields.containsKey("dateNaissance") && fields.get("dateNaissance") != null) {
            LocalDate oldValue = utilisateur.getDateNaissance();
            try {
                LocalDate newValue = LocalDate.parse((String) fields.get("dateNaissance"));
                utilisateur.setDateNaissance(newValue);
                auditService.logChampSiModifie(id, username, nomUtilisateur, "Date de naissance", oldValue, newValue);
                dateNaissanceChanged = true;
            } catch (Exception e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Date de naissance invalide: " + fields.get("dateNaissance")
                );
            }
        }
        if (fields.containsKey("dateEmissionCin") && fields.get("dateEmissionCin") != null) {
            LocalDate oldValue = utilisateur.getDateEmissionCin();
            try {
                LocalDate newValue = LocalDate.parse((String) fields.get("dateEmissionCin"));
                utilisateur.setDateEmissionCin(newValue);
                auditService.logChampSiModifie(id, username, nomUtilisateur, "Date d'émission CIN", oldValue, newValue);
            } catch (Exception e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Date d'émission CIN invalide: " + fields.get("dateEmissionCin")
                );
            }
        }
        if (fields.containsKey("nomFamille")) {
            String oldValue = utilisateur.getNom();
            String newValue = (String) fields.get("nomFamille");
            utilisateur.setNom(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Nom", oldValue, newValue);
        }
        if (fields.containsKey("prenom")) {
            String oldValue = utilisateur.getPrenom();
            String newValue = (String) fields.get("prenom");
            utilisateur.setPrenom(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Prénom", oldValue, newValue);
        }
        if (fields.containsKey("nomPrenom")) {
            String[] parts = ((String) fields.get("nomPrenom")).trim().split(" ", 2);
            String oldNom = utilisateur.getNom();
            String oldPrenom = utilisateur.getPrenom();
            utilisateur.setNom(parts[0]);
            utilisateur.setPrenom(parts.length > 1 ? parts[1] : "");
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Nom", oldNom, parts[0]);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Prénom", oldPrenom, parts.length > 1 ? parts[1] : "");
        }

        if (fields.containsKey("genre")) {
            String oldValue = utilisateur.getGenre();
            String newValue = (String) fields.get("genre");
            utilisateur.setGenre(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Genre", oldValue, newValue);
        }
        if (fields.containsKey("situationFamiliale")) {
            String oldValue = utilisateur.getSituationFamiliale();
            String newValue = (String) fields.get("situationFamiliale");
            utilisateur.setSituationFamiliale(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Situation familiale", oldValue, newValue);
        }
        if (fields.containsKey("gouvernorat")) {
            String oldValue = utilisateur.getGouvernorat();
            String newValue = (String) fields.get("gouvernorat");
            utilisateur.setGouvernorat(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Gouvernorat", oldValue, newValue);
            gouvernoratOuDelegationChange = true;
        }
        if (fields.containsKey("delegation")) {
            String oldValue = utilisateur.getDelegation();
            String newValue = (String) fields.get("delegation");
            utilisateur.setDelegation(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Délégation", oldValue, newValue);
            gouvernoratOuDelegationChange = true;
        }
        if (fields.containsKey("codePostal")) {
            String oldValue = utilisateur.getCodePostal();
            String newValue = (String) fields.get("codePostal");
            utilisateur.setCodePostal(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Code postal", oldValue, newValue);
        }

        utilisateurRepository.save(utilisateur);

        fields.remove("statut");

        if (fields.containsKey("typeDemande") && fields.get("typeDemande") != null) {
            Object typeDemandeRaw = fields.get("typeDemande");
            TypeDemande oldValue = demande.getTypeDemande();
            try {
                TypeDemande newValue = TypeDemande.valueOf((String) typeDemandeRaw);
                demande.setTypeDemande(newValue);
                auditService.logChampSiModifie(id, username, nomUtilisateur, "Type de demande", oldValue, newValue);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Type de demande invalide: " + typeDemandeRaw
                );
            }
            fields.remove("typeDemande");
        }
        if (fields.containsKey("capaciteRemboursement")) {
            Integer oldValue = demande.getCapaciteRemboursement();
            Integer newValue = toInteger(fields.get("capaciteRemboursement"));
            demande.setCapaciteRemboursement(newValue);
            auditService.logChampSiModifie(id, username, nomUtilisateur, "Capacité de remboursement", oldValue, newValue);
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
                agenceChanged = true;
            }

            auditService.logChampSiModifie(id, username, nomUtilisateur, "Agence", ancienneAgence, nouvelleAgence);

            String regionFromAgence = getRegionByAgence(nouvelleAgence);
            if (regionFromAgence != null) {
                utilisateur.setRegion(regionFromAgence);
                utilisateurRepository.save(utilisateur);
            }
        }

        BeanWrapper beanWrapper = new BeanWrapperImpl(demande);
        Map<String, Object> snapshotAvant = new java.util.HashMap<>();
        fields.forEach((key, value) -> {
            if (beanWrapper.isWritableProperty(key)) {
                snapshotAvant.put(key, beanWrapper.getPropertyValue(key));
            }
        });

        fields.forEach((key, value) -> {
            if (beanWrapper.isWritableProperty(key)) {
                beanWrapper.setPropertyValue(key, value);
            }
        });

        snapshotAvant.forEach((key, oldValue) -> {
            Object newValue = beanWrapper.getPropertyValue(key);
            auditService.logChampSiModifie(id, username, nomUtilisateur, champLabel(key), oldValue, newValue);
        });

        demande.setVerrouillePar(null);
        demande.setVerrouilleDepuis(null);

        DemandeClient saved;
        try {
            saved = demandeClientRepository.save(demande);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Contrainte de données violée lors de la modification de la demande"
            );
        }

        if (agenceChanged || dateNaissanceChanged) {
            try {
                notifierDirecteursSiHorsAge(saved);
            } catch (Exception e) {
                System.err.println("Echec de la notification hors-âge (mise à jour) pour la demande " + saved.getId());
                e.printStackTrace();
            }
        }

        return saved;
    }

    private String champLabel(String key) {
        return switch (key) {
            case "activite" -> "Activité";
            case "secteurActivite" -> "Secteur d'activité";
            case "adresseProjet" -> "Adresse projet";
            case "besoin" -> "Utilisation du prêt";
            case "dureePret" -> "Durée du prêt";
            case "montant" -> "Montant";
            case "montantDemande" -> "Montant demandé";
            case "valide" -> "Validation";
            case "datePrevuTraitement" -> "Date prévue de traitement";
            case "statutProjet" -> "Statut du projet";
            case "retourAgence" -> "Retour agence";
            case "observation" -> "Observation";
            default -> key;
        };
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

    public DemandeClient changerStatut(UUID id, StatutDemande nouveauStatut, String systemNom) {
        return changerStatut(id, nouveauStatut , SYSTEM_NOM);
    }

    public DemandeClient changerStatut(UUID id, StatutDemande nouveauStatut, String username, String nomUtilisateur) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        StatutDemande ancien = demande.getStatut();
        demande.setStatut(nouveauStatut);
        DemandeClient saved = demandeClientRepository.save(demande);
        auditService.logChampSiModifie(id, username, nomUtilisateur, "Statut", ancien, nouveauStatut);
        return saved;
    }

    public DemandeClient changerJoignable(UUID id, Boolean joignable, String systemNom) {
        return changerJoignable(id, joignable, SYSTEM_NOM);
    }

    public DemandeClient changerJoignable(UUID id, Boolean joignable, String username, String nomUtilisateur) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        Boolean ancien = demande.getJoignable();
        demande.setJoignable(joignable);
        DemandeClient saved = demandeClientRepository.save(demande);
        auditService.logChampSiModifie(id, username, nomUtilisateur, "Joignable", ancien, joignable);
        return saved;
    }

    public DemandeClient changerInteresse(UUID id, Boolean interesse, String systemNom) {
        return changerInteresse(id, interesse , SYSTEM_NOM);
    }

    public DemandeClient changerInteresse(UUID id, Boolean interesse, String username, String nomUtilisateur) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        Boolean ancien = demande.getInteresse();
        demande.setInteresse(interesse);
        DemandeClient saved = demandeClientRepository.save(demande);
        auditService.logChampSiModifie(id, username, nomUtilisateur, "Intéressé", ancien, interesse);
        return saved;
    }

    public DemandeClient changerContacte(UUID id, Boolean contacte, String systemNom) {
        return changerContacte(id, contacte, SYSTEM_NOM);
    }

    public DemandeClient changerContacte(UUID id, Boolean contacte, String username, String nomUtilisateur) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
        Boolean ancien = demande.getContacte();
        demande.setContacte(contacte);
        DemandeClient saved = demandeClientRepository.save(demande);
        auditService.logChampSiModifie(id, username, nomUtilisateur, "Contacté", ancien, contacte);
        return saved;
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

    public void deleteDemande(UUID id, String systemNom) {
        deleteDemande(id , SYSTEM_NOM);
    }

    public void deleteDemande(UUID id, String username, String nomUtilisateur) {
        DemandeClient demande = demandeClientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        String cin = demande.getUtilisateur() != null ? demande.getUtilisateur().getCin() : null;

        try {
            auditService.logSuppression(id, username, nomUtilisateur);
        } catch (Exception e) {
            System.err.println("Echec de l'écriture de l'audit (suppression) pour la demande " + id);
            e.printStackTrace();
        }

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