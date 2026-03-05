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

---

## Recovery: P3018 (Migration failed to apply) – Neon/Prod

### Was P3018 bedeutet
Prisma stoppt `migrate deploy`, wenn eine Migration in der Ziel-DB fehlgeschlagen ist. Weitere Migrationen werden blockiert, bis die fehlgeschlagene Migration sauber „recovered“ ist.

### Grundregeln (Prod-sicher)
- **Kein `prisma migrate reset` in Prod.**
- **Applied Migrationen nicht nachträglich editieren.** Prisma vergleicht Migration-Historie und Checksums.
- **`prisma migrate resolve` nur benutzen, wenn du den DB-Zustand verifiziert hast.** Sonst markierst du Probleme „weg“.

### Schritt-für-Schritt Recovery (ohne destruktive Aktionen)
1) **Fehlgeschlagene Migration identifizieren**
   - CI/Deploy-Logs lesen: dort steht i. d. R. der Migration-Name (`YYYYMMDDHHMMSS_name`) und der konkrete Postgres-Fehler.
   - Lokal/Runner: `pnpm prisma migrate status`

2) **DB-Zustand verifizieren (read-only)**
   - Prüfe in `_prisma_migrations`, welche Migrationen `finished_at` gesetzt haben und ob `rolled_back_at` gesetzt ist.
   - Optional: `prisma migrate diff` nutzen, wenn manuelle Hotfixes/Drift möglich sind.

3) **Typische Ursachen & sichere Fixes**
   - **`already exists` bei Indexen:** In der betroffenen (fehlgeschlagenen) Migration `CREATE INDEX` → `CREATE INDEX IF NOT EXISTS` (analog für UNIQUE).
   - **Enums (Postgres):** `ALTER TYPE ... ADD VALUE IF NOT EXISTS ...`
     - Achtung: neue Enum-Values dürfen ggf. erst nach COMMIT verwendet werden; im Zweifel Enum-Add in separate Migration splitten.

4) **Recovery-Pfad wählen**
   - **Pfad A – DB ist korrekt (Migration faktisch angewendet), Prisma hat nur abgebrochen:**
     - `pnpm prisma migrate resolve --applied "<migration_name>"`
     - danach `pnpm prisma migrate deploy`
   - **Pfad B – Migration soll als nicht angewendet gelten (History zurücksetzen, ohne DB-Drops):**
     - `pnpm prisma migrate resolve --rolled-back "<migration_name>"`
     - Migration/Schema korrigieren
     - danach `pnpm prisma migrate deploy`

### Neon-spezifischer Ablauf (empfohlen)
- Recovery zuerst auf einer **Neon Branch** reproduzieren (Staging/Branch), dann erst in Prod anwenden.
- So vermeidest du Trial-and-Error direkt auf der Prod-Branch.

### Verifikation nach Recovery
- `pnpm prisma migrate status` zeigt **keine** fehlgeschlagene Migration mehr.
- App Smoke-Checks (Health, Auth, SCIM, Audit Verify).

---

## Fresh DB / Neon Branch Setup: Baseline-Migration verwenden

### Problem
Unsere historische Migration-Historie enthält DDL, das bei **frischen Datenbanken** kollidieren kann (z. B. doppelte Enum-Erstellung in alten Pfaden). Für neue Neon-Branches oder neue Installationen verwenden wir daher eine **Baseline-Migration**, die den aktuellen Schema-Stand in einem konsistenten Schritt aufsetzt.

### Vorgehen: neue DB (leer)
1) Neue Neon-Branch / leere DB erstellen.
2) `pnpm prisma migrate deploy`
   - Erwartung: Baseline-Migration läuft als erste „vollständige“ Schema-Definition durch.
3) Danach: App Smoke-Checks (Health, Auth, SCIM, Audit Verify).

### Vorgehen: bestehende DB (bereits produktiv)
**Wichtig:** Auf bestehenden DBs dürfen wir die Baseline nicht „nochmal anwenden“.
Stattdessen wird die Baseline in der Migrations-Historie als bereits angewendet markiert:

1) Baseline-Migrationsnamen bestimmen (Ordnername unter `prisma/migrations/*_baseline_schema`).
2) `pnpm prisma migrate resolve --applied "<baseline_migration_name>"`
3) Danach wie gewohnt: `pnpm prisma migrate deploy`

### Verifikation
- `pnpm prisma migrate status` zeigt keine failed Migrationen.
- `_prisma_migrations` enthält einen Eintrag für die Baseline mit `finished_at` gesetzt.
