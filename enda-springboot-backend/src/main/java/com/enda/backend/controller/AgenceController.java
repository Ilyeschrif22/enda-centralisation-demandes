package com.enda.backend.controller;

import com.enda.backend.entity.Agence;
import com.enda.backend.service.AgenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/agences")
@RequiredArgsConstructor
public class AgenceController {

    private final AgenceService agenceService;

    @GetMapping
    public List<Agence> findAll() {
        return agenceService.findAll();
    }

    @GetMapping("/{id}")
    public Agence findById(@PathVariable UUID id) {
        return agenceService.findById(id);
    }

    @GetMapping("/proche")
    public String getAgenceProche(@RequestParam String gouvernorat, @RequestParam String delegation) {
        return agenceService.getAgenceProche(gouvernorat, delegation).orElse(null);
    }

    @PostMapping
    public Agence create(@RequestBody Agence agence) {
        return agenceService.create(agence);
    }

    @PutMapping("/{id}")
    public Agence update(@PathVariable UUID id, @RequestBody Agence agence) {
        return agenceService.update(id, agence);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        agenceService.delete(id);
    }
}