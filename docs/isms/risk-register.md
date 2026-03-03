# Risk Register (ISO 27001 Vorbereitung)

## Skala
- Impact: Low / Medium / High
- Likelihood: Low / Medium / High
- Risk Level: qualitativ (L/M/H)

## Risiken (Initial)
| ID | Risiko | Impact | Likelihood | Level | Controls (Ist) | Treatment (Next) | Owner | Status |
|---:|--------|:------:|:----------:|:-----:|----------------|------------------|-------|--------|
| R-001 | Cross-Tenant Data Leakage | High | Medium | High | Postgres RLS (`db/rls.sql`), App `withTenant()` | FORCE RLS in prod roles, least-privileged DB users | Eng | Open |
| R-002 | Unauthorized Access (SSO misconfig) | High | Medium | High | Entra OIDC allowlist (env), NextAuth DB sessions | Tenant allowlist mandatory in prod, admin roles via Entra App Roles | Eng/Sec | Open |
| R-003 | SCIM Token Leakage | High | Medium | High | Bearer token auth, token rotation support, IP allowlist | Secret rotation process + vault, Entra IP ranges, alerts | SecOps | Open |
| R-004 | Audit Log Tampering | High | Low | Medium | Hash-chain (`eventHash`, `prevHash`) | Add verify job + alerting, immutable storage option | Eng | Open |
| R-005 | Excessive Data Retention | Medium | Medium | Medium | `db/retention.sql` baseline | Automate retention job, legal review periods | Compliance | Open |
| R-006 | PII in Logs/Prompts | High | Medium | High | Audit metadata limited (guidance) | DLP checks, redaction pipeline, prompt filtering | Eng/Compliance | Open |
| R-007 | Supply-chain dependency risk | Medium | Medium | Medium | pnpm lockfile | SBOM, dependency scanning, patch cadence | Eng | Open |
