package com.enda.backend.repository;

import com.enda.backend.entity.Agence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgenceRepository extends JpaRepository<Agence, UUID> {

    List<Agence> findByGouvernorat(String gouvernorat);

    List<Agence> findByRegion(String region);

    Optional<Agence> findByGouvernoratAndDelegation(String gouvernorat, String delegation);

    Optional<Agence> findByRegionAndGouvernoratAndDelegation(String region, String gouvernorat, String delegation);

    List<Agence> findByAgence(String agence);
}