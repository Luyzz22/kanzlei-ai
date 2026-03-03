# SCIM v2 Provisioning (Microsoft Entra)

## Ziel
User Lifecycle Provisioning via SCIM v2 (Create/Update/Disable) über Microsoft Entra Provisioning.

## Auth
- Bearer Token: `Authorization: Bearer <token>`
- Token wird serverseitig aus `SCIM_BEARER_TOKEN` gelesen.

## Endpoints (v2)
- `GET /api/scim/v2/ServiceProviderConfig`
- `GET /api/scim/v2/Schemas`
- `GET /api/scim/v2/Users?startIndex=1&count=50`
- `POST /api/scim/v2/Users`
- `GET /api/scim/v2/Users/{id}`
- `PATCH /api/scim/v2/Users/{id}` (supports Replace active/externalId)
- `DELETE /api/scim/v2/Users/{id}` (sets `isActive=false`)

## Mapping (Phase 1)
- `userName` / `emails[0].value` → `User.email`
- `externalId` → `User.externalId` (unique)
- `active` → `User.isActive`

## Microsoft Entra Setup (Kurz)
1. Enterprise App / Provisioning konfigurieren
2. Tenant URL: `https://<domain>/api/scim/v2`
3. Secret Token: `SCIM_BEARER_TOKEN`
4. Attribute mappings:
   - userPrincipalName → userName
   - objectId → externalId
   - accountEnabled → active

## Security Notes
- `SCIM_BEARER_TOKEN` als Secret behandeln (Rotation vorgesehen).
- Middleware lässt `/api/scim` explizit durch (kein Login-Redirect).
