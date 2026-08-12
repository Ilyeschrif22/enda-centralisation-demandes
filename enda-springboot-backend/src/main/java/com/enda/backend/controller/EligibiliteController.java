//package com.enda.backend.controller;
//
//import com.enda.backend.entity.DemandeClient;
//import com.enda.backend.service.DemandeClientService;
//import com.enda.backend.service.EligibiliteNotificationService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.RestController;
//
//import java.time.LocalDate;
//import java.time.Period;
//import java.util.UUID;
//
//@RestController
//@RequiredArgsConstructor
//public class EligibiliteController {
//
//    private final DemandeClientService demandeClientService;
//    private final EligibiliteNotificationService eligibiliteNotificationService;
//
//    @PostMapping("/demandes/{id}/verifier-eligibilite")
//    public String verifierEligibilite(@PathVariable UUID id) {
//        DemandeClient demande = demandeClientService.findById(id);
//        var utilisateur = demande.getUtilisateur();
//
//        if (utilisateur == null || utilisateur.getDateNaissance() == null) {
//            return "Pas de date de naissance, rien à vérifier.";
//        }
//
//        int age = Period.between(utilisateur.getDateNaissance(), LocalDate.now()).getYears();
//
//        if (age < 18 || age > 65) {
//            String raison = age < 18 ? "< 18 ans" : "> 65 ans";
//            String nomPrenom = (utilisateur.getNom() + " " + utilisateur.getPrenom()).trim();
//            eligibiliteNotificationService.alerterAgeNonEligible(nomPrenom, utilisateur.getCin(), age, raison);
//            return "Alerte envoyée (" + age + " ans, " + raison + ")";
//        }
//
//        return "Client éligible, aucune alerte envoyée.";
//    }
//}