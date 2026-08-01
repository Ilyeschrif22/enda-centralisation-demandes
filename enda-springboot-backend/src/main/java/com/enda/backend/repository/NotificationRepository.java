package com.enda.backend.repository;

import com.enda.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByDestinataire_KeycloakIdOrderByDateCreationDesc(String keycloakId);
    long countByDestinataire_KeycloakIdAndLuFalse(String keycloakId);
}