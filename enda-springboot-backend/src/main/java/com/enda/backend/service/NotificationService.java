package com.enda.backend.service;

import com.enda.backend.entity.AppUser;
import com.enda.backend.entity.Notification;
import com.enda.backend.repository.AppUserRepository;
import com.enda.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AppUserRepository appUserRepository;

    public List<Notification> findByUser(String keycloakId) {
        return notificationRepository.findByDestinataire_KeycloakIdOrderByDateCreationDesc(keycloakId);
    }

    public long countUnread(String keycloakId) {
        return notificationRepository.countByDestinataire_KeycloakIdAndLuFalse(keycloakId);
    }

    public Notification create(String keycloakId, String titre, String message, String lien) {
        AppUser destinataire = appUserRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + keycloakId));

        Notification notification = new Notification();
        notification.setDestinataire(destinataire);
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setLien(lien);
        return notificationRepository.save(notification);
    }

    public Notification markAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));
        notification.setLu(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(String keycloakId) {
        List<Notification> notifications = notificationRepository.findByDestinataire_KeycloakIdOrderByDateCreationDesc(keycloakId);
        notifications.forEach(n -> n.setLu(true));
        notificationRepository.saveAll(notifications);
    }

    public void delete(UUID id) {
        notificationRepository.deleteById(id);
    }
}