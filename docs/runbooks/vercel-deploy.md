# Runbook: Vercel Deployment (Prod)

## Env Keys (ohne Werte)
- `DATABASE_URL`
- `DIRECT_URL` (optional, empfohlen für Prisma)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (optional)
- `AUTH_MICROSOFT_ID`, `AUTH_MICROSOFT_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ISSUER` (optional)
- `AUTH_MICROSOFT_ALLOWED_TENANT_IDS` (optional)
- `AUTH_MICROSOFT_ADMIN_ROLES` (optional)
- `SCIM_BEARER_TOKEN` oder `SCIM_BEARER_TOKENS`
- `SCIM_ALLOWED_IPS` (optional)
- `SCIM_TENANT_SLUG`
- `SCIM_GROUP_ADMIN`, `SCIM_GROUP_ANWALT`, `SCIM_GROUP_ASSISTENT` (optional)

## Build & Deploy Steps
1. Install:
   ```bash
   pnpm install --frozen-lockfile
   ```
2. Qualitätsgates:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```
3. DB-Migrationen:
   ```bash
   pnpm prisma migrate deploy
   ```
4. RLS anwenden:
   ```bash
   psql "$DATABASE_URL" -f db/rls.sql
   ```

## Retention Job (empfohlen)
Geplant (cron/worker) ausführen:
```bash
psql "$DATABASE_URL" -f db/retention.sql
```
