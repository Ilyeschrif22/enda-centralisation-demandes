# Enda local stack

Run the whole application from this directory with Docker Desktop running:

```bash
docker compose up --build
```

Before starting, create a `.env` file from `.env.example` and set
`GOOGLE_SERVICE_ACCOUNT_FILE_HOST` to your Google service-account JSON file.
Compose mounts this file read-only into FastAPI at
`/run/secrets/google-service-account.json`; it is deliberately excluded from
the image and Git. For example, on Windows:

```dotenv
GOOGLE_SERVICE_ACCOUNT_FILE_HOST=C:/Users/your-name/.config/enda/google-service-account.json
```

If the variable is missing or the file path is invalid, `docker compose up`
stops immediately with a configuration error instead of starting a scheduler
that continually logs missing-credential errors.

The services are then available at:

- Frontend: http://localhost:5173
- Spring API: http://localhost:8089
- FastAPI docs: http://localhost:8000/docs
- Keycloak: http://localhost:8180 (admin/admin by default)
- MySQL: localhost:3306 (root / `enda_dev_password` by default)

Compose creates and persists the `enda_clients` and `enda_db` databases in the
`mysql-data` Docker volume, and the supplied Keycloak realm in the
`keycloak-data` volume. It uses development-only default
credentials. To override them, copy `.env.example` to `.env` at this root and
change the values before the first `docker compose up`.

Stop the stack with `docker compose down`. To also remove the persisted local
database, run `docker compose down -v`.
