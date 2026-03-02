# Auth-Analyse-Notiz (SBS/Invoice Referenz)

## Externe Repositories
Angefragt:
- https://github.com/SBS-Nexus/sbsnexus-site
- https://github.com/Luyzz22/ki-rechnungsverarbeitung

In dieser Laufumgebung war kein Zugriff auf `github.com`/`raw.githubusercontent.com` möglich (HTTP 403 via CONNECT-Tunnel), daher konnte keine direkte Dateianalyse der beiden externen Repositories durchgeführt werden.

## Lokale Vorlage für `kanzlei-ai` (Auth/Login)
Als kurzfristige Vorlage können im aktuellen Projekt diese Dateien als Startpunkt genutzt werden:

- `src/lib/auth.ts` – zentrale Auth.js/NextAuth-Konfiguration (Provider, Callbacks, Session-Strategie, Credentials-Authorize).
- `src/app/api/auth/[...nextauth]/route.ts` – API-Handler für Auth.js Endpunkte.
- `src/app/login/page.tsx` – Login-UI mit Server Actions für OAuth-SignIn.
- `middleware.ts` – Schutz der Dashboard-Routen über Auth-Middleware.
- `src/types.d.ts` – Typ-Erweiterungen für Session/JWT/User (inkl. Rolle).
- `prisma/schema.prisma` – User/Account/Session/VerificationToken Tabellen für Adapter.

## Nächster Schritt
Sobald externer Zugriff möglich ist, identische Auth-Dateien in beiden Ziel-Repositories erfassen und gegen diese lokale Vorlage mappen.
