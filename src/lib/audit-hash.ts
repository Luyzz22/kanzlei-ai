import { createHash } from "node:crypto"

export type AuditHashPayload = {
  tenantId: string
  actorId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  documentId: string | null
  analysisLogId: string | null
  ip: string | null
  userAgent: string | null
  requestId: string | null
  createdAtIso: string
  metadata: unknown
}

function stableStringify(value: unknown): string {
  // Deterministic JSON: sorts object keys recursively.
  if (value === null || value === undefined) return "null"
  if (typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  const props = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
  return `{${props.join(",")}}`
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export function computeEventHash(prevHash: string | null, payload: AuditHashPayload): string {
  const canonical = stableStringify(payload)
  const prefix = prevHash ?? ""
  return sha256Hex(prefix + "|" + canonical)
}
