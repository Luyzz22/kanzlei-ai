# Runbook: Prod DB Migrations (Neon/Postgres)

Ziel: Produktions-Migrationen robust ausführen (ohne Secrets, ohne destruktive Aktionen).

## Grundprinzip
1) Build/Deploy der App
2) DB Migrationen: `prisma migrate deploy`
3) Tenant RLS Policies anwenden: `db/rls.sql`
4) Optional: Retention Job: `db/retention.sql`

> Wichtig: SUPERUSER/BYPASSRLS umgeht RLS. Produktionsrollen entsprechend konfigurieren.

---

## 1) Standard-Deployment Ablauf (CI/CD)

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build

pnpm exec prisma migrate deploy
psql "$DATABASE_URL_PSQL" -f db/rls.sql
