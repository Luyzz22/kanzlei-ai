# SSO: Microsoft Entra ID (OIDC) – KanzleiAI

## Ziel
Enterprise SSO über Microsoft Entra ID (OIDC) inkl. Tenant-Scoping und JIT-Provisioning:
- 1 Entra Tenant (`tid`) → 1 KanzleiAI Tenant (`slug = entra-<tid>`)
- Membership wird beim Sign-In upserted
- User.role wird aus Entra-Rollen gemappt (optional)

## Env Variablen
- `AUTH_MICROSOFT_ID` / `AUTH_MICROSOFT_SECRET`: Entra App (Client ID/Secret)
- `AUTH_MICROSOFT_ENTRA_ID_ISSUER`: Issuer URL, z.B.  
  `https://login.microsoftonline.com/<TENANT_ID>/v2.0/`
  - Wenn leer: Multi-Tenant Default des Providers (nicht empfohlen für Enterprise).
- `AUTH_MICROSOFT_ALLOWED_TENANT_IDS`: CSV Allowlist, z.B.  
  `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee,ffffffff-....`
  - Wenn gesetzt: Sign-In wird abgelehnt, wenn `profile.tid` nicht enthalten ist.
- `AUTH_MICROSOFT_ADMIN_ROLES`: CSV App Roles, die zu `Role.ADMIN` führen, z.B.  
  `KanzleiAI.Admin,KanzleiAI.SuperAdmin`

## Entra App Registration (Kurz)
1. App Registration anlegen (Entra Admin Center / Azure Portal)
2. Redirect URI (Web) setzen:
   - `https://<YOUR_DOMAIN>/api/auth/callback/microsoft-entra-id`
   - lokal: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
3. Logout URL (optional):
   - `https://<YOUR_DOMAIN>/login`
4. Token Claims:
   - `tid` (Tenant ID) wird benötigt (Standard in ID Token)
   - `roles` nur wenn App Roles definiert sind und dem User zugewiesen wurden

## Provisioning/Mapping
Beim Sign-In (`callbacks.signIn`):
- optionales Tenant-Scoping via `AUTH_MICROSOFT_ALLOWED_TENANT_IDS`
- Tenant Upsert (`slug=entra-<tid>`)
- TenantMember Upsert (Role: ADMIN/MEMBER abhängig von Role Mapping)
- User.role Upsert (ADMIN/ASSISTENT)

## Security Notes
- Für Enterprise Single-Tenant: Issuer und Allowlist setzen.
- Admin-Rollen nur via Entra App Roles, nicht via Email-Domain.
