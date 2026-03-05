# Runbook: Vercel Deployment (Production)

## Ziel
Reproduzierbarer PROD-Deploy für **Vercel + Neon + Prisma + Tenant RLS** (DACH/EU-ready, ohne Secrets im Repo).

## Env Keys (ohne Werte)
Mindestens:
- `DATABASE_URL` (Prisma-URL, **Sensitive**)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` (**Sensitive**)
- `SCIM_BEARER_TOKENS` oder `SCIM_BEARER_TOKEN` (**Sensitive**)
- `SCIM_ALLOWED_IPS` (optional, empfohlen)

Optional je nach Setup:
- Google OAuth: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Microsoft/Entra (geparkt): siehe `docs/todo-entra.md`

## Deploy Flow (CI/CD oder manuell)
```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build

# DB Migrationen (Production)
pnpm exec prisma migrate deploy

# Tenant RLS anwenden (psql-kompatible DSN, NICHT Prisma schema=public URL)
psql "$DATABASE_URL_PSQL" -f db/rls.sql

# Optional: Audit Retention Job (z. B. nightly cron)
psql "$DATABASE_URL_PSQL" -f db/retention.sql

```
