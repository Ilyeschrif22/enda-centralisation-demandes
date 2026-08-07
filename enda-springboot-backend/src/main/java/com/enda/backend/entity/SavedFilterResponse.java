package com.enda.backend.entity;

import java.util.Map;
import java.util.UUID;

public record SavedFilterResponse(
        UUID id,
        String name,
        Map<String, String> filters
) {}