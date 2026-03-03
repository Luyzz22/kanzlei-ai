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

## Prisma

```bash
pnpm prisma migrate dev --name init
```

## Hinweise

- Für produktiven Einsatz müssen Rechts- und AVV-Texte rechtlich geprüft werden.
- OAuth-Credentials in `.env` ergänzen (`AUTH_GOOGLE_*`, `AUTH_MICROSOFT_*`).

## Tenant RLS (Enterprise)
Nach `prisma migrate deploy` muss Row-Level Security angewendet werden:

```bash
psql "$DATABASE_URL" -f db/rls.sql
```
