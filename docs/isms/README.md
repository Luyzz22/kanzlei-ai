# ISMS – KanzleiAI (ISO 27001 Vorbereitung)

## Zweck
Dieses Verzeichnis enthält die minimalen ISMS-Artefakte zur Vorbereitung auf ISO 27001 (und anschlussfähig für ISO/IEC 42001).

## Scope (MVP)
- Produkt: KanzleiAI (Multi-Tenant Legal SaaS, EU)
- Daten: Vertragsdaten, Metadaten, Audit Logs, Nutzer-/Tenant-Daten
- Infrastruktur: EU Hosting (Ziel: DE/EU), DB: PostgreSQL, App: Next.js/Node, Auth: NextAuth (OIDC/SSO), SCIM Provisioning

## Schlüssel-Kontrollen (Tech Controls im Code)
- Tenant Isolation: Postgres RLS (`db/rls.sql`)
- Audit Logging + Retention: `AuditEvent` + `db/retention.sql`
- Tamper-Evidence: Hash Chain (`prevHash`, `eventHash`)
- Zugriff/Identity: Entra OIDC + SCIM (User+Groups) + RBAC (`Role`, `TenantRole`)

## Dokumente
- Risk Register: `risk-register.md`
- Asset Inventory: `asset-inventory.md`
- Access Control Policy: `access-control-policy.md`
- Logging & Monitoring: `logging-monitoring-policy.md`
- Incident Response: `incident-response.md`
- Vendor Management: `vendor-management.md`
- Change Management: `change-management.md`

## Owner & Review
- Owner: Engineering/Compliance Owner (zu benennen)
- Review cadence: monatlich (mindestens), vor Releases: ad-hoc
