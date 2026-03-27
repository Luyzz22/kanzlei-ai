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

## Fresh DB / Neon Branch Setup: konsolidierte Baseline (Development)

### Hintergrund
Historische Dev-Migrationen wurden in `prisma/migrations_legacy` archiviert, weil sie auf frischen Datenbanken kollidieren konnten
(mehrfache `CREATE TABLE`/`CREATE INDEX` derselben Objekte).  
Aktive Dev-Historie startet daher mit **einer** konsolidierten Baseline in `prisma/migrations`.

### Vorgehen: neue/leere Dev-DB

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
```

### Vorgehen: bestehende Prod-DB
Bestehende produktive Datenbanken werden **nicht** per `migrate reset` neu aufgebaut.
Stattdessen wie gehabt:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
```

### Hinweise zu Verbindungs-URLs
- `DATABASE_URL`: Runtime/Pooling-Verbindung (App)
- `DIRECT_URL`: direkte Verbindung für Prisma CLI (Migrate/Introspection)
- Optional für isolierte Migration-Tests: `SHADOW_DATABASE_URL` via Umgebungsvariable setzen (ohne feste Pflicht im Schema)
