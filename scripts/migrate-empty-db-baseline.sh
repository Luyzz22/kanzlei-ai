#!/usr/bin/env bash
set -euo pipefail

# Runs the "empty DB baseline" flow:
# - mark all migrations before *_baseline_schema as applied
# - run prisma migrate deploy (should apply baseline only)
# No destructive operations (no reset / no drops).

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

MIG_DIR="prisma/migrations"
if [ ! -d "$MIG_DIR" ]; then
  echo "ERROR: $MIG_DIR not found"
  exit 1
fi

BASELINE="$(ls "$MIG_DIR" | grep -E '_baseline_schema$' | sort | tail -n 1 || true)"
if [ -z "$BASELINE" ]; then
  echo "ERROR: baseline migration (*_baseline_schema) not found in $MIG_DIR"
  exit 1
fi

echo "baseline=$BASELINE"

# Mark all migrations before baseline as applied.
# Prisma expects folder names like 20260306001427_baseline_schema, etc.
for m in $(ls "$MIG_DIR" | grep -E '^[0-9]{14}_' | sort); do
  if [ "$m" = "$BASELINE" ]; then
    break
  fi
  pnpm prisma migrate resolve --applied "$m"
done

# Apply pending migrations (should be baseline only on empty DB)
pnpm prisma migrate deploy

# Basic verification (non-zero exit on problems)
pnpm prisma migrate status
