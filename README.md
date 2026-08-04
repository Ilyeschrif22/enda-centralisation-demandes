# Enda Central :  Plateforme de Centralisation des Demandes

Ce projet constitue une solution complète d’entreprise dédiée à la centralisation, la gestion et le traitement intelligent des demandes clients d’Enda Tamweel. Il repose sur une architecture évolutive basée sur un backend métier développé avec Java 17 / Spring Boot 3, un frontend moderne sous React 19, un service d’intelligence et de traitement en arrière-plan développé avec FastAPI, une sécurisation des accès via Keycloak, ainsi qu’une base de données MySQL 8.4.


## Stack Technique & Versions

### Frontend (`enda-frontend`)
- **Bibliothèque / Framework** : **React 19** (`react` v19.2.7, `react-dom` v19.2.7)
- **Outil de Build & Serveur Dev** : **Vite** (v8.1.1)
- **Routage** : `react-router-dom` (v7.18.1)
- **Authentification Client** : `keycloak-js` (v26.2.4)
- **UI & Composants** : Vanilla CSS / Custom CSS
- **Data Visualization** : `recharts` (v3.10.1)
- **Linter & Outils** : `oxlint` (v1.71.0)

### Backend Principal (`enda-springboot-backend`)
- **Langage & Runtime** : **Java 17**
- **Framework** : **Spring Boot 3.5.16**
- **Accès aux Données & ORM** : Spring Data JPA, Hibernate, MySQL Connector/J (`com.mysql:mysql-connector-j`)
- **Sécurité & IAM Admin** : Keycloak Admin Client (`keycloak-admin-client` v24.0.5)
- **Communication & Utilitaires** : Spring Web, Spring Mail (notifications par e-mail), Spring Validation
- **Documentation API** : Springdoc OpenAPI / Swagger UI (`springdoc-openapi-starter-webmvc-ui` v2.8.16)
- **Productivité Code** : Lombok (`org.projectlombok:lombok`)

### Backend IA & Tâches Asynchrones (`enda-fast-api-backend`)
- **Langage & Framework** : **Python 3.11+**, **FastAPI**
- **ORM & Base de données** : SQLAlchemy, PyMySQL
- **Planification de Tâches** : APScheduler
- **Intégration IA & Services** : Groq API (LLM), Google Sheets API (Google Service Account)

### Authentification & Sécurité (`enda-tamweel-keycloak-starter`)
- **Serveur IAM** : **Keycloak** (image conteneurisée basée sur Keycloak 26)
- **Realm** : `microservices-gateway`
- **Client OIDC** : `react-client`
- **Thème** : Thème personnalisé aux couleurs d'Enda Tamweel

### Stockage & Infrastructure
- **SGBD** : **MySQL 8.4** (Bases de données `enda_clients` et `enda_db`)
- **Conteneurisation** : Docker, Docker Compose



## Architecture Globale du Système

La plateforme adopte une **architecture en microservices découplés**, orchestrée via Docker Compose.

```
                               ┌───────────────────────────┐
                               │     Navigateur Client     │
                               │   React 19 / Vite SPA     │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
         (Authentification / Tokens)                      (Requêtes REST API)
                       │                                           │
                       ▼                                           ▼
         ┌───────────────────────────┐               ┌───────────────────────────┐
         │ Keycloak IAM (Port 8180)  │               │ Spring Boot (Port 8089)   │
         │  Realm: microservices-gtw │               │   Java 17 Core Business   │
         └─────────────┬─────────────┘               └─────────────┬─────────────┘
                       │                                           │
                       │                                           │
                       │        ┌───────────────────────────┐      │
                       └───────►│ FastAPI Engine (Port 8000)│◄─────┘
                                │ AI / APScheduler / Sheets │
                                └─────────────┬─────────────┘
                                              │
                                              ▼
                                ┌───────────────────────────┐
                                │   MySQL 8.4 (Port 3306)   │
                                │  enda_clients / enda_db   │
                                └───────────────────────────┘
```

### Rôle des Composants :
1. **Frontend (React 19)** : Intercepte les demandes utilisateurs, gère la session OIDC avec Keycloak, affiche les dashboards interactifs et consomme les API REST.
2. **Keycloak Starter** : Gère l'authentification centralisée (Single Sign-On), le contrôle d'accès basé sur les rôles (RBAC) et délivre les tokens JWT.
3. **Spring Boot Backend (Java 17)** : Cœur de métier gérant le traitement des dossiers de demande, la gestion des agences, les utilisateurs, l'éligibilité et l'envoi de mails.
4. **FastAPI Backend** : Module spécialisé dans la synchronisation des données (Google Sheets), le traitement automatique par IA (Groq) et la planification des jobs (APScheduler).
5. **Base de données MySQL 8.4** : Stockage persistant avec scripts de démarrage auto-initialisés (`agences enda.sql`, `names_db.sql`).



## Structures des Projets & Approches Architecturales

### 1. `enda-frontend` — Approach: Component-Driven SPA Architecture

Le projet Frontend utilise une approche moderne basée sur les composants React 19 et la puissance du bundler Vite.

```text
enda-frontend/
├── src/
│   ├── assets/           # Images, logos et icônes
│   ├── components/       # Composants UI réutilisables (Alerts, Buttons, Modals)
│   ├── context/          # Contextes React (AuthContext, KeycloakContext)
│   ├── layout/           # Structures de page (Header, Sidebar, Main Layout)
│   ├── pages/            # Vues principales de l'application (Dashboard, Demandes, Agences)
│   ├── services/         # Clients API HTTP (Axios / Fetch) vers Spring & FastAPI
│   ├── App.jsx           # Composant Racine avec configuration du Router
│   ├── main.jsx          # Point d'entrée de l'application React 19
│   └── index.css         # Styles globaux & thèmes
├── Dockerfile            # Packaging Nginx / Prod build
├── package.json          # Dépendances React 19 & Scripts
└── vite.config.js        # Configuration Vite
```

**Approche :**
- **Découpage modulaire** : Séparation stricte entre l'état d'authentification (`context`), les services API (`services`) et les éléments de présentation (`components`).
- **Gestion de session** : Utilisation du client officiel `keycloak-js` pour sécuriser les routes et transmettre le token `Bearer` dans les en-têtes HTTP.



### 2. `enda-springboot-backend` — Approach: Layered Architecture (Controller-Service-Repository DTO Pattern)

Le backend Spring Boot sous Java 17 suit les standards Enterprise Java avec une architecture en couches étanches.

```text
enda-springboot-backend/
├── src/
│   ├── main/
│   │   ├── java/com/enda/backend/
│   │   │   ├── config/        # SecurityConfig, KeycloakConfig, Swagger/OpenAPI, CORS
│   │   │   ├── controller/    # Endpoints REST (@RestController)
│   │   │   │   ├── AgenceController.java
│   │   │   │   ├── DemandeClientController.java
│   │   │   │   ├── EligibiliteController.java
│   │   │   │   ├── KeycloakUserController.java
│   │   │   │   └── UtilisateurController.java
│   │   │   ├── dto/           # Data Transfer Objects & Mappings (Request/Response)
│   │   │   ├── entity/        # Entités JPA (Mappage ORM de la base MySQL)
│   │   │   ├── repository/    # Interfaces Spring Data JPA (@Repository)
│   │   │   ├── service/       # Interfaces & Logique Métier (@Service)
│   │   │   └── EndaApplication.java  # Classe principale Spring Boot
│   │   └── resources/
│   │       ├── application.properties # Conf Spring Boot & JPA
│   │       └── application.yml        # Configurations d'environnement
├── Dockerfile                 # Multi-stage build Maven / OpenJDK 17
└── pom.xml                    # Maven POM (Spring Boot 3.5.16 & Java 17)
```

**Approche :**
- **Layered Architecture (N-Tiers)** :
  - `Controller` : Validation de l'entrée HTTP et exposition des endpoints REST.
  - `Service` : Encapsulation des règles métier et des transactions (`@Transactional`).
  - `Repository` : Accès et requêtage JPA/Hibernate vers la base MySQL `enda_clients`.
  - `DTO` : Isolation des modèles de base de données vis-à-vis de la couche d'exposition API.
- **Intégration Keycloak Admin** : Interaction directe avec le serveur Keycloak pour la création et la synchronisation des comptes utilisateurs via `KeycloakAdminClient`.



### 3. `enda-fast-api-backend` — Approach: Feature-Driven & Asynchronous Service Architecture

Le backend Python sous FastAPI est structuré par fonctionnalités (*Feature-Driven Architecture*), privilégiant l'asynchronisme et la modularité.

```text
enda-fast-api-backend/
├── app/
│   ├── clients/         # Connecteurs d'intégration externe (Spring Boot, Groq AI, Google API)
│   ├── features/        # Modules fonctionnels découpés par domaine
│   │   ├── name_translation/  # Traduction & normalisation des noms
│   │   └── sheets_data/       # Ingestion & synchronisation Google Sheets
│   ├── config.py        # Chargement des variables d'environnement
│   ├── database.py      # Engine SQLAlchemy & Gestion de session MySQL (`enda_db`)
│   ├── main.py          # Application FastAPI, Middlewares, Inclusion des routers
│   └── scheduler.py     # Tâches périodiques en arrière-plan (APScheduler)
├── Dockerfile           # Multi-stage image Python 3.11+
└── requirements.txt     # Dépendances (FastAPI, SQLAlchemy, PyMySQL, APScheduler, etc.)
```

**Approche :**
- **Feature-Based Packaging** : Chaque domaine fonctionnel (`features/`) contient sa propre logique, facilitant le passage à l'échelle et la maintenance.
- **Background Tasks & Scheduler** : `APScheduler` gère l'exécution périodique des tâches sans bloquer l'Event Loop de FastAPI.
- **Connexion Spring Boot** : FastAPI communique également avec la brique Spring Boot pour remonter des analyses ou synchroniser des données.



### 4. `enda-tamweel-keycloak-starter` — Approach: Custom Distribution & IAM Starter

Projet dédié au packaging du serveur Keycloak avec la configuration et la charte graphique d'Enda Tamweel.

```text
enda-tamweel-keycloak-starter/
├── conf/                # Configuration Keycloak (keycloak.conf)
├── data/                # Export/Import Realm (`microservices-gateway`)
├── providers/           # SPI (Service Provider Interfaces) personnalisés
├── themes/              # Thèmes personnalisés (Login, Account UI) aux couleurs d'Enda
└── Dockerfile           # Construction de l'image Keycloak d'entreprise
```



## Démarrage Rapide (Docker Compose)

### 1. Prérequis
- Docker Desktop installé et démarré.
- Un fichier de compte de service Google JSON (`google-service-account.json`) pour l'intégration FastAPI Google Sheets.

### 2. Configuration des Variables d'Environnement
Copiez le fichier d'exemple et configurez la variable système obligatoire :
```bash
cp .env.example .env
```
Assurez-vous de définir dans votre `.env` le chemin absolu vers votre fichier Google Service Account :
```dotenv
GOOGLE_SERVICE_ACCOUNT_FILE_HOST=C:/Users/votre-nom/.config/enda/google-service-account.json
```

### 3. Lancement de la Stack Complète
Exécutez la commande suivante à la racine du projet :
```bash
docker compose up --build
```

### 4. Accès aux Services
Une fois la stack démarrée, les services sont accessibles sur les ports suivants :

| Service | Technologie | URL / Endpoint |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 / Vite | http://localhost:5173 |
| **Spring Boot API** | Java 17 / Spring Boot 3 | http://localhost:8089 |
| **Swagger UI (Spring)** | Springdoc | http://localhost:8089/swagger-ui.html |
| **FastAPI Docs** | Python / FastAPI | http://localhost:8000/docs |
| **Keycloak IAM Admin** | Keycloak 26 | http://localhost:8180 (Admin: admin/admin) |
| **Base MySQL** | MySQL 8.4 | localhost:3306 |

### 5. Arrêt de la Stack
```bash
# Arrêter les conteneurs
docker compose down

# Arrêter les conteneurs et nettoyer les volumes de données persistantes (MySQL & Keycloak)
docker compose down -v
```



### 6.  POST /demandes :

| Champ | Type | Description |
|---|---|---|
| `cin` | string | Identifiant utilisateur (normalisé trim + uppercase) |
| `telephone` | string | Utilisé si nouvel utilisateur |
| `nomFamille` | string | Nom |
| `prenom` | string | Prénom |
| `adresse` | string | Mappé sur `adresseDomicile` (utilisateur) et `adresseProjet` (demande) |
| `genre` | string | |
| `situationFamiliale` | string | |
| `gouvernorat` | string | |
| `delegation` | string | |
| `codePostal` | string | |
| `dateNaissance` | string `yyyy-MM-dd` | |
| `secteurActivite` | string | Écrase aussi `activite` |
| `activite` | string | |
| `utilisationPret` | string | Mappé sur `besoin` |
| `dureePret` | string | |
| `agence` | string | Sert à déduire la `region` |
| `typeDemande` | string (enum `TypeDemande`) | |
| `capaciteRemboursement` | int / string numérique | |
| `montantDemande` | string | Prioritaire sur `montant` |
| `montant` | string | Fallback |

### Champs auto-générés (ne pas envoyer)
`id`, `dateSaisie`, `numeroDemande`, `typeClient`, `statut`, `canal`, `contacte`

<img width="1374" height="713" alt="image" src="https://github.com/user-attachments/assets/d648c7f3-e861-4ad0-9f07-0cb24bc23ad0" />




## Licence
Projet interne - **Enda Tamweel** (c) 2026. Tous droits réservés.
