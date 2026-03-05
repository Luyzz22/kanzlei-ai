import { createHash } from "crypto"

type LogLevel = "info" | "warn" | "error"

type LogPayload = {
  event: string
  source: "auth" | "scim" | "audit" | "health"
  outcome: "success" | "deny" | "error"
  requestId?: string | null
  tenantId?: string | null
  actorId?: string | null
  ip?: string | null
  email?: string | null
  detail?: string
  meta?: Record<string, unknown>
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16)
}

function anonymizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  const clean = ip.trim()
  if (!clean) return null
  return hashValue(clean)
}

function anonymizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  return hashValue(normalized)
}

export function logEvent(payload: LogPayload, level: LogLevel = "info") {
  const line = {
    ts: new Date().toISOString(),
    level,
    event: payload.event,
    source: payload.source,
    outcome: payload.outcome,
    requestId: payload.requestId ?? null,
    tenantId: payload.tenantId ?? null,
    actorId: payload.actorId ?? null,
    ipHash: anonymizeIp(payload.ip),
    emailHash: anonymizeEmail(payload.email),
    detail: payload.detail,
    meta: payload.meta ?? {}
  }

  if (level === "error") {
    console.error(JSON.stringify(line))
    return
  }

  if (level === "warn") {
    console.warn(JSON.stringify(line))
    return
  }

  console.log(JSON.stringify(line))
}
