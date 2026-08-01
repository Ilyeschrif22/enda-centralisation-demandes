package com.enda.backend.service;

import com.enda.backend.entity.Agence;
import com.enda.backend.repository.AgenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgenceService {

    private final AgenceRepository agenceRepository;

    public List<Agence> findAll() {
        return agenceRepository.findAll();
    }

    public Agence findById(UUID id) {
        return agenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agence introuvable"));
    }

    public List<Agence> findByGouvernorat(String gouvernorat) {
        return agenceRepository.findByGouvernorat(gouvernorat);
    }

    public List<Agence> findByRegion(String region) {
        return agenceRepository.findByRegion(region);
    }

    public Optional<String> getAgenceProche(String gouvernorat, String delegation) {
        if (gouvernorat == null || delegation == null) {
            return Optional.empty();
        }
        return agenceRepository
                .findByGouvernoratAndDelegation(gouvernorat, delegation)
                .map(Agence::getAgence);
    }

    public Optional<String> getAgenceProche(String region, String gouvernorat, String delegation) {
        if (region == null || gouvernorat == null || delegation == null) {
            return Optional.empty();
        }
        return agenceRepository
                .findByRegionAndGouvernoratAndDelegation(region, gouvernorat, delegation)
                .map(Agence::getAgence);
    }

    public Agence create(Agence agence) {
        return agenceRepository.save(agence);
    }

    public Agence update(UUID id, Agence updated) {
        Agence agence = findById(id);
        agence.setRegion(updated.getRegion());
        agence.setGouvernorat(updated.getGouvernorat());
        agence.setDelegation(updated.getDelegation());
        agence.setAgence(updated.getAgence());
        return agenceRepository.save(agence);
    }

    public void delete(UUID id) {
        if (!agenceRepository.existsById(id)) {
            throw new RuntimeException("Agence introuvable");
        }
        agenceRepository.deleteById(id);
    }
}