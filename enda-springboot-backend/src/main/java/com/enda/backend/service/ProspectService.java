package com.enda.backend.service;

import com.enda.backend.dto.ProspectRequestDTO;
import com.enda.backend.entity.Canal;
import com.enda.backend.entity.ProspectFormulaire;
import com.enda.backend.repository.ProspectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProspectService {

    private final ProspectRepository repository;

    public List<ProspectFormulaire> findAll() {
        return repository.findAll();
    }

    public void saveAll(List<ProspectRequestDTO> dtos) {
        log.info("saveAll called with {} rows", dtos.size());

        int saved = 0, skippedExisting = 0, skippedEmptyCin = 0, failed = 0;

        for (ProspectRequestDTO dto : dtos) {
            String cin = dto.getCin();

            if (cin == null || cin.isBlank()) {
                log.warn("Skipping row (empty CIN) — nom={}, prenom={}, telephone={}",
                        dto.getNom(), dto.getPrenom(), dto.getTelephone());
                skippedEmptyCin++;
                continue;
            }

            try {
                if (repository.existsByCin(cin)) {
                    log.debug("Skipping row (CIN already exists): {}", cin);
                    skippedExisting++;
                    continue;
                }

                ProspectFormulaire entity = toEntity(dto);
                repository.save(entity);
                log.info("Saved prospect CIN={} nom={} prenom={} canal={}",
                        cin, dto.getNom(), dto.getPrenom(), dto.getCanal());
                saved++;

            } catch (IllegalArgumentException e) {
                // typiquement Canal.valueOf() qui échoue
                log.error("Invalid enum/value for CIN={} — canal reçu='{}' — {}",
                        cin, dto.getCanal(), e.getMessage());
                failed++;
            } catch (Exception e) {
                log.error("Failed to save prospect CIN={}: {}", cin, e.getMessage(), e);
                failed++;
            }
        }

        log.info("saveAll done — saved={}, skippedExisting={}, skippedEmptyCin={}, failed={}, total={}",
                saved, skippedExisting, skippedEmptyCin, failed, dtos.size());
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