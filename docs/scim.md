# SCIM v2 Provisioning (Microsoft Entra)

## Ziel
User Lifecycle Provisioning via SCIM v2 (Create/Update/Disable) über Microsoft Entra Provisioning.

## Auth
- Bearer Token: `Authorization: Bearer <token>`
- Tokens werden serverseitig aus `SCIM_BEARER_TOKENS` (CSV) oder `SCIM_BEARER_TOKEN` gelesen.
- Optional IP-Allowlist via `SCIM_ALLOWED_IPS` (IPv4/CIDR).

## Auth-/Fehlerverhalten
- Fehlender/ungültiger Token **oder fehlende Token-Konfiguration** ⇒ `401 Unauthorized`.
- Nicht erlaubte IP ⇒ `403 Forbidden`.
- Rate-Limit überschritten ⇒ `429 Too Many Requests`.
- Fehlerformat (RFC7644-orientiert):
  ```json
  {
    "schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
    "detail": "Unauthorized",
    "status": "401"
  }
  ```

## Endpoints (v2)
- `GET /api/scim/v2/ServiceProviderConfig`
- `GET /api/scim/v2/Schemas`
- `GET /api/scim/v2/Users?startIndex=1&count=50`
- `POST /api/scim/v2/Users`
- `GET /api/scim/v2/Users/{id}`
- `PATCH /api/scim/v2/Users/{id}` (supports Replace active/externalId)
- `DELETE /api/scim/v2/Users/{id}` (sets `isActive=false`)
- `GET /api/scim/v2/Groups`
- `GET /api/scim/v2/Groups/{id}`
- `PATCH /api/scim/v2/Groups/{id}`

## Mapping (Phase 1)
- `userName` / `emails[0].value` → `User.email`
- `externalId` → `User.externalId` (unique)
- `active` → `User.isActive`

## Microsoft Entra Setup (Kurz)
1. Enterprise App / Provisioning konfigurieren
2. Tenant URL: `https://<domain>/api/scim/v2`
3. Secret Token: einer aus `SCIM_BEARER_TOKENS` oder `SCIM_BEARER_TOKEN`
4. Attribute mappings:
   - userPrincipalName → userName
   - objectId → externalId
   - accountEnabled → active

## Security Notes
- SCIM-Tokens als Secret behandeln (Rotation vorgesehen).
- Middleware lässt `/api/scim` explizit durch (kein Login-Redirect).
- Multi-Tenant-relevante Gruppenoperationen laufen tenant-gebunden via `withTenant(...)` unter RLS-Kontext.
