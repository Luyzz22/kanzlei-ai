# KanzleiAI — Endpoint Security Hardening

**Stand:** 25.05.2026  
**Autor:** AppSec Audit  
**Status:** Implementiert — bereit für Review

---

## 1. Sensible Routen — Übersicht

| Route | Methode | Funktion | Production | Non-Production |
|---|---|---|---|---|
| `/api/auth/debug` | GET | Auth-Konfigurationsdiagnose | 404 | Admin-Auth erforderlich |
| `/api/admin/status` | GET | System-Status | 404 | Admin-Auth erforderlich |
| `/api/admin/seed` | POST | Admin-User Seeding | 404 | SEED_SECRET Header |
| `/api/admin/test-anthropic` | GET | Anthropic API Test | 404 | Admin-Auth erforderlich |
| `/api/admin/diagnose-risk` | GET | Risk-Engine Diagnose | 404 | Admin-Auth erforderlich |
| `/api/admin/eval-dashboard` | GET | Eval Analytics | Admin-Auth (ADMIN/OWNER) | Admin-Auth erforderlich |
| `/api/admin/eval-golden` | GET | Golden Set Evaluation | Admin-Auth (ADMIN/OWNER) | Admin-Auth erforderlich |
| `/api/admin/provision-demo` | POST | Demo-User Provisioning | 404 | SEED_SECRET Header |

---

## 2. Erwartetes Production-Verhalten

### Nicht authentifiziert (anonym)

- Middleware gibt `401 JSON` zurück für alle `/api/admin/*`-Routen (kein HTML-Redirect).
- Debug-/Diagnose-Routen geben zusätzlich `404` zurück (Defense-in-Depth: existieren nicht in Production).

### Authentifiziert, kein Admin

- Middleware gibt `403 JSON` zurück für alle `/api/admin/*`-Routen.
- Route-Handler geben ebenfalls `403` zurück (doppelte Durchsetzung).

### Admin (ADMIN / OWNER)

- Nur `eval-dashboard` und `eval-golden` sind in Production zugänglich.
- Alle anderen Admin-Routen geben `404` zurück — sie existieren in Production nicht.
- Ausgabe: minimale, aggregierte Daten — keine Secrets, keine ENV-Werte, keine Provider-Keys.

### Was niemals in Responses erscheint

Weder für Admins noch für andere Nutzer:

- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `DATABASE_URL`, `DIRECT_URL`
- `ANTHROPIC_API_KEY` (auch keine Teilstrings, Fingerprints oder Präfixe)
- `OPENAI_API_KEY`, `GEMINI_API_KEY`
- `STRIPE_SECRET`, `WEBHOOK_SECRET`
- Vollständige ENV-Variablenwerte
- Interne Stack Traces an anonyme Nutzer

---

## 3. Erwartetes Non-Production-Verhalten

- Diagnose-Endpunkte (debug, status, test-anthropic, diagnose-risk, seed, provision-demo) sind zugänglich — **ausschließlich für Admins**.
- Secrets werden nie im Klartext ausgegeben. Stattdessen: `configured: true` (boolean).
- `test-anthropic` gibt `apiKeyConfigured: true` zurück — kein Key-Fingerprint.

---

## 4. Zentrale Guard-Funktion

**Datei:** `src/lib/security/admin-route-guard.ts`  
**Utilities:** `src/lib/security/diagnostic-utils.ts`

### API

```typescript
// Production → 404, Non-Production → null (proceed)
notFoundInProduction(): NextResponse | null

// 401 if not authenticated, 403 if not ADMIN/OWNER, ok:true otherwise
requireAdminApiAccess(): Promise<AdminGuardApiResult>

// Production → 404, Non-Production → admin check
requireNonProductionOrAdmin(): Promise<NextResponse | null>

// Strips secrets from diagnostic objects (key + value patterns)
sanitizeDiagnosticOutput<T>(obj: T): T

// Pure utility: true in production/Vercel production environments
isProduction(): boolean
```

### Verwendung in Route Handlers

```typescript
export async function GET() {
  const denied = await requireNonProductionOrAdmin()
  if (denied) return denied
  // ... handler logic
}
```

---

## 5. Middleware — Defense-in-Depth

**Datei:** `middleware.ts`

- Alle `/api/admin/*`-Routen sind in `adminOnlyPrefixes` aufgeführt.
- Nicht authentifiziert → `401 JSON` (kein HTML-Redirect für API-Routen).
- Authentifiziert, kein Admin → `403 JSON` (kein Redirect zur UI).
- Dies ist die erste Verteidigungslinie — Route-Handler erzwingen dieselbe Logik zusätzlich.

---

## 6. Smoke-Test-Anleitung

```bash
# Gegen Production
node scripts/security-smoke-test.mjs

# Gegen andere Umgebung
BASE_URL=https://staging.kanzlei-ai.com node scripts/security-smoke-test.mjs
```

Das Skript testet alle Admin-/Debug-Routen anonym (kein Auth-Token).

**Erlaubte Statuscodes:** `404`, `401`, `403`, `405`  
**Nicht erlaubt:** `200`, `201`, `204`, `3xx` (außer Redirect zu `/login`)

**Geprüfte Forbidden-Patterns in Response Bodies:**
- `NEXTAUTH`, `DATABASE_URL`, `DIRECT_URL`
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- `STRIPE_SECRET`, `WEBHOOK_SECRET`
- Anthropic Key-Patterns (`sk-ant-*`, `sk-*{20+}`)

