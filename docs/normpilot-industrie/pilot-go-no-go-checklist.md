# NormPilot Pilot Go/No-Go Checklist

Status: Release v0.1

## Go-Kriterien

Release darf in den Pilot gehen, wenn alle Punkte erfuellt sind:

- GitHub CI/Security Gates sind gruen.
- Vercel Production Deploy ist gruen.
- `normpilot-industrie.de`, `www.normpilot-industrie.de` und
  `app.normpilot-industrie.de` sind verified.
- SSL ist fuer alle aktiven Domains aktiv.
- `NEXTAUTH_URL=https://app.normpilot-industrie.de`.
- `AUTH_TRUST_HOST=true`.
- Datenbank-Migrationen sind deployed.
- `db/rls.sql` wurde gegen die Production-Datenbank angewendet.
- `pnpm smoke:normpilot` ist gruen.
- Login/Logout auf `app.normpilot-industrie.de` funktioniert.
- `/dashboard/normpilot` ist nur authentifiziert erreichbar.
- Legal-Seiten sind domainfaehig.
- Demo-/Pilotdaten sind synthetisch oder freigegeben.
- Keine Norm-Volltexte in Demo, Doku, Tests oder Evals.
- Keine produktiven NormPilot Provider Calls.

## No-Go-Kriterien

Pilot nicht starten, wenn einer dieser Punkte zutrifft:

- RLS-Smoke rot.
- Tenant-Isolation unklar.
- Auth Redirect oder OAuth Callback fehlerhaft.
- Build, Typecheck oder Tests rot ohne dokumentierte Freigabe.
- Norm-Volltexte im System.
- echte Kundendaten ohne Freigabe.
- Produktive Provider Calls fuer NormPilot moeglich.
- Audit-Metadata enthaelt Kundentexte, Anchors, Dokumenttitel oder Owner-Labels.
- Export-Hinweise fehlen.
- Legal-Seiten sind nicht domainfaehig.

## Vor-Demo-Check

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:normpilot
pnpm smoke:normpilot
pnpm build
```

Optional gegen Deployment:

```bash
BASE_URL=https://app.normpilot-industrie.de node scripts/security-smoke-test.mjs
```

Der URL-Smoke ist optional, weil er ein erreichbares Deployment benoetigt.

## Production Smoke

Nach Vercel Production Deploy:

- `GET /api/health`
- `GET /login`
- Unauthenticated `GET /dashboard/normpilot` -> Login Redirect.
- Authenticated Demo User -> `/dashboard/normpilot`.
- Requirement Set Detail oeffnet.
- Evidence Pack Export Preview zeigt KI-Hinweis.
- Evidence Pack Export Preview zeigt Normlizenz-Hinweis.
- Keine sensiblen Details in sichtbaren Fehlermeldungen.

## Freigabeprotokoll

Vor Pilotstart dokumentieren:

- Datum/Uhrzeit.
- Release-Branch und Commit.
- Vercel Deployment URL.
- aktive Domains.
- ausgefuehrte Quality Gates.
- Datenfreigabe.
- Legal-Freigabe.
- Go/No-Go-Entscheidung.
