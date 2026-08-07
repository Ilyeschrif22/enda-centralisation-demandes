# Enda API

API FastAPI pour le backend Enda Tamweel, regroupant deux fonctionnalités principales :

1. **Translittération de noms arabes** — conversion de noms/prénoms saisis en arabe vers l'orthographe française, avec cache en base de données MySQL et traduction automatique via l'IA (Groq) en cas de nom inconnu.
2. **Centralisation des demandes Google Sheets** — lecture des formulaires Google Sheets, translittération des noms arabes, transformation des lignes en prospects et envoi vers le backend Spring.

## Contexte

### 1. Translittération des noms

Ce projet a été construit dans le cadre d'un besoin métier (Enda Tamweel) : convertir des noms et prénoms saisis en arabe vers leur équivalent en orthographe française, de façon fiable et rapide, pour une base d'environ 2000 utilisateurs actifs.

Plutôt que d'appeler un modèle d'IA à chaque requête (lent, coûteux, parfois incohérent), le système fonctionne comme un cache intelligent : chaque nom traduit une fois est sauvegardé en base et réutilisé instantanément pour tous les appels suivants.

### 2. Centralisation des demandes

Les demandes de crédit sont collectées via des formulaires Google Forms. Ce service lit automatiquement les Google Sheets associés, traduit les noms arabes en français, nettoie et normalise les données (téléphone, montant, dates…), puis les transforme en objets `Prospect` pour les envoyer au backend Spring. Un ordonnanceur (APScheduler) synchronise les feuilles automatiquement toutes les 10 secondes.

## Comment ça marche

### Translittération

```
                     Nom Arabe saisi
                           │
                           ▼
              Découper (Prénom / Nom)
                           │
                           ▼
              Chercher dans la Base
              de Traductions
              ┌────────────┴────────────┐
              │                         │
          Trouvé                   Non Trouvé
              │                         │
              ▼                         ▼
     Retourner directement      Envoyer à Groq AI
     (aucun appel IA)           (llama-3.1-8b-instant)
                                        │
                                        ▼
                              Traduction Suggérée
                                        │
                                        ▼
                              Sauvegarde en Base
                              (statut: Non Vérifié)
                                        │
                                        ▼
                              Retourner au client
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │   Revue Humaine (plus     │
                         │   tard, hors ligne)       │
                         │   -> corrige si besoin    │
                         └──────────────┬───────────┘
                                        ▼
                              Statut: Vérifié
                          (utilisé en confiance pour
                           tous les futurs utilisateurs)
```

**Idée centrale : la base de données est la source de vérité, l'IA n'est qu'un filet de secours.**

- Un nom déjà vu → réponse instantanée depuis MySQL, aucun appel IA.
- Un nom nouveau → un seul appel à Groq, résultat sauvegardé pour toujours.
- Les traductions générées par l'IA sont marquées comme "non vérifiées" et peuvent être corrigées manuellement plus tard sans jamais perdre le travail déjà fait.
- Un nom déjà écrit en français/latin dans une feuille Google Sheets traverse le pipeline **sans** passer par le service de traduction (évite les mauvaises correspondances avec le dictionnaire arabe → français).

### Pipeline Google Sheets → Spring

```
Google Sheets (Google Forms)
         │
         ▼
Lecture via API Google (service account)
         │
         ▼
Sélection / normalisation des colonnes
(résistant aux espaces insécables, ponctuation…)
         │
         ▼
Translittération des noms arabes (Prénom / Nom)
         │
         ▼
Nettoyage : téléphone (+216 → 8 chiffres),
montant ([100-1000] → 100-1000), dates (ISO)
         │
         ▼
Mapping ligne → Prospect (spring_mapper.py)
         │
         ▼
Envoi au backend Spring
(POST /prospects/save)
         │
         ▼
Ordonnanceur : toutes les 10 secondes
```

## Stack technique

- **FastAPI** — API REST
- **SQLAlchemy** — ORM
- **MySQL** — stockage des traductions (collation `utf8mb4_bin` pour préserver les diacritiques arabes)
- **Groq API** (`llama-3.1-8b-instant`) — translittération automatique des noms inconnus
- **Pydantic / pydantic-settings** — validation des données et gestion de la configuration
- **Google Sheets API / Google Drive API** — lecture des formulaires (service account)
- **httpx** — client HTTP vers le backend Spring
- **APScheduler** — synchronisation automatique des Google Sheets
- **Docker** — conteneurisation (image `python:3.12-slim`)

## Structure du projet

```
app/
├── main.py                     # point d'entrée FastAPI ("Enda API")
├── database.py                 # connexion MySQL (SQLAlchemy) + init avec retries
├── config.py                   # variables d'environnement (.env)
├── scheduler.py                # synchronisation automatique des Google Sheets (APScheduler)
│
├── clients/
│   └── spring_client.py        # client HTTP vers le backend Spring (POST /prospects/save)
│
└── features/
    ├── name_translation/
    │   ├── models.py           # modèle de la table `noms`
    │   ├── schemas.py          # validation requête / réponse
    │   ├── service.py          # logique métier (cache DB + fallback IA)
    │   ├── groq_client.py      # appel à l'API Groq
    │   └── router.py           # endpoint /names/translate
    │
    └── sheets_data/
        ├── google_sheets.py    # client Google Sheets / Drive (service account)
        ├── service.py          # normalisation des lignes + translittération + nettoyage
        ├── spring_mapper.py    # mapping ligne → objet Prospect
        ├── canal_mapping.py    # correspondance spreadsheet_id → canal (WEB, FACEBOOK, WHATSAPP)
        └── sheets.py           # endpoints /sheets

scripts/
├── migrate-json-to-db.py       # migration d'un ancien namesdb.json
├── load_test.py                # test de charge (simulation d'utilisateurs concurrents)
├── test_names.py               # test unitaires de translittération
└── test-db-connection.py       # vérification de la connexion MySQL
```