**POST-Routen:** Das Skript testet mit `HEAD`-Requests. Wenn `HEAD` → `405`, wird die Route als "manual review required" markiert und kein `POST` ausgeführt.

---

## 7. Behobene Befunde (dieser Audit)

### KRITISCH

| Befund | Datei | Fix |
|---|---|---|
| `eval-dashboard`: Kein Admin-Check — jeder Tenant-Member konnte auf aggregierte Analytics zugreifen | `eval-dashboard/route.ts` | ADMIN/OWNER-Check vor `resolveTenantContextForUser` |
| `eval-golden`: Kein Admin-Check — jeder authentifizierte Nutzer konnte Golden-Set-Daten lesen | `eval-golden/route.ts` | ADMIN/OWNER-Check hinzugefügt |

### HOCH

| Befund | Datei | Fix |
|---|---|---|
| `test-anthropic`: Gibt `apiKeyFingerprint` zurück (`key.slice(0,7) + "..." + key.slice(-4)`) | `test-anthropic/route.ts` | Entfernt — ersetzt durch `apiKeyConfigured: true` |
| `test-anthropic`: Kein Production-Guard | `test-anthropic/route.ts` | `requireNonProductionOrAdmin()` hinzugefügt |
| `classification-db-fields.ts`: `.slice()` auf potenziell null/undefined `contractClassification` | `classification-db-fields.ts` | Null-Guard vor `.slice()` |

### MITTEL

| Befund | Datei | Fix |
|---|---|---|
| `seed`: Kein Production-Guard | `seed/route.ts` | `notFoundInProduction()` hinzugefügt |
| `provision-demo`: Kein Production-Guard | `provision-demo/route.ts` | `notFoundInProduction()` hinzugefügt |
| `diagnose-risk`: Kein Production-Guard | `diagnose-risk/route.ts` | `requireNonProductionOrAdmin()` hinzugefügt |
| Middleware: API-Routen erhielten HTML-Redirect statt `401 JSON` | `middleware.ts` | `401 JSON` für `/api/*`-Routen |
| Middleware: Nur `/api/admin/provision-demo` war admin-only | `middleware.ts` | Alle `/api/admin/*` als adminOnly |

---

## 8. Restrisiken

| Risiko | Schweregrad | Mitigierung |
|---|---|---|
| `seed` und `provision-demo` in Staging-Umgebung mit bekanntem `SEED_SECRET` | MITTEL | Regelmäßige Rotation des `SEED_SECRET`. Staging-Zugang einschränken. |
| Admin-Session-Hijacking — wenn Admin-Cookie gestohlen, sind Diagnose-Routen zugänglich | MITTEL | Session-Lifetime auf 24h begrenzt (bereits konfiguriert). MFA für Admin-Accounts empfohlen. |
| `eval-dashboard` / `eval-golden` geben aggregierte Analytics zurück — kein Tenant-Cross-Access möglich, aber Analytics könnten sensible Muster zeigen | NIEDRIG | Daten sind bereits durch `tenantId`-Scope isoliert. Kein weiteres Risiko. |
| Anthropic-Antwortfragmente in `diagnose-risk` (`rawHead`, `rawTail`) sichtbar für Admin | NIEDRIG | Akzeptabel — nur in Non-Production, nur für Admins. |

---

## 9. Regulatorische Zuordnung

| Regulierung | Artikel | Anforderung | Umsetzung |
|---|---|---|---|
| DSGVO | Art. 25 | Datenschutz durch Technikgestaltung | Produktions-404 für Diagnose-Endpunkte; keine ENV-Werte in Responses |
| DSGVO | Art. 32 | Sicherheit der Verarbeitung | Zugriffskontrolle auf alle Admin-Routen; Secret-Sanitization |
| NIS2 | Art. 21 | Technische Sicherheitsmaßnahmen | Middleware-Defense-in-Depth; zentrale Guard-Funktion; Smoke-Tests |
| EU AI Act | Art. 12 | Logging | Strukturiertes Logging via `secureLog`; keine Secrets in Logs |
| EU AI Act | Art. 15 | Robustheit und Cybersicherheit | Null-Safety in Classification-Pipeline; Input-Validation |
| ISO 27001 | A.8 (Access Control) | Zugriffssteuerung | ADMIN/OWNER-Checks; doppelte Durchsetzung (Middleware + Handler) |
| ISO 27001 | A.8 (Secure Dev) | Sichere Entwicklung | Zentrale Guard-Funktion verhindert vergessene Auth-Checks |

---

## 10. Deployment-Empfehlung

**Merge-bereit** unter folgenden Bedingungen:

- [x] Typecheck sauber (`tsc --noEmit`)
- [x] Lint sauber (`next lint`)
- [x] Unit Tests: 25/25 passing
- [ ] Smoke Test gegen Staging ausführen: `BASE_URL=https://staging.kanzlei-ai.com node scripts/security-smoke-test.mjs`
- [ ] Smoke Test gegen Production nach Deployment: `node scripts/security-smoke-test.mjs`
- [ ] Manuelles Testen von `seed` und `provision-demo` mit gültigem `SEED_SECRET` in Staging (POST-Routen können nicht automatisch getestet werden)

**Hinweis:** Nach diesem Merge sollten `seed` und `provision-demo` in Production per Smoke-Test `404` zurückgeben. Wenn künftig ein neues Production-Seeding nötig ist, muss dies über eine Migration oder einen temporären Bypass mit explizitem Review erfolgen.
