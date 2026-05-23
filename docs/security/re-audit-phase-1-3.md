# KanzleiAI Phase 1.3 Re-Audit — Security & Privacy Hardening

**Datum:** 23.05.2026
**Autor:** Claude / Luis Schenk
**Status:** Teilweise geschlossen — offene Lücken dokumentiert

---

## [KRITISCH] Auth-Debug-Endpoint leakt Konfigurationsdaten

### Befund
`/api/auth/debug/route.ts` gab `NEXTAUTH_URL` im Klartext aus, ohne Auth-Check.

### Risiko
Configuration Leakage, Reconnaissance, Angriffsflächen-Erweiterung.

### Regulatorische Grundlage
- DSGVO Art. 32
- NIS2 Art. 21
- ISO 27001 Annex A.8

### Fix
- Production: 404
- Non-Production: Admin-Auth erforderlich
- Keine sensiblen Werte in Response

### Status
**Geschlossen** — auth/debug/route.ts gehärtet.

---

## [KRITISCH] LLM Transfer Policy Guard fehlt

### Befund
Rohvertragstexte mit Mandatsgeheimnissen konnten ohne Policy-Prüfung an US-LLMs gesendet werden.

### Risiko
Drittlandtransfer, § 203 StGB Verletzung, fehlende technische Durchsetzung.

### Regulatorische Grundlage
- DSGVO Art. 5 Abs. 1 lit. c, f / Art. 25 / Art. 32 / Art. 44 ff.
- § 203 StGB / BRAO § 43e
- EU AI Act Art. 12, 14, 15

### Fix
- `src/lib/ai/llm-transfer-policy.ts` implementiert
- Zwei Modi: `log_only` (Standard) und `block`
- Keine PII in Error-Messages
- Integration in Pipeline noch ausstehend (separater PR)

### Status
**Teilweise geschlossen** — Modul existiert, Pipeline-Integration ausstehend.

---

## [HOCH] Admin-Routen in publicPrefixes

### Befund
`/api/admin/status` und `/api/admin/seed` waren in Middleware `publicPrefixes` → Auth-Bypass.

### Risiko
Unautorisierter Zugriff auf Admin-Endpunkte.

### Regulatorische Grundlage
- DSGVO Art. 25, 32
- NIS2 Art. 21

### Fix
Beide Routen aus `publicPrefixes` entfernt. Middleware erzwingt Session-Validierung.

### Status
**Geschlossen.**

---

## [HOCH] Privacy Redaction fehlt

### Befund
Keine Pseudonymisierung vor LLM-Transfer.

### Risiko
Direkt identifizierbare PII (E-Mail, IBAN, Telefon) an externe LLMs.

### Regulatorische Grundlage
- DSGVO Art. 5 Abs. 1 lit. c / Art. 25 / Art. 32 / Art. 44 ff.
- § 203 StGB

### Fix
- `src/lib/ai/privacy-redaction.ts` implementiert
- Deterministische Placeholder: [EMAIL_1], [IBAN_1], [PHONE_1] etc.
- Re-Hydration nach LLM-Call
- Keine aggressive Personennamen-Ersetzung (Vertragslogik erhalten)

### Status
**Teilweise geschlossen** — Modul existiert, Pipeline-Integration ausstehend.

---

## [HOCH] Tenant AI Governance unvollständig

### Befund
`TenantGovernanceSettings` hat `allowedProviders` und `preferEuModels`, aber `requirePseudonymization`, `allowThirdCountryLlmTransfer` und `aiPolicyEnforcement` fehlen.

### Fix
- `src/lib/ai/tenant-ai-governance.ts` lädt defensiv aus DB + ENV-Fallbacks
- Neue Felder können per Migration hinzugefügt werden (Schema-bereit)
- Konservative Defaults: kein Drittlandtransfer, log_only

### Status
**Teilweise geschlossen** — Governance-Loader existiert, DB-Schema-Erweiterung ausstehend.

---

## [MITTEL] UI/Export zeigt technische Interna

### Befund
Standard-UI zeigt tenantId, storageKey, documentId (voll), SHA-256.

### Fix
- `src/lib/security/ui-hygiene.ts` mit Masking-Utilities
- `canViewTechnicalReferences()` — rollenbasiert
- `maskTechnicalId()` — 8-Zeichen-Trunkierung
- `sanitizeForExport()` — filtert Storage-Pfade aus Standard-Export
- UI-Component-Integration ausstehend

### Status
**Teilweise geschlossen** — Utilities existieren, UI-Integration ausstehend.

---

## Offene Lücken

### [HOCH] Pipeline-Integration von LLM-Transfer-Policy + Privacy-Redaction
- Policy Guard vor Provider-Aufruf in `runJsonStage` einfügen
- Pseudonymisierung optional aktivieren
- Structured Logging ohne PII

### [MITTEL] B2B-AGB-Qualifier im Risk-Prompt
- §§ 308/309 BGB nicht als direkter Verstoß formulieren bei B2B
- § 307 BGB als Primärnorm
- Prompt-Governance-Anpassung nötig

### [MITTEL] Missing-Clause-Detection im Risk-Prompt
- Lieferverzug, Force Majeure, QS, Datenschutz, Produkthaftung
- Prompt-Erweiterung nötig

### [MITTEL] Confidence Cap bei 98%
- Schema-Anpassung: `classificationConfidence.max(0.98)`

### [NIEDRIG] DB-Schema-Erweiterung für Governance-Felder
- `requirePseudonymization Boolean @default(false)`
- `allowThirdCountryLlmTransfer Boolean @default(false)`
- `aiPolicyEnforcement String @default("log_only")`

---

## Manuelle Aktionen (nicht automatisierbar)

- [ ] Branch Protection auf `main` aktivieren
- [ ] Secret Rotation prüfen (historische Leaks?)
- [ ] Vercel/Neon Backup und PITR verifizieren
- [ ] DPA/SCC/TIA mit Anthropic, OpenAI, Google abschließen
- [ ] DSFA/DPIA für KI-gestützte Vertragsanalyse abschließen
- [ ] `GEMINI_CHAT_MODEL` und `OPENAI_CHAT_MODEL` ENV-Vars in Vercel prüfen/bereinigen
