package com.enda.backend.controller;

import com.enda.backend.service.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class KeycloakUserController {

    private final KeycloakAdminService keycloakAdminService;

    @GetMapping
    public List<UserRepresentation> getUsers() {
        return keycloakAdminService.getUsers();
    }

    @GetMapping("/{id}")
    public UserRepresentation getUser(@PathVariable String id) {
        return keycloakAdminService.getUserById(id);
    }

    @GetMapping("/by-username/{username}")
    public UserRepresentation getUserByUsername(@PathVariable String username) {
        return keycloakAdminService.getUserByUsername(username);
    }

    @PostMapping
    public UserRepresentation createUser(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String email = (String) body.get("email");
        String firstName = (String) body.get("firstName");
        String lastName = (String) body.get("lastName");
        String agence = (String) body.get("agence");
        String region = (String) body.get("region");
        String temporaryPassword = (String) body.get("temporaryPassword");

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("roles");

        return keycloakAdminService.createUser(
                username, email, firstName, lastName, agence, region, temporaryPassword, roles
        );
    }

    @PatchMapping("/{id}")
    public void updateUser(@PathVariable String id, @RequestBody Map<String, Object> body) {
        keycloakAdminService.updateUser(id, body);
    }

    @PutMapping("/{id}/roles")
    public void updateRoles(@PathVariable String id, @RequestBody Map<String, List<String>> body) {
        keycloakAdminService.updateUserRoles(id, body.get("roles"));
    }

    @PostMapping("/{id}/reset-password")
    public void resetPassword(@PathVariable String id, @RequestBody Map<String, Object> body) {
        keycloakAdminService.resetPassword(
                id,
                (String) body.get("password"),
                Boolean.TRUE.equals(body.get("temporary"))
        );
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable String id) {
        keycloakAdminService.deleteUser(id);
    }

    @GetMapping("/roles")
    public List<String> getRoles() {
        return keycloakAdminService.getAvailableRoles();
    }
}