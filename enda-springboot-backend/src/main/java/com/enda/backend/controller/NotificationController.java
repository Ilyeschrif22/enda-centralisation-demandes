package com.enda.backend.controller;

import com.enda.backend.entity.Notification;
import com.enda.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<Notification> getNotifications(@RequestParam String username) {
        return notificationService.findByUser(username);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(@RequestParam String username) {
        return Map.of("count", notificationService.countUnread(username));
    }

    @PatchMapping("/{id}/read")
    public Notification markAsRead(@PathVariable UUID id) {
        return notificationService.markAsRead(id);
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam String username) {
        notificationService.markAllAsRead(username);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}