package com.enda.backend.service;

import jakarta.annotation.PostConstruct;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.keycloak.admin.client.resource.UserResource;

import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KeycloakAdminService {

    @Value("${keycloak.admin.server-url}")
    private String serverUrl;

    @Value("${keycloak.admin.realm}")
    private String adminRealm;

    @Value("${keycloak.admin.target-realm}")
    private String targetRealm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    private Keycloak keycloak;

    @PostConstruct
    public void init() {
        keycloak = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(adminRealm)
                .clientId(clientId)
                .username(adminUsername)
                .password(adminPassword)
                .build();
    }

    public UserRepresentation createUser(
            String username,
            String email,
            String firstName,
            String lastName,
            String agence,
            String region,
            String temporaryPassword,
            List<String> roles
    ) {
        RealmResource realmResource = keycloak.realm(targetRealm);
        UsersResource usersResource = realmResource.users();

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setAttributes(Map.of(
                "agence", List.of(agence != null ? agence : ""),
                "region", List.of(region != null ? region : "")
        ));

        Response response = usersResource.create(user);

        if (response.getStatus() == 409) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce nom d'utilisateur ou email existe déjà");
        }
        if (response.getStatus() != 201) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Echec de la création de l'utilisateur Keycloak (" + response.getStatus() + ")");
        }

        String userId = extractIdFromLocation(response);

        if (temporaryPassword != null && !temporaryPassword.isBlank()) {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(temporaryPassword);
            credential.setTemporary(true);
            usersResource.get(userId).resetPassword(credential);
        }

        if (roles != null && !roles.isEmpty()) {
            List<RoleRepresentation> roleReps = roles.stream()
                    .map(roleName -> realmResource.roles().get(roleName).toRepresentation())
                    .toList();
            usersResource.get(userId).roles().realmLevel().add(roleReps);
        }

        return usersResource.get(userId).toRepresentation();
    }

    private String extractIdFromLocation(Response response) {
        String location = response.getLocation().toString();
        return location.substring(location.lastIndexOf('/') + 1);
    }

    public List<UserRepresentation> getUsers() {
        return keycloak.realm(targetRealm).users().list();
    }

    public UserRepresentation getUserById(String id) {
        return keycloak.realm(targetRealm).users().get(id).toRepresentation();
    }

    public UserRepresentation getUserByUsername(String username) {
        List<UserRepresentation> matches = keycloak.realm(targetRealm).users().search(username, true);
        if (matches.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable");
        }
        return matches.get(0);
    }

    public List<String> getUserRoles(String userId) {
        return keycloak.realm(targetRealm).users().get(userId).roles().realmLevel().listEffective()
                .stream()
                .map(RoleRepresentation::getName)
                .toList();
    }

    public void updateUser(String id, Map<String, Object> fields) {
        UserResource userResource = keycloak.realm(targetRealm).users().get(id);
        UserRepresentation user = userResource.toRepresentation();

        if (fields.containsKey("email")) user.setEmail((String) fields.get("email"));
        if (fields.containsKey("firstName")) user.setFirstName((String) fields.get("firstName"));
        if (fields.containsKey("lastName")) user.setLastName((String) fields.get("lastName"));
        if (fields.containsKey("enabled")) user.setEnabled((Boolean) fields.get("enabled"));

        Map<String, List<String>> attributes = user.getAttributes() != null
                ? new HashMap<>(user.getAttributes())
                : new HashMap<>();

        if (fields.containsKey("agence")) {
            attributes.put("agence", List.of((String) fields.get("agence")));
        }
        if (fields.containsKey("region")) {
            attributes.put("region", List.of((String) fields.get("region")));
        }
        user.setAttributes(attributes);

        userResource.update(user);
    }

    public void updateUserRoles(String id, List<String> roles) {
        RealmResource realmResource = keycloak.realm(targetRealm);
        UserResource userResource = realmResource.users().get(id);

        List<RoleRepresentation> current = userResource.roles().realmLevel().listAll();
        if (!current.isEmpty()) {
            userResource.roles().realmLevel().remove(current);
        }

        if (roles != null && !roles.isEmpty()) {
            List<RoleRepresentation> roleReps = roles.stream()
                    .map(roleName -> realmResource.roles().get(roleName).toRepresentation())
                    .toList();
            userResource.roles().realmLevel().add(roleReps);
        }
    }

    public void resetPassword(String id, String newPassword, boolean temporary) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(newPassword);
        credential.setTemporary(temporary);
        keycloak.realm(targetRealm).users().get(id).resetPassword(credential);
    }

    public void deleteUser(String id) {
        keycloak.realm(targetRealm).users().get(id).remove();
    }

    public List<String> getAvailableRoles() {
        return keycloak.realm(targetRealm).roles().list().stream()
                .map(RoleRepresentation::getName)
                .filter(name -> !name.startsWith("default-")
                        && !name.equals("offline_access")
                        && !name.equals("uma_authorization"))
                .toList();
    }
}