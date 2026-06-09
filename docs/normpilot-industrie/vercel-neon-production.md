# NormPilot Industrie — Vercel & Neon Production Runbook

Klassifikation: INTERN  
Produkt: NormPilot Industrie  
Zielumgebung: Production

## Ziel

NormPilot wird getrennt von KanzleiAI betrieben:

```text
Vercel Project: normpilot-industrie
GitHub Repo: Luyzz22/normpilot-industrie
Production App: https://app.normpilot-industrie.de
Marketing Domain: https://www.normpilot-industrie.de
Apex Redirect: https://normpilot-industrie.de -> https://www.normpilot-industrie.de
Database: Neon PostgreSQL EU Central / Frankfurt
```

## Vercel Project

Einstellungen:

```text
Framework: Next.js
Root Directory: ./
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm build
Production Branch: main
Node.js: 22.x
```

## Git Integration

Vercel Project `normpilot-industrie` muss auf dieses Repo zeigen:

```text
Luyzz22/normpilot-industrie
```

Nicht mehr auf:

```text
Luyzz22/kanzlei-ai
```

## Production Environment Variables

Pflicht:

```text
NEXTAUTH_URL=https://app.normpilot-industrie.de
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET=<normpilot-production-secret>
DATABASE_URL=<neon-frankfurt-pooled-url>
DIRECT_URL=<neon-frankfurt-direct-url>
DATABASE_URL_PSQL=<neon-frankfurt-psql-direct-url>
```

Optional nur bei tatsaechlicher Nutzung:

```text
BLOB_READ_WRITE_TOKEN
SCIM_BEARER_TOKENS
CRON_SECRET
```

Nicht fuer v0.1 setzen, solange keine explizite Freigabe vorliegt:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
LLAMA_API_KEY
```

## Neon Production DB

Zielregion:

```text
AWS EU Central 1 / Frankfurt
```

Empfohlenes Projekt:

```text
normpilot-industrie-prod
```

Datenbank:

```text
neondb
```

Vorgaben:

- keine echte Kundendaten in Preview-/Test-Branches
- keine Secrets in GitHub Actions Logs
- Connection Strings nur als Vercel/GitHub Secrets speichern
- alte oder versehentlich offengelegte Connection Strings rotieren

## Domain Setup

Vercel Domains im Projekt `normpilot-industrie`:

```text
app.normpilot-industrie.de   Production App/Auth Domain
www.normpilot-industrie.de   Marketing/Landing Domain
normpilot-industrie.de       Redirect -> www.normpilot-industrie.de
```

DNS-Werte immer exakt aus Vercel uebernehmen.

Nicht aus einem anderen Projekt kopieren, wenn Vercel projektspezifische CNAMEs anzeigt.

## Deployment-Reihenfolge

1. GitHub Repo verbinden.
2. Production Env Vars setzen.
3. Neon Frankfurt DB anbinden.
4. Domains im Vercel Project hinzufuegen.
5. STRATO DNS setzen.
6. Production Redeploy triggern.
7. Prisma Migration anwenden.
8. RLS anwenden.
9. Smoke Tests ausfuehren.

## DB Migration

Nach Production Env Setup:

```bash
pnpm exec prisma migrate deploy
psql "$DATABASE_URL_PSQL" -f db/rls.sql
```

Keine destruktiven Migrationen ohne explizite Freigabe.

## Smoke Tests

Nach DNS-Propagation und Redeploy:

```bash
curl -I https://normpilot-industrie.de
curl -I https://www.normpilot-industrie.de
curl -I https://app.normpilot-industrie.de
curl -I https://app.normpilot-industrie.de/api/health
```

Browserpruefung:

```text
https://app.normpilot-industrie.de/login
https://app.normpilot-industrie.de/dashboard/normpilot
https://app.normpilot-industrie.de/impressum
https://app.normpilot-industrie.de/datenschutz
https://app.normpilot-industrie.de/avv
```

## Go/No-Go

Go erst, wenn:

```text
GitHub Repo verbunden
Vercel Production Build gruen
Domains verified
SSL aktiv
NEXTAUTH_URL korrekt
Login/Logout funktioniert
/dashboard/normpilot erreichbar
Legal-Seiten erreichbar
RLS angewendet
Keine produktiven Public-LLM-Keys gesetzt
Keine KanzleiAI-Domain betroffen
```

## Rollback

Bei Fehlern:

1. Vercel Deployment auf vorheriges Ready Deployment zuruecksetzen.
2. DNS nicht mehrfach ohne Wartezeit aendern.
3. Env Vars pruefen.
4. Neon Branch/Restore Point pruefen.
5. Keine DB-Resets ohne Owner-Freigabe.
