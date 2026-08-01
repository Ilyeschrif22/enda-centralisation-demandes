package com.enda.backend.repository;

import com.enda.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByKeycloakId(String keycloakId);
    Optional<AppUser> findByUsername(String username);

    List<AppUser> findByAgenceAndRolesContaining(String agence, String role);

    List<AppUser> findByRegionAndRolesContaining(String region, String role);


}