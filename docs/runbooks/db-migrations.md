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
Unsere historische Migration-Historie kann bei frischen/leeren Datenbanken kollidieren (z.B. doppelte Enum-Erstellung oder unguarded DDL in alten Pfaden).
Daher existiert eine Baseline-Migration (*_baseline_schema), die den aktuellen Schema-Stand in einem konsistenten Schritt aufsetzt.

Wichtig: Prisma fuehrt Migrationen immer in chronologischer Reihenfolge aus. Eine Baseline am Ende ersetzt die Historie nicht automatisch.
Fuer eine leere DB muessen Migrationen vor der Baseline als applied markiert werden, damit Prisma anschliessend nur die Baseline ausfuehrt.

### Vorgehen: neue DB (leer) - Baseline ausfuehren, Historie ueberspringen
ACHTUNG: Nur fuer leere DBs / neue Neon-Branches, niemals auf Prod.

1) Baseline-Migrationsnamen ermitteln (Ordnername unter prisma/migrations/*_baseline_schema).
2) Alle Migrationen vor der Baseline als applied markieren und danach deploy ausfuehren:

```bash
BASELINE="$(ls prisma/migrations | grep _baseline_schema | sort | tail -n 1)"
echo "baseline=$BASELINE"

for m in $(ls prisma/migrations | grep -E "^[0-9]{14}_" | sort); do
  [ "$m" = "$BASELINE" ] && break
  pnpm prisma migrate resolve --applied "$m"
done

pnpm prisma migrate deploy
```

3) Danach: App Smoke-Checks (Health, Auth, SCIM, Audit Verify).

### Vorgehen: bestehende DB (bereits produktiv) - Baseline NICHT ausfuehren
Auf bestehenden DBs darf die Baseline nicht laufen (sie enthaelt CREATEs des gesamten Schemas).
Stattdessen wird sie in der History als bereits applied markiert:

```bash
BASELINE="$(ls prisma/migrations | grep _baseline_schema | sort | tail -n 1)"
pnpm prisma migrate resolve --applied "$BASELINE"
pnpm prisma migrate deploy
```

### Verifikation
- pnpm prisma migrate status zeigt keine failed Migrationen.
- _prisma_migrations enthaelt einen Eintrag fuer die Baseline mit finished_at gesetzt.

### Automatisierter Fresh-DB-Flow (lokal/CI)

Fuer den Baseline-Flow auf einer leeren DB gibt es ein Script:

```bash
./scripts/migrate-empty-db-baseline.sh
```

Das Script erkennt `*_baseline_schema` dynamisch, markiert alle vorherigen Migrationen als `applied`, fuehrt danach `prisma migrate deploy` aus und validiert mit `prisma migrate status`.
