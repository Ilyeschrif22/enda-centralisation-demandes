package com.enda.backend.service;

import com.enda.backend.dto.ProspectRequestDTO;
import com.enda.backend.entity.Canal;
import com.enda.backend.entity.ProspectFormulaire;
import com.enda.backend.repository.ProspectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProspectService {

    private final ProspectRepository repository;

    public List<ProspectFormulaire> findAll() {
        return repository.findAll();
    }

    public void saveAll(List<ProspectRequestDTO> dtos) {

        for (ProspectRequestDTO dto : dtos) {

            boolean exists = repository.existsByCin(dto.getCin());

            if (!exists) {
                repository.save(toEntity(dto));
            }
        }
    }

    private ProspectFormulaire toEntity(ProspectRequestDTO dto) {
        ProspectFormulaire entity = new ProspectFormulaire();
        entity.setTimestamp(dto.getTimestamp());
        entity.setTypeDemande(dto.getTypeDemande());
        entity.setNom(dto.getNom());
        entity.setPrenom(dto.getPrenom());
        entity.setDateNaissance(dto.getDateNaissance());
        entity.setGenre(dto.getGenre());
        entity.setSituationFamiliale(dto.getSituationFamiliale());
        entity.setSecteurActivite(dto.getSecteurActivite());
        entity.setCin(dto.getCin());
        entity.setTelephone(dto.getTelephone());
        entity.setProjet(dto.getProjet());
        entity.setUtilisationPret(dto.getUtilisationPret());
        entity.setAdresse(dto.getAdresse());
        entity.setGouvernorat(dto.getGouvernorat());
        entity.setDelegation(dto.getDelegation());
        entity.setCodePostal(dto.getCodePostal());
        entity.setMontantDemande(dto.getMontantDemande());
        entity.setAgenceProche(dto.getAgenceProche());
        entity.setCapaciteRemboursement(dto.getCapaciteRemboursement());
        entity.setDureePret(dto.getDureePret());
        entity.setRemarques(dto.getRemarques());
        entity.setCanal(Canal.valueOf(dto.getCanal()));
        return entity;
    }
}