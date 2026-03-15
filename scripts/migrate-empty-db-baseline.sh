#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="prisma/migrations"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Fehler: Migrations-Verzeichnis '$MIGRATIONS_DIR' nicht gefunden." >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Fehler: DATABASE_URL ist nicht gesetzt." >&2
  exit 1
fi

mapfile -t migrations < <(find "$MIGRATIONS_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)

if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "Fehler: Keine Migrationen in $MIGRATIONS_DIR gefunden." >&2
  exit 1
fi

baseline=""
for migration in "${migrations[@]}"; do
  if [[ "$migration" == *_baseline_schema ]]; then
    baseline="$migration"
  fi
done

if [[ -z "$baseline" ]]; then
  echo "Fehler: Keine *_baseline_schema Migration gefunden." >&2
  exit 1
fi

echo "Baseline-Migration erkannt: $baseline"

echo "Markiere Migrationen vor Baseline als applied ..."
for migration in "${migrations[@]}"; do
  if [[ "$migration" == "$baseline" ]]; then
    break
  fi

  if [[ "$migration" =~ ^[0-9]{14}_.+ ]]; then
    echo "  -> resolve --applied $migration"
    pnpm prisma migrate resolve --applied "$migration"
  fi
done

echo "Fuehre prisma migrate deploy aus ..."
pnpm prisma migrate deploy

echo "Pruefe Migrationsstatus ..."
pnpm prisma migrate status

echo "Baseline-Smoke-Test fuer leere DB erfolgreich abgeschlossen."
