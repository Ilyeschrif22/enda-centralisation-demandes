package com.enda.backend.service;

import com.enda.backend.entity.SavedFilter;
import com.enda.backend.entity.SavedFilterRequest;
import com.enda.backend.entity.SavedFilterResponse;
import com.enda.backend.repository.SavedFilterRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SavedFilterService {

    private final SavedFilterRepository repository;
    private final ObjectMapper objectMapper;

    public List<SavedFilterResponse> getByUser(String keycloakId) {
        return repository.findByKeycloakIdOrderByCreatedAtAsc(keycloakId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SavedFilterResponse create(SavedFilterRequest request) {
        SavedFilter entity = new SavedFilter();
        entity.setName(request.name());
        entity.setKeycloakId(request.keycloakId());
        entity.setFiltersJson(writeJson(request.filters()));

        SavedFilter saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public boolean delete(UUID id, String keycloakId) {
        long deletedCount = repository.deleteByIdAndKeycloakId(id, keycloakId);
        return deletedCount > 0;
    }

    private SavedFilterResponse toResponse(SavedFilter entity) {
        return new SavedFilterResponse(entity.getId(), entity.getName(), readJson(entity.getFiltersJson()));
    }

    private String writeJson(Map<String, String> filters) {
        try {
            return objectMapper.writeValueAsString(filters);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Erreur sérialisation filtres", e);
        }
    }

    private Map<String, String> readJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Erreur désérialisation filtres", e);
        }
    }
}