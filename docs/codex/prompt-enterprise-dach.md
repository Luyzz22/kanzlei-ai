# Codex Prompt: Enterprise SaaS (DACH/EU) Hardening Sprint

Repo: `kanzlei-ai` (Next.js 14 App Router, TS, Prisma/Postgres/Neon, NextAuth v5 beta)

## Ziel
Enterprise SaaS für DACH/EU produktionsreif machen (DSGVO, EU AI Act, ISO 27001-ready). Fokus: Sicherheit, Stabilität, Operability, Compliance-by-design.

## Aktueller Stand (wichtig)
- Multi-Tenant Schema + TenantMember
- Postgres RLS Policies vorhanden: `db/rls.sql`
- RLS Enforcement im App-Code via `withTenant` / `set_config('app.tenant_id',...)`
- AuditEvent Logging + Tamper-evident Hash-Chain (`prevHash` / `eventHash`)
- Admin Audit API: `/api/admin/audit`
- Dashboard Audit Viewer: `/dashboard/audit`
- SCIM v2: Users + Groups Endpoints + Token Rotation + IP allowlist
- Retention Script: `db/retention.sql`
- ISMS/Privacy Templates: `docs/isms/*`, `docs/privacy/*`
- Entra SSO ist im Code vorbereitet, aber PROD-Konfiguration ist nicht final (siehe `docs/todo-entra.md`)

## Non-Negotiables (HARTE REGELN)
1) **Keine Secrets** ausgeben oder in Dateien schreiben. Keine Tokens/URLs mit Credentials in Logs/Docs.
2) **Keine destruktiven DB-Operationen** (DROP/TRUNCATE/DELETE ohne WHERE, Schema reset) ohne explizite Bestätigung.
3) Jede Änderung muss **pnpm lint**, **pnpm typecheck**, **pnpm build** bestehen.
4) Multi-Tenant Isolation: jede tenant-bound DB Operation muss unter RLS-Kontext laufen (withTenant).
5) SCIM/Auth: Fehler-Responses konsistent, keine PII im Klartext.
6) Änderungen als **kleine, reviewbare Commits**. Jede Änderung kurz begründen.

## Aufgaben (priorisiert)
### A) PROD-Readiness / CI Hardening
- Sicherstellen, dass `pnpm build` ohne manuelle Schritte läuft.
- `package.json` scripts konsistent: `lint`, `typecheck`, `build`, `start`, `dev`.
- Lockfile: `pnpm-lock.yaml` muss getrackt sein, `.gitignore` darf Lockfile nicht ignorieren.
- Dokumentiere „PROD Deployment (Kurzablauf)” (bereits im README) **verifizieren** und ggf. minimal ergänzen:
  - `pnpm exec prisma migrate deploy`
  - `psql "$DATABASE_URL_PSQL" -f db/rls.sql` (Hinweis: psql URL ohne `?schema=...`)
  - optional `db/retention.sql`

### B) DB/Migrations Robustness (Neon/Postgres)
- Prüfe Migrationen auf „already exists“ Risiken (Enums/Tables).
- Nur dort idempotent machen, wo sicher (z.B. enum create in DO $$ ... EXCEPTION duplicate_object).
- Erstelle/erweitere Runbook: `docs/runbooks/db-migrations.md` (falls nötig) inkl. Recovery:
  - `prisma migrate resolve --applied/--rolled-back` (wann was)
  - wie man fehlende Tabellen/Enums diagnostiziert (read-only Queries)
  - wie man psql-kompatible URL nutzt (`DATABASE_URL_PSQL` ohne query params)

### C) Security/Compliance Enhancements (minimal + sinnvoll)
- SCIM: konsistente Error Shapes (401/403/500) und *keine* 500 bei fehlender Token-Konfig (Prefer: 500 nur wenn misconfigured, 401 wenn invalid).
- Rate limiting / abuse controls für SCIM Endpoints (minimal, ohne externe Services):
  - z.B. in-memory token bucket (best-effort) oder Header-based guardrails.
- Audit: optionaler Verifier (Script/Endpoint) um Hash-Chain pro tenant zu prüfen (read-only; keine DB writes).
- Logging: strukturierte Logs (no PII; correlation via requestId).

### D) Observability
- Health Endpoint optional erweitern:
  - DB connectivity check (ohne sensitive output)
  - build/version info (safe)
- Minimal metrics hooks (counts/timings) ohne externe infra.

## Vorgehensweise
1) Arbeite in kleinen Schritten: erst A (CI/build), dann B (migrations), dann C/D.
2) Nach jedem Schritt: `pnpm lint && pnpm typecheck && pnpm build`.
3) Erstelle kurze PR-style Notizen in Commit Messages / Docs.

## Output Erwartung
- Konkrete Code-Änderungen + neue/aktualisierte Docs (Markdown).
- Keine Secret-Leaks.
- Lint/typecheck/build grün.

