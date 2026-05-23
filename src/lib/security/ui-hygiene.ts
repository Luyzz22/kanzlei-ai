/**
 * UI-Hygiene: Masking-Utility für technische Interna
 *
 * Verhindert Leakage interner IDs (tenantId, documentId, storageKey, SHA-256)
 * in Standard-UI, PDF-Export und Screenshots.
 *
 * DSGVO Art. 25 (Datenschutz durch Technikgestaltung)
 * DSGVO Art. 32 (Sicherheit der Verarbeitung)
 * NIS2 Art. 21
 * ISO 27001 Least Disclosure / Secure Configuration
 */

/**
 * Prüft ob der aktuelle Benutzer technische Referenzen sehen darf.
 * Nur ADMIN, OWNER und SECURITY_REVIEWER haben Zugriff.
 */
export function canViewTechnicalReferences(role?: string | null): boolean {
  if (!role) return false
  return role === "ADMIN" || role === "OWNER" || role === "SECURITY_REVIEWER"
}

/**
 * Maskiert eine technische ID für die Standard-UI.
 * Zeigt nur die ersten `visible` Zeichen + Ellipsis.
 *
 * @example maskTechnicalId("cmpiio1e0001ttr8sd24ppre") → "cmpiio1e…"
 * @example maskTechnicalId("d06b8330d15fd65f...") → "d06b8330…"
 */
export function maskTechnicalId(
  value: string | null | undefined,
  visible = 8
): string {
  if (!value) return ""
  if (value.length <= visible) return value
  return `${value.slice(0, visible)}…`
}

/**
 * Entscheidet welchen Wert die UI zeigt:
 * - Admin/Owner → voller Wert mit Copy-Möglichkeit
 * - Standard-User → maskierte Version
 * - Nicht zugreifbar → leerer String
 *
 * @example displayTechnicalId("cmpiio1e0001ttr8sd24ppre", "ANWALT") → "cmpiio1e…"
 * @example displayTechnicalId("cmpiio1e0001ttr8sd24ppre", "ADMIN") → "cmpiio1e0001ttr8sd24ppre"
 */
export function displayTechnicalId(
  value: string | null | undefined,
  role?: string | null,
  visible = 8
): string {
  if (!value) return ""
  if (canViewTechnicalReferences(role)) return value
  return maskTechnicalId(value, visible)
}

/**
 * Felder die in Standard-UI / Standard-Export NICHT sichtbar sein sollen.
 * Nur in Admin/Audit-UI und Audit-Export.
 */
export const HIDDEN_TECHNICAL_FIELDS = [
  "storageKey",
  "storagePath",
  "tenantId",
  "sha256",
  "inputTextHash",
] as const

/**
 * Filtert technische Felder aus einem Export-Objekt.
 * Für Standard-PDF/CSV/JSON — keine internen Storage-Pfade.
 * Für Audit-Export: überspringe diesen Filter.
 */
export function sanitizeForExport<T extends Record<string, unknown>>(
  data: T,
  includeAuditFields: boolean = false
): Partial<T> {
  if (includeAuditFields) return data

  const sanitized = { ...data }
  for (const field of HIDDEN_TECHNICAL_FIELDS) {
    if (field in sanitized) {
      delete sanitized[field]
    }
  }
  return sanitized
}
