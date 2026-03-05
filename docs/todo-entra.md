# Entra TODO (SSO) – Setup Checklist (ohne Secrets)

Status: **geparkt** (SSO/Entra aktuell nicht vollständig konfiguriert).

## 1) Fehlende/benötigte ENV Keys

Diese Keys müssen in Vercel **Production** gesetzt sein (Secrets niemals committen):

- `AUTH_MICROSOFT_ENTRA_ID_ID`  
  → Entra App Registration → **Application (client) ID**
- `AUTH_MICROSOFT_ENTRA_ID_SECRET` (**Sensitive**)  
  → Entra App Registration → **Certificates & secrets** → Client secret **Value**
- `AUTH_MICROSOFT_ENTRA_ID_ISSUER`  
  → Format: `https://login.microsoftonline.com/<TENANT_ID>/v2.0/`

Zusätzlich (NextAuth):
- `NEXTAUTH_URL` (Prod Domain, z. B. `https://www.kanzlei-ai.com`)
- `NEXTAUTH_SECRET` (**Sensitive**)

Optional (Security/Control):
- Tenant-Allowlist (falls im Code vorgesehen; z. B. `AUTH_MICROSOFT_ENTRA_ALLOWED_TENANTS`)
  → nur bekannte Tenant IDs zulassen

## 2) Azure Portal: Woher kommen die Werte?

### Client ID
Entra Admin Center / Azure Portal:
- App registrations → **(deine App)** → Overview → *Application (client) ID*

### Client Secret (Value!)
- App registrations → **(deine App)** → Certificates & secrets → Client secrets → **New client secret**
- Danach **Value** kopieren (wird nur einmal angezeigt) → nach Vercel als `AUTH_MICROSOFT_ENTRA_ID_SECRET`

### Issuer (Tenant-spezifisch)
- Tenant ID findest du unter: Entra → Overview → *Tenant ID*
- Issuer: `https://login.microsoftonline.com/<TENANT_ID>/v2.0/`

## 3) Redirect / Callback URL

In Entra App Registration → Authentication → **Web** → Redirect URIs:

- Local dev:
  - `http://localhost:3000/api/auth/callback/microsoft-entra-id`
- Production:
  - `https://www.kanzlei-ai.com/api/auth/callback/microsoft-entra-id`
- (Optional) Vercel Preview Domains:
  - `https://<preview-domain>/api/auth/callback/microsoft-entra-id`

Hinweis: Provider-ID ist i. d. R. `microsoft-entra-id` (NextAuth Provider).

## 4) Vercel: Was als “Sensitive” markieren?

**Sensitive = YES**
- `AUTH_MICROSOFT_ENTRA_ID_SECRET`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `SCIM_BEARER_TOKENS`

**Sensitive = NO** (typischerweise ok)
- `NEXTAUTH_URL`
- `AUTH_MICROSOFT_ENTRA_ID_ISSUER`
- `AUTH_MICROSOFT_ENTRA_ID_ID`

## 5) Smoke-Test (nach Setup)

1) `pnpm dev` lokal (oder Prod Deploy)
2) Login-Flow über Entra starten
3) Erwartung:
   - User wird angelegt/aktualisiert (JIT provisioning)
   - Tenant/Membership wird gesetzt (wenn im Code aktiv)
   - Session enthält `user.id` + `user.role`

---
(Kein Secret gehört in dieses Repo.)
