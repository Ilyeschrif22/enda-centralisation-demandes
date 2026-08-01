# arabic-name-transliteration-api

API FastAPI pour la translittération de noms arabes (tunisiens) vers l'orthographe française, avec cache en base de données MySQL et traduction automatique via l'IA (Groq) en cas de nom inconnu.

## Contexte

Ce projet a été construit dans le cadre d'un besoin métier (Enda Tamweel) : convertir des noms et prénoms saisis en arabe vers leur équivalent en orthographe française, de façon fiable et rapide, pour une base d'environ 2000 utilisateurs actifs.

Plutôt que d'appeler un modèle d'IA à chaque requête (lent, coûteux, parfois incohérent), le système fonctionne comme un cache intelligent : chaque nom traduit une fois est sauvegardé en base et réutilisé instantanément pour tous les appels suivants.

## Comment ça marche

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
                         │   tard, hors ligne)        │
                         │   -> corrige si besoin      │
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

## Stack technique

- **FastAPI** — API REST
- **SQLAlchemy** — ORM
- **MySQL** — stockage des traductions (collation `utf8mb4_bin` pour préserver les diacritiques arabes)
- **Groq API** (`llama-3.1-8b-instant`) — translittération automatique des noms inconnus
- **Pydantic / pydantic-settings** — validation des données et gestion de la configuration

## Structure du projet

```
app/
├── main.py                     # point d'entrée FastAPI
├── database.py                 # connexion MySQL (SQLAlchemy)
├── config.py                   # variables d'environnement (.env)
│
└── features/
    └── name_translation/
        ├── models.py           # modèle de la table `noms`
        ├── schemas.py          # validation requête / réponse
        ├── service.py          # logique métier (cache DB + fallback IA)
        ├── groq_client.py      # appel à l'API Groq
        └── router.py           # endpoint /names/translate

scripts/
├── create_db.py                # création de la base MySQL
├── migrate_json_to_db.py       # migration d'un ancien namesdb.json
├── update_name.py              # corrections manuelles de traductions
├── search_name.py              # recherche d'un nom dans la base
└── load_test.py                # test de charge (simulation d'utilisateurs concurrents)
```

## Endpoint

### `POST /names/translate`

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

## Installation

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```


Créer un fichier `.env` :
```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/enda_db
GROQ_API_KEY=votre_clé_groq
```

Créer la base de données :
```bash
python3 -m scripts.create_db
```

Lancer l'API :
```bash
uvicorn app.main:app --reload
```

Documentation interactive disponible sur `http://localhost:8000/docs`.

## Pourquoi cette approche

- **Performance** : la majorité des noms se répètent d'un utilisateur à l'autre ; le cache DB évite des appels IA redondants et coûteux.
- **Fiabilité** : les erreurs de translittération de l'IA (fréquentes sur des noms tunisiens spécifiques) peuvent être corrigées une fois, puis restent correctes pour toujours.
- **Scalabilité** : conçu et testé en charge pour supporter des pics de trafic avec plusieurs centaines de requêtes concurrentes.