## Endpoints

### `POST /names/translate`

Translittère un nom arabe complet (prénom + nom) vers l'orthographe française.

**Requête :**
```json
{
  "name": "محمد الشريف"
}
```

**Réponse :**
```json
{
  "original": "محمد الشريف",
  "traduit": "Mohamed Chérif"
}
```

### `GET /sheets/`

Liste toutes les feuilles Google Sheets accessibles via le service account.

**Réponse :**
```json
{
  "sheets": [
    { "id": "1Dqw7CjLKnm-...", "name": "Demandes WEB" }
  ]
}
```

### `GET /sheets/{spreadsheet_id}`

Récupère le contenu normalisé d'une feuille : colonnes sélectionnées, noms arabes traduits, téléphone/montant/dates nettoyés.

**Réponse :**
```json
{
  "content": [
    {
      "tab": "Sheet1",
      "rows": [
        {
          "Timestamp": "8/7/2026 10:30:00",
          "Type de demande": "Crédit",
          "Nom de famille": "Chérif",
          "Prénom": "Mohamed",
          "Date de naissance": "01/01/1990",
          "...": "..."
        }
      ]
    }
  ]
}
```

### `GET /sheets/{spreadsheet_id}/preview`

Affiche les données telles qu'elles seront envoyées au backend Spring, **sans** les envoyer réellement (mapping complet vers le format `Prospect`).

### `POST /sheets/{spreadsheet_id}/send`

Envoie immédiatement les lignes de la feuille au backend Spring (`POST /prospects/save`).

### `GET /sheets/{spreadsheet_id}/columns`

Outil de debug : retourne les en-têtes bruts de la feuille, avec `repr()` pour exposer les espaces cachés / problèmes d'encodage.

## Synchronisation automatique (scheduler)

Un ordonnanceur APScheduler (`app/scheduler.py`) tourne en arrière-plan et répète toutes les **10 secondes** :

1. Lit le contenu de chaque Google Sheets référencée dans `SPREADSHEET_CANAL_MAP` (`canal_mapping.py`)
2. Normalise et traduit les lignes
3. Mappe les lignes en objets `Prospect` (avec canal : WEB, FACEBOOK, WHATSAPP…)
4. Envoie le tout au backend Spring (`POST /prospects/save`)

## Installation

### Avec venv

```bash
python -m venv venv
source venv/bin/activate        # Linux / macOS
.\venv\Scripts\Activate.ps1     # Windows
pip install -r requirements.txt
```

### Avec Docker

```bash
docker build -t enda-api .
docker run -p 8000:8000 \
  -e DATABASE_URL="mysql+pymysql://user:password@host:3306/enda_db" \
  -e GROQ_API_KEY="votre_clé_groq" \
  -e SPRING_URL="http://localhost:8089" \
  -v /chemin/vers/secret.json:/app/secret.json \
  enda-api
```

## Configuration

Créer un fichier `.env` à la racine du projet :

```
# Connexion MySQL
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/enda_db

# Clé API Groq (translittération des noms inconnus)
GROQ_API_KEY=votre_clé_groq

# URL du backend Spring (optionnel, défaut: http://localhost:8089)
SPRING_URL=http://localhost:8089
```

Variables d'environnement supplémentaires :

| Variable | Défaut | Description |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_FILE` | `secret.json` | Chemin vers le fichier JSON du service account Google (lecture Sheets/Drive en lecture seule) |
| `SPRING_URL` | `http://localhost:8089` | URL de base du backend Spring |

Le fichier `secret.json` du service account Google doit être placé à la racine du projet (ou son chemin indiqué via `GOOGLE_SERVICE_ACCOUNT_FILE`). Les scopes requis sont `drive.readonly` et `spreadsheets.readonly`.

Créer la base de données :

```bash
python -m scripts.test-db-connection   # vérifier la connexion MySQL
```

La base et les tables sont créées automatiquement au démarrage (`init_db` avec retries pour attendre que MySQL soit prêt, utile en environnement Docker).

Lancer l'API :

```bash
uvicorn app.main:app --reload
```

Documentation interactive disponible sur `http://localhost:8000/docs`.

## Pourquoi cette approche

- **Performance** : la majorité des noms se répètent d'un utilisateur à l'autre ; le cache DB évite des appels IA redondants et coûteux.
- **Fiabilité** : les erreurs de translittération de l'IA (fréquentes sur des noms tunisiens spécifiques) peuvent être corrigées une fois, puis restent correctes pour toujours.
- **Scalabilité** : conçu et testé en charge pour supporter des pics de trafic avec plusieurs centaines de requêtes concurrentes.
- **Automatisation** : les demandes Google Forms sont centralisées et synchronisées vers le backend Spring sans intervention manuelle.
- **Nettoyage des données** : normalisation robuste des en-têtes Google Sheets (espaces insécables, ponctuation), téléphones (+216), montants `[100-1000]`, et dates — avant toute utilisation métier.