# Asset Inventory (Initial)

## Software Assets
- Web App: Next.js 14 (App Router)
- Auth: NextAuth v5 beta + Prisma Adapter
- DB: PostgreSQL (RLS, migrations via Prisma)
- Cache/Queue (planned): Redis
- AI Layer: Provider Router (OpenAI/Azure/Claude/Gemini) – see `docs/AI_ARCHITECTURE.md`

## Data Assets
- Vertrags-/Dokumentdaten: `Document` (tenant-bound)
- Analyse/Metadaten: `AnalysisLog` (tenant-bound)
- Audit Logs: `AuditEvent` (tenant-bound, hash-chained)
- Identity: `User`, `Tenant`, `TenantMember`, NextAuth tables

## Infrastructure (Target)
- EU/DE hosting (Hetzner / EU region)
- Observability: (planned) Sentry EU, metrics (Plausible)

## Owners (TBD)
- Engineering Owner
- Security/Compliance Owner
