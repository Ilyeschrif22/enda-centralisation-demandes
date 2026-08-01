package com.enda.backend.service;

import com.enda.backend.entity.AppUser;
import com.enda.backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppUserSyncService {

    private final KeycloakAdminService keycloakAdminService;
    private final AppUserRepository appUserRepository;

    @Scheduled(fixedRate = 300000)
    public void syncUsers() {
        List<UserRepresentation> keycloakUsers = keycloakAdminService.getUsers();

        for (UserRepresentation kcUser : keycloakUsers) {
            AppUser appUser = appUserRepository.findByKeycloakId(kcUser.getId())
                    .orElseGet(AppUser::new);

            appUser.setKeycloakId(kcUser.getId());
            appUser.setUsername(kcUser.getUsername());
            appUser.setEmail(kcUser.getEmail());
            appUser.setFirstName(kcUser.getFirstName());
            appUser.setLastName(kcUser.getLastName());


            if (kcUser.getAttributes() != null && kcUser.getAttributes().containsKey("agence")) {
                appUser.setAgence(kcUser.getAttributes().get("agence").stream().findFirst().orElse(null));
            }

            try {
                List<String> roles = keycloakAdminService.getUserRoles(kcUser.getId());
                appUser.setRoles(String.join(",", roles));
            } catch (Exception e) {
            }


            appUser.setLastSyncedAt(Instant.now());
            appUserRepository.save(appUser);
        }
    }
}