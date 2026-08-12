package com.enda.backend.repository;

import com.enda.backend.entity.DemandeClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DemandeClientRepository extends JpaRepository<DemandeClient, UUID> {

    boolean existsByUtilisateur_Cin(String cin);

    long countByUtilisateur_Cin(String cin);

    List<DemandeClient> findByUtilisateur_CinOrderByNumeroDemande(String cin);

    List<DemandeClient> findByUtilisateur_Region(String region);

    boolean existsByUtilisateur_CinAndDateSaisie(String cin, LocalDate dateSaisie);
}
