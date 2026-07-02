# Session 0 — Step 3: Environment config

## What was built
- `backend/.env.example` — committed template with placeholder values (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD=changeme`, `DB_NAME`, `PORT`).
- `backend/.env` — real local credentials (gitignored, confirmed via `git check-ignore -v backend/.env`).
- Verified the connection works: `psql -U postgres -h localhost -d tripflow` successfully connects to the existing `tripflow` database (Postgres 18.4).

## Why these decisions were made
- Used the `tripflow` database the user had already created, and the default `postgres` superuser — matches the "existing postgres superuser" option chosen during planning, no new dedicated role needed.
- `PORT=3001` for the backend, matching the port already referenced throughout `CLAUDE.md`'s command examples.
- Confirmed `scram-sha-256` auth is enforced locally (checked `pg_hba.conf`), so the password is required in `.env` — not something that could be skipped via trust auth.
