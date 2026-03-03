# Logging & Monitoring Policy

## Logging
- Audit Events: mandatory for security-relevant actions (SSO/SCIM/admin changes, document processing)
- Tamper-evidence: Audit hash-chain enabled (`eventHash`, `prevHash`)
- No secrets in logs (tokens, passwords, API keys)

## Retention
- Baseline: 365 days (`db/retention.sql`) – subject to legal review
- Ops: retention job must be automated (scheduled)

## Monitoring
- Alerts: auth failures (SCIM/SSO), RLS violations (if any), abnormal audit volume
- Security events recorded as `AuditEvent` where applicable
