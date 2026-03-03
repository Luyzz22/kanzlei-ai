# Incident Response (IR) – Minimal Playbook

## Definition
Security incident = unauthorized access, data leakage, credential compromise, availability incident with material impact.

## Roles
- Incident Commander (IC)
- Engineering Lead
- Security/Compliance Lead
- Communications/Customer Success

## Steps
1. Triage & classify (severity)
2. Containment (disable tokens, rotate SCIM tokens, block IPs, force logout)
3. Eradication (patch, revoke, reconfigure)
4. Recovery (validate RLS, audit integrity, restore)
5. Postmortem (root cause + corrective actions)

## Evidence
- AuditEvent timeline (hash-chained)
- DB logs and deployment logs
