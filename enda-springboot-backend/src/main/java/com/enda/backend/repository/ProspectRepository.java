package com.enda.backend.repository;

import com.enda.backend.entity.ProspectFormulaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProspectRepository
        extends JpaRepository<ProspectFormulaire, UUID> {

    boolean existsByCin(String cin);

}