/**
 * Pure utility functions for diagnostic output hardening.
 * Separated from admin-route-guard.ts for testability (no server-only dependency).
 *
 * DSGVO Art. 32, NIS2 Art. 21, ISO 27001 A.8
 */

export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  )
}

// Keys in diagnostic output that indicate secret material
const SECRET_KEY_PATTERNS = [
  /^.*secret.*$/i,
  /^.*token.*$/i,
  /^.*apikey.*$/i,
  /^.*api_key.*$/i,
  /^.*password.*$/i,
  /^.*credential.*$/i,
]

// String values that look like secrets
const SECRET_VALUE_PATTERNS = [
  /NEXTAUTH/,
  /DATABASE_URL/i,
  /DIRECT_URL/i,
  /sk-ant-/,
  /sk-[a-zA-Z0-9]{20,}/,
]

/** Recursively removes known-secret keys and values from diagnostic payloads. */
export function sanitizeDiagnosticOutput<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === "string") {
    for (const pattern of SECRET_VALUE_PATTERNS) {
      if (pattern.test(obj)) return "[REDACTED]" as unknown as T
    }
    return obj
  }
  if (typeof obj !== "object") return obj
  if (Array.isArray(obj)) {
    return (obj as unknown[]).map((item) =>
      sanitizeDiagnosticOutput(item)
    ) as unknown as T
  }
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([key, val]) => [
      key,
      SECRET_KEY_PATTERNS.some((p) => p.test(key))
        ? "[REDACTED]"
        : sanitizeDiagnosticOutput(val),
    ])
  ) as T
}
