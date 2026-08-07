package com.enda.backend.controller;

import com.enda.backend.entity.SavedFilterRequest;
import com.enda.backend.entity.SavedFilterResponse;
import com.enda.backend.service.SavedFilterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/saved-filters")
@RequiredArgsConstructor
public class SavedFilterController {

    private final SavedFilterService service;

    @GetMapping
    public List<SavedFilterResponse> list(@RequestParam String keycloakId) {
        return service.getByUser(keycloakId);
    }

    @PostMapping
    public SavedFilterResponse create(@RequestBody SavedFilterRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @RequestParam String keycloakId) {
        boolean deleted = service.delete(id, keycloakId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}