# Runbook: DB-Migrationen (Neon/Postgres)

## Ziel
Sicheres, reproduzierbares Produktions-Deployment von Prisma-Migrationen inkl. RLS-Aktivierung.

## Standard Deploy Flow
1. Build-Pipeline erfolgreich (`pnpm lint`, `pnpm typecheck`, `pnpm build`).
2. Migrationen anwenden:
   ```bash
   pnpm prisma migrate deploy
   ```
3. RLS-Policies anwenden/aktualisieren:
   ```bash
   psql "$DATABASE_URL" -f db/rls.sql
   ```
4. Optional Retention-Job:
   ```bash
   psql "$DATABASE_URL" -f db/retention.sql
   ```

## URL-Hinweis (Prisma vs. psql)
- Prisma-Neon-URLs enthalten häufig Query-Parameter wie `schema=public`.
- `psql` versteht diese Form nicht immer zuverlässig bei komplexen URLs.
- Empfehlung: für `psql` eine kompatible URL/DSN nutzen (gleicher DB-Host, DB-Name, User, SSL), ohne Prisma-spezifische Query-Annahmen.

## Troubleshooting

### Fehler: `P3018`
Bedeutung: Migration konnte nicht sauber abgeschlossen werden (z. B. SQL-Fehler in einer Migration).

Vorgehen:
1. Fehlertext in CI/Logs identifizieren.
2. Betroffene Migration im Ordner `prisma/migrations/<timestamp_name>/migration.sql` prüfen.
3. Zustand in DB prüfen (wurde SQL teilweise ausgeführt?).
4. Nach manueller Korrektur Migration-Status markieren:
   ```bash
   pnpm prisma migrate resolve --rolled-back "<migration_name>"
   # oder
   pnpm prisma migrate resolve --applied "<migration_name>"
   ```
5. Anschließend erneut `pnpm prisma migrate deploy` ausführen.

### Fehler: `P1012`
Bedeutung: Prisma-Schema/Umgebung ungültig (z. B. Env fehlt, Schema-Fehler, ungültige URL).

Vorgehen:
1. Env-Keys prüfen (`DATABASE_URL`, ggf. `DIRECT_URL`).
2. `prisma/schema.prisma` validieren:
   ```bash
   pnpm prisma validate
   ```
3. Fehlende/kaputte Variablen korrigieren und Deploy erneut starten.

## Migrate-Resolve Patterns (Production)
- **Nur anwenden, wenn klar ist, in welchem Zustand die DB ist.**
- `--applied`: wenn SQL bereits in DB vorhanden ist und nur Historie synchronisiert werden muss.
- `--rolled-back`: wenn Migration nicht wirksam ist/sauber zurückgebaut wurde und erneut laufen soll.
- Keine destruktiven Ad-hoc-Änderungen ohne Change-Freigabe.
