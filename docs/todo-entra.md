# Entra SSO / SCIM – TODO (später aktivieren)

Status: **geparkt** (Entra funktioniert aktuell nicht).  
Ziel: Microsoft Entra ID Login + optional SCIM-Provisioning sauber in PROD aktivieren, ohne Secrets im Repo.

---

## A) Fehlende / relevante ENV-Keys

### NextAuth Basis
- `NEXTAUTH_URL` (**nicht sensibel**)  
  - PROD: `https://www.kanzlei-ai.com` (oder deine Domain)
  - DEV: `http://localhost:3000`
- `NEXTAUTH_SECRET` (**sensibel**, mind. 32 chars)

### Entra OIDC Provider (SSO)
- `AUTH_MICROSOFT_ENTRA_ID_ID` (**sensibel**)  
  → *Azure Portal → App registrations → (App) → Overview → “Application (client) ID”*
- `AUTH_MICROSOFT_ENTRA_ID_SECRET` (**sensibel**)  
  → *Azure Portal → App registrations → (App) → Certificates & secrets → Client secrets → “Value”*
  - Wichtig: **nur “Value”** (wird nur einmal angezeigt)
- `AUTH_MICROSOFT_ENTRA_ID_ISSUER` (**nicht sensibel**)  
  Format: `https://login.microsoftonline.com/<TENANT_ID>/v2.0/`  
  → `<TENANT_ID>` findest du im Azure Portal:  
  *App registrations → (App) → Overview → “Directory (tenant) ID”*

### Optional (je nach Implementierung im Code)
- `AUTH_MICROSOFT_ENTRA_ALLOWED_TENANTS` (**nicht sensibel**)  
  CSV/Gelistet, z.B. `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee,ffffffff-...`  
  Zweck: Tenant-Allowlist (DACH Enterprise üblich).

---

## B) Azure Portal Schritte (SSO)

1) **App Registration prüfen**
- Azure Portal → *Microsoft Entra ID* → *App registrations* → deine App

2) **Redirect URIs setzen**
- *Authentication* → *Add a platform* → **Web**
- Redirect URI (DEV):
  - `http://localhost:3000/api/auth/callback/microsoft-entra-id`
- Redirect URI (PROD):
  - `https://www.kanzlei-ai.com/api/auth/callback/microsoft-entra-id`
  - (ggf. zusätzlich Root-Domain ohne www, falls genutzt)

Hinweis:
- Der Provider-Callback-Pfad entspricht in NextAuth dem Provider-ID-Slug:
  - **`microsoft-entra-id`**

3) **Client Secret erzeugen**
- *Certificates & secrets* → *New client secret*
- Danach **“Value”** kopieren → in Vercel als `AUTH_MICROSOFT_ENTRA_ID_SECRET` speichern  
  (nicht “Secret ID”).

4) **Issuer setzen**
- `AUTH_MICROSOFT_ENTRA_ID_ISSUER="https://login.microsoftonline.com/<TENANT_ID>/v2.0/"`

---

## C) Vercel Settings (PROD)

### Welche Werte als “Sensitive” markieren?
- ✅ Sensitive:
  - `NEXTAUTH_SECRET`
  - `DATABASE_URL`
  - `AUTH_MICROSOFT_ENTRA_ID_ID` (Client ID – in vielen Teams ebenfalls als sensitive behandelt)
  - `AUTH_MICROSOFT_ENTRA_ID_SECRET`
  - (falls genutzt) `SCIM_BEARER_TOKENS`
- ❌ Nicht sensibel:
  - `NEXTAUTH_URL`
  - `AUTH_MICROSOFT_ENTRA_ID_ISSUER`
  - `AUTH_MICROSOFT_ENTRA_ALLOWED_TENANTS` (trotzdem ggf. intern behandeln)

---

## D) Optional: Entra SCIM Provisioning (User/Groups)

> SCIM Endpoints sind implementiert:
- Base URL: `https://www.kanzlei-ai.com/api/scim/v2`
- ServiceProviderConfig: `/ServiceProviderConfig`
- Users: `/Users`
- Groups: `/Groups`

### Token
- Vercel ENV: `SCIM_BEARER_TOKENS`  
  - Format: mehrere Tokens durch Komma trennen
  - Beispiel: `token1,token2`
- In Entra Enterprise App → *Provisioning* → *Secret Token*:
  - **ein** Token aus `SCIM_BEARER_TOKENS` eintragen (genau 1)

### IP-Allowlist (optional, empfohlen)
- Vercel ENV: `SCIM_ALLOWED_IPS`
  - Komma-separiert: z.B. `1.2.3.4,5.6.7.8`
  - Achtung: Bei Vercel/Proxy muss die echte Client-IP korrekt ankommen (X-Forwarded-For).

---

## E) Go/No-Go Checklist (SSO Aktivierung)

- [ ] ENV-Keys in Vercel PRODUCTION gesetzt
- [ ] Redirect URIs in Entra passen zu PROD Domain
- [ ] `NEXTAUTH_URL` stimmt exakt
- [ ] Login-Test: Entra Sign-In → Session in DB → Redirect /dashboard
- [ ] Tenant/Provisioning Logik: tenant + membership werden korrekt erstellt
- [ ] Audit Events (login / provisioning) werden geschrieben
