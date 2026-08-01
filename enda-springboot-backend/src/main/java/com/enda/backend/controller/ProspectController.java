package com.enda.backend.controller;

import com.enda.backend.dto.ProspectRequestDTO;
import com.enda.backend.entity.ProspectFormulaire;
import com.enda.backend.service.ProspectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/prospects")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProspectController {

    private final ProspectService prospectService;

    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> importProspects(
            @RequestBody List<ProspectRequestDTO> prospects
    ) {
        prospectService.saveAll(prospects);
        return ResponseEntity.ok(Map.of(
                "received", prospects.size(),
                "status", "saved"
        ));
    }

    @GetMapping
    public ResponseEntity<List<ProspectFormulaire>> getAllProspects() {
        return ResponseEntity.ok(prospectService.findAll());
    }
}