-- Audit retention baseline (Enterprise)
-- Default retention: 365 days
-- Execute with: psql "$DATABASE_URL" -v retention_days=365 -f db/retention.sql

\set retention_days 365

-- Dry-run: how many rows would be deleted?
SELECT count(*) AS auditevent_would_delete
FROM "AuditEvent"
WHERE "createdAt" < now() - (:'retention_days' || ' days')::interval;

-- Delete in batches (repeat as needed in ops automation)
-- NOTE: For very large tables, consider partitioning by month.
WITH to_delete AS (
  SELECT id
  FROM "AuditEvent"
  WHERE "createdAt" < now() - (:'retention_days' || ' days')::interval
  ORDER BY "createdAt" ASC
  LIMIT 5000
)
DELETE FROM "AuditEvent"
WHERE id IN (SELECT id FROM to_delete);

