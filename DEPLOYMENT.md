# Deployment auf Vercel (Produktion)

Diese Anleitung bereitet KanzleiAI für ein produktives Deployment auf Vercel mit der Domain **kanzlei-ai.de** vor.

## Runtime & Build

- **Runtime:** Next.js 14 App Router
- **Node-Version:** 20
- **Build Command:** `pnpm install && pnpm prisma generate && pnpm build`
- **Start Command:** `pnpm start`

## Vercel-Projektkonfiguration

1. Projekt in Vercel importieren.
2. Build- und Start-Command wie oben setzen.
3. Node-Version auf 20 setzen.
4. Domain **kanzlei-ai.de** verbinden.
5. **Empfehlung:** Vercel-Region auf **Europa (Frankfurt)** setzen, um Latenz und DSGVO-Anforderungen im EU-Kontext zu unterstützen.

## Environment-Variablen (Production)

Die konkreten Werte werden im Vercel-Dashboard gesetzt. Folgende Variablen müssen gepflegt werden:

- `DATABASE_URL` – Verbindungszeichenfolge zur PostgreSQL-Produktionsdatenbank (Hetzner).
- `NEXTAUTH_URL` – Öffentliche Basis-URL der Anwendung (z. B. `https://kanzlei-ai.de`).
- `NEXTAUTH_SECRET` – Starkes Secret für Signatur/Verschlüsselung von NextAuth-Tokens.
- `AUTH_GOOGLE_ID` – OAuth Client-ID für Google Login.
- `AUTH_GOOGLE_SECRET` – OAuth Client-Secret für Google Login.
- `AUTH_MICROSOFT_ID` – OAuth Client-ID für Microsoft Login.
- `AUTH_MICROSOFT_SECRET` – OAuth Client-Secret für Microsoft Login.
- `OPENAI_API_KEY` (optional) – API-Schlüssel für OpenAI, falls genutzt.
- `AZURE_OPENAI_API_KEY` (optional) – API-Schlüssel für Azure OpenAI.
- `AZURE_OPENAI_ENDPOINT` (optional) – Endpoint der Azure OpenAI Ressource.
- `AZURE_OPENAI_DEPLOYMENT` (optional) – Name des Azure OpenAI Deployments.

## Prisma Migrations

Für Produktion **nicht** `prisma migrate dev` verwenden.

Verwende stattdessen:

```bash
pnpm prisma migrate deploy
```

Empfohlene Schrittfolge:

1. PostgreSQL-Datenbank bei Hetzner anlegen.
2. `DATABASE_URL` im Vercel-Dashboard setzen.
3. Deployment starten und anschließend `pnpm prisma migrate deploy` gegen die Produktionsdatenbank ausführen.

## Health-Check

Für Uptime-/Monitoring-Zwecke ist eine Health-Route verfügbar:

- `GET /api/health` → `{ "status": "ok" }`
