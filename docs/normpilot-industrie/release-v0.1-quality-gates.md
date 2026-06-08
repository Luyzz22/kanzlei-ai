# NormPilot Release v0.1 Quality Gates

Status: Release Freeze

## Ziel

Dieses Dokument definiert die Environment-, Deployment- und Quality-Gates fuer
den NormPilot v0.1 Pilot-Livegang auf Vercel.

## Required Environment Variables

Production:

| Variable | Pflicht | Zweck |
|---|---:|---|
| `NEXTAUTH_URL` | Ja | `https://app.normpilot-industrie.de` |
| `AUTH_TRUST_HOST` | Ja | `true`, damit Auth.js/Vercel Host Header vertraut |
| `NEXTAUTH_SECRET` | Ja | Sensitive Secret fuer Auth.js |
| `DATABASE_URL` | Ja | Runtime/Pooling PostgreSQL URL |
| `DIRECT_URL` | Ja | direkte Prisma CLI/Migration URL |
| `DATABASE_URL_PSQL` | Ja fuer RLS | psql-kompatible DSN fuer `db/rls.sql` |
| `BLOB_READ_WRITE_TOKEN` | Optional | nur wenn Upload/Blob Storage produktiv genutzt wird |
| `CRON_SECRET` | Optional | zusaetzliche Cron-Absicherung, falls noetig |
| `SCIM_BEARER_TOKENS` | Optional | nur wenn SCIM Provisioning aktiv ist |

NormPilot v0.1 setzt keine produktiven LLM-Provider Calls voraus. AI Provider
Keys duerfen fuer NormPilot erst nach separater Governance-Freigabe produktiv
genutzt werden.

## Auth und OAuth Redirects

Kanonische App/Auth-Domain:

```text
https://app.normpilot-industrie.de
```

Google OAuth Redirect, falls Google Login aktiviert wird:

```text
https://app.normpilot-industrie.de/api/auth/callback/google
```

Microsoft Entra Redirect, falls Entra aktiviert wird:

```text
https://app.normpilot-industrie.de/api/auth/callback/microsoft-entra-id
```

Keine neue Auth-Provider-Konfiguration wird in diesem Release-Freeze eingefuehrt.
OAuth wird nur mit bereits freigegebenen Credentials aktiviert.

## Cookie, SameSite und Secure

- Auth laeuft kanonisch ueber `app.normpilot-industrie.de`.
- HTTPS ist Pflicht; Secure Cookies duerfen nicht ueber HTTP getestet werden.
- `www.normpilot-industrie.de` ist nicht als Login-Origin fuer v0.1 geplant.
- Kein Cross-Subdomain-SSO als v0.1-Annahme.
- Login-, Callback- und Logout-Flows muessen auf `app` getestet werden.

## Datenbank und RLS

Deployment-Reihenfolge:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
psql "$DATABASE_URL_PSQL" -f db/rls.sql
```

Hinweise:

- `DATABASE_URL` kann eine Runtime-/Pooling-URL sein.
- `DIRECT_URL` muss fuer Prisma CLI/Migrate geeignet sein.
- `DATABASE_URL_PSQL` muss mit `psql` funktionieren und darf nicht als Browser-
  oder Client-Env geleakt werden.
- RLS muss nach Migration angewendet und gegen NormPilot-Smoke geprueft werden.

## Blob/Storage

Blob Storage ist fuer v0.1 optional:

- Wenn `BLOB_READ_WRITE_TOKEN` gesetzt ist, Upload/Download-Smoke ausfuehren.
- Wenn kein Blob Token gesetzt ist, Demo nur mit synthetischen oder bereits
  vorhandenen Quellen fahren.
- Keine echten Kundendokumente ohne Datenfreigabe.

## Lokale und CI Gates

Pflicht vor Release-Freigabe:

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

Ergaenzende Deployment-Smokes:

- `/api/health` liefert `status: ok`.
- `/login` erreichbar.
- `/dashboard/normpilot` leitet unauthentifiziert auf Login.
- Authenticated Demo-User kann NormPilot-Dashboard oeffnen.
- Evidence Pack Export Preview zeigt KI-Hinweis und Normlizenz-Hinweis.
- `pnpm smoke:normpilot` bleibt gruen.

## Vercel Checks

Vor Production:

- GitHub CI fuer Release-Branch gruen.
- Preview Deployment gruen.
- Environment Variables in Vercel Production gesetzt.
- Build Command nutzt `pnpm install --frozen-lockfile`, `pnpm prisma:generate`
  und `pnpm build` oder den bestehenden Vercel-Standard mit explizitem
  Prisma-Generate-Schritt.

Nach Production:

- Domains verified.
- SSL aktiv.
- Auth Callback auf `app.normpilot-industrie.de` erfolgreich.
- Kein Indexing von optionaler Demo-Subdomain ohne Freigabe.
