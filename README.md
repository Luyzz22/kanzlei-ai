# KanzleiAI – Next.js 14 Starter

Dieses Repository enthält ein initiales **Next.js 14 App-Router Setup** für KanzleiAI inklusive DSGVO-Bausteinen, Auth-Grundlage und Dashboard-UI.

## Enthalten

- Next.js 14 + TypeScript + TailwindCSS
- shadcn/ui Grundkonfiguration (`components.json`, `Button`, Utility-Funktionen)
- Prisma Schema für PostgreSQL inkl. RBAC-Rollen (`ADMIN`, `ANWALT`, `ASSISTENT`)
- NextAuth.js v5 Basis mit:
  - Credentials (E-Mail/Passwort)
  - Google OAuth2
  - Microsoft OAuth2
  - Session-Timeout: 30 Minuten
- DSGVO-Seiten:
  - `/datenschutz`
  - `/impressum`
  - `/avv`
  - Cookie-Consent-Banner
- Basis-UI:
  - Landing Page (Hero + Pricing)
  - Dashboard-Layout mit Sidebar
  - Dark Mode Support

## Projektstart

```bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm dev
```

Lokale URL: `http://localhost:3001` (`NEXTAUTH_URL=http://localhost:3001`).
Produktion: `https://www.kanzlei-ai.com`.

## KI-Vertragsanalyse (Multi-Provider)

Die Workbench (`/workspace/dokumente/[id]`) kann eine **mandantenbezogene Vertragsanalyse** ausführen: zweistufige Pipeline (strukturierte Extraktion → Risiko- und Handlungsempfehlungen) mit **Zod-validierten** Ergebnissen, Speicherung in `AnalysisRun`, `AnalysisProviderDecision`, `AnalysisFinding`, `DocumentExtraction` sowie Audit-Events (`analysis.pipeline.*`).

- **Anbieter:** OpenAI, Anthropic (Claude), Google Gemini, optional Llama über **OpenAI-kompatible** HTTP-API (`LLAMA_API_BASE` + `LLAMA_API_KEY`). Es werden nur Anbieter genutzt, für die ein Key gesetzt ist.
- **Routing:** Kurze Texte / Extraktion → bevorzugt OpenAI (schema-freundlich); lange Texte → eher Gemini; Klausel- und Risikoteil → eher Claude. `AI_PROVIDER_PRIORITY` sortiert nur die **Fallback-Kette**, das Primärmodell bleibt führend.
- **Konfiguration:** siehe `.env.example` (`OPENAI_*`, `ANTHROPIC_*`, `GEMINI_*`, `LLAMA_*`, `AI_ROUTER_ENABLED`, …).
- **Tests:** `pnpm test` (Router, Schema-Validierung, Provider-Verfügbarkeit).

## Prisma

```bash
pnpm prisma migrate dev --name init
```

Für Neon/Postgres mit Pooling gilt:
- `DATABASE_URL` = Runtime/Pooling-Verbindung
- `DIRECT_URL` = direkte Prisma-CLI-Verbindung (Migrate/Introspect)
- Die Prisma-Skripte setzen für lokale Convenience automatisch `DIRECT_URL=$DATABASE_URL`, falls `DIRECT_URL` nicht explizit gesetzt ist.

## Hinweise

- Für produktiven Einsatz müssen Rechts- und AVV-Texte rechtlich geprüft werden.
- OAuth-Credentials in `.env` ergänzen (`AUTH_GOOGLE_*`, `AUTH_MICROSOFT_*`).
- Microsoft Entra wird nur geladen, wenn `AUTH_MICROSOFT_ID`, `AUTH_MICROSOFT_SECRET` **und** `AUTH_MICROSOFT_ENTRA_ID_ISSUER` gesetzt sind.
- SCIM ist standardmäßig deaktiviert und wird nur aktiviert, wenn Token **und** `SCIM_TENANT_SLUG` gesetzt sind.
- CI: GitHub Actions (lint/typecheck/build).

## Tenant RLS (Enterprise)
Nach `prisma migrate deploy` muss Row-Level Security angewendet werden:

```bash
psql "$DATABASE_URL" -f db/rls.sql
```

## PROD Deployment (Kurzablauf)

Für produktive Deployments (z. B. CI/CD) sollte der Ablauf in dieser Reihenfolge erfolgen:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm prisma migrate deploy
psql "$DATABASE_URL" -f db/rls.sql
```

Optional: Audit-Retention ausführen (z. B. als geplanter Job):

```bash
psql "$DATABASE_URL" -f db/retention.sql
```

## Compliance Index

### Security Controls (Tech)
- **Tenant Isolation (Postgres RLS):** `db/rls.sql`
- **Audit Logging:** `AuditEvent` (siehe DB Schema), Admin API: `/api/admin/audit`, UI: `/dashboard/audit`
- **Tamper-Evident Audit Trail:** `AuditEvent.prevHash` / `AuditEvent.eventHash`
- **Retention (Audit):** `db/retention.sql`

### Identity & Access (Enterprise)
- **SSO (Microsoft Entra OIDC):** `docs/sso-microsoft-entra.md`
- **SCIM v2 (Users/Groups):** `docs/scim.md`
  - Endpoints: `/api/scim/v2/*`
  - Auth: Bearer Token (`SCIM_BEARER_TOKEN` / `SCIM_BEARER_TOKENS`) + optional `SCIM_ALLOWED_IPS`

### ISMS / ISO 27001 Preparation
- ISMS Overview: `docs/isms/README.md`
- Risk Register: `docs/isms/risk-register.md`
- Asset Inventory: `docs/isms/asset-inventory.md`
- Access Control Policy: `docs/isms/access-control-policy.md`
- Logging & Monitoring Policy: `docs/isms/logging-monitoring-policy.md`
- Incident Response: `docs/isms/incident-response.md`
- Vendor Management: `docs/isms/vendor-management.md`
- Change Management: `docs/isms/change-management.md`

### Privacy (DSGVO)
- DSFA/DPIA Template: `docs/privacy/dsfa-template.md`
- AVV Template: `docs/privacy/avv-template.md`
