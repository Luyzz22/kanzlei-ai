/**
 * Secure Logging Utility (Audit R-07)
 *
 * Ersetzt console.log/warn/error für alle sicherheitsrelevanten Bereiche.
 * Redacted automatisch PII und sensitive Felder.
 *
 * DSGVO Art. 5(1f), 32
 */

const REDACTED = "[REDACTED]"

const SENSITIVE_KEYS = [
  "email", "password", "passwort", "secret", "token", "accesstoken",
  "refreshtoken", "apikey", "api_key", "authorization", "cookie",
  "contracttext", "documenttext", "prompt", "completion", "response",
  "text", "content", "body", "iban", "steuernummer", "geburtsdatum",
  "sozialversicherung", "name", "vorname", "nachname", "telefon",
  "adresse", "address", "phone", "ssn", "creditcard", "kreditkarte"
]

/** Recursively redacts sensitive fields from objects */
export function redact(obj: unknown, depth = 0): unknown {
  if (depth > 10) return REDACTED
  if (obj === null || obj === undefined) return obj
  if (typeof obj === "string") {
    // Redact if string looks like it contains PII
    if (obj.length > 500) return `${obj.slice(0, 50)}...[${obj.length} chars ${REDACTED}]`
    return obj
  }
  if (typeof obj === "number" || typeof obj === "boolean") return obj
  if (Array.isArray(obj)) return obj.map(item => redact(item, depth + 1))
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))
          ? REDACTED
          : redact(val, depth + 1)
      ])
    )
  }
  return obj
}

type LogLevel = "info" | "warn" | "error" | "debug"

interface SecureLogEntry {
  level: LogLevel
  event: string
  timestamp: string
  data: unknown
}

/** Structured, PII-safe logging */
export function secureLog(event: string, data: Record<string, unknown> = {}, level: LogLevel = "info") {
  const entry: SecureLogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    data: redact(data)
  }

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry))
      break
    case "warn":
      console.warn(JSON.stringify(entry))
      break
    case "debug":
      if (process.env.NODE_ENV === "development") console.debug(JSON.stringify(entry))
      break
    default:
      console.info(JSON.stringify(entry))
  }
}

/** Convenience wrappers */
export const log = {
  info: (event: string, data?: Record<string, unknown>) => secureLog(event, data, "info"),
  warn: (event: string, data?: Record<string, unknown>) => secureLog(event, data, "warn"),
  error: (event: string, data?: Record<string, unknown>) => secureLog(event, data, "error"),
  debug: (event: string, data?: Record<string, unknown>) => secureLog(event, data, "debug"),
  /** Log an LLM request (auto-redacts prompt/response) */
  llmRequest: (provider: string, model: string, meta: Record<string, unknown> = {}) =>
    secureLog("llm_request", { provider, model, ...meta }),
  /** Log a policy violation */
  policyViolation: (code: string, details: Record<string, unknown> = {}) =>
    secureLog("policy_violation", { code, ...details }, "warn"),
  /** Log an audit event */
  audit: (action: string, userId: string, details: Record<string, unknown> = {}) =>
    secureLog("audit_event", { action, userId, ...details }),
}
