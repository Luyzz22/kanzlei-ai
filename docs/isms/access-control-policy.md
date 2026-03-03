# Access Control Policy (ISO 27001)

## Prinzipien
- Least Privilege
- Separation of Duties
- Tenant Isolation (RLS enforced)
- Strong Authentication for Admins (SSO + MFA)

## Rollenmodell (App)
- `Role`: ADMIN / ANWALT / ASSISTENT
- `TenantRole`: OWNER / ADMIN / MEMBER

## Identity & Provisioning
- SSO: Microsoft Entra OIDC (preferred for Enterprise)
- Provisioning: SCIM v2 (Users + Groups)
- Admin authorization: via Entra App Roles or SCIM Group `admin`

## DB Access
- Production: No SUPERUSER/BYPASSRLS for app runtime users
- Migrations: dedicated migration user
- RLS baseline: `db/rls.sql`

## Reviews
- Quarterly access review (admins, tenant admins)
- Immediate revocation on offboarding (SCIM disable / role removal)
