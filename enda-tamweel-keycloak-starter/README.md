# Keycloak custom theme

A custom Keycloak login theme with custom login and registration pages, built on top of the base Keycloak theme.

## Features

- Custom login page (`login.ftl`)
- Custom registration page (`register.ftl`) with username, email, password, and password confirmation fields
- Separate stylesheets for login and registration (`login.css`, `register.css`)
- Social login button support (inherited from Keycloak's social providers)

## Project structure

```
themes/
└── ton-theme/
    └── login/
        ├── theme.properties
        ├── template.ftl
        ├── login.ftl
        ├── register.ftl
        ├── error.ftl
        └── resources/
            └── css/
                ├── login.css
                └── register.css
```

## Requirements

- Keycloak 24.0.3
- Java 17+

## Running Keycloak locally

Start Keycloak in development mode:

```bash
bin/kc.sh start-dev --http-port=8180
```

Keycloak will be available at:

```
http://localhost:8180
```

Admin console:

```
http://localhost:8180/admin
```

Realm used in this project:

```
microservices-realm
```

## Running with Docker

Build the image:

```bash
docker build -t keycloak .
```

Run the container:

```bash
docker run -p 8180:8180 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  keycloak
```
