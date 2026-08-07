package com.enda.backend.entity;

import java.util.Map;

public record SavedFilterRequest(
        String name,
        String keycloakId,
        Map<String, String> filters
) {}