package com.enda.backend.service;

import com.enda.backend.entity.Utilisateur;
import com.enda.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    public Utilisateur findById(UUID id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    public Utilisateur findByTelephone(String telephone) {
        return utilisateurRepository.findByTelephone(telephone)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    public Utilisateur save(Utilisateur utilisateur) {
        return utilisateurRepository.save(utilisateur);
    }

    public void delete(UUID id) {
        if (!utilisateurRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur introuvable");
        }

        utilisateurRepository.deleteById(id);
    }


    public Utilisateur updateFields(UUID id, Map<String, Object> fields) {
        Utilisateur utilisateur = findById(id);

        fields.forEach((key, value) -> {
            switch (key) {
                case "telephone" -> utilisateur.setTelephone((String) value);
                case "cin" -> utilisateur.setCin((String) value);
                case "nom" -> utilisateur.setNom((String) value);
                case "prenom" -> utilisateur.setPrenom((String) value);
                case "dateNaissance" -> utilisateur.setDateNaissance(
                        value == null ? null : LocalDate.parse((String) value)
                );
                case "dateEmissionCin" -> utilisateur.setDateEmissionCin(
                        value == null ? null : LocalDate.parse((String) value)
                );
                case "adresseDomicile" -> utilisateur.setAdresseDomicile((String) value);
                default -> throw new IllegalArgumentException("Champ non modifiable: " + key);
            }
        });

        return utilisateurRepository.save(utilisateur);
    }

    public boolean existsByCin(String cin) {
        return utilisateurRepository.existsByCin(cin);
    }
}