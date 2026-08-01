package com.enda.backend.controller;

import com.enda.backend.entity.AppUser;
import com.enda.backend.repository.AppUserRepository;
import com.enda.backend.service.AppUserSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/app-users")
@RequiredArgsConstructor
public class AppUserController {

    private final AppUserRepository appUserRepository;
    private final AppUserSyncService appUserSyncService;

    @GetMapping
    public List<AppUser> getUsers() {
        return appUserRepository.findAll();
    }

    @PostMapping("/sync")
    public List<AppUser> syncNow() {
        appUserSyncService.syncUsers();
        return appUserRepository.findAll();
    }
}