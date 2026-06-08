import { Prisma } from "@prisma/client"

export const NORMPILOT_AUDIT_METADATA_ALLOWED_KEYS = [
  "requirementSetId",
  "requirementItemId",
  "evidenceSourceId",
  "evidenceMappingId",
  "gapFindingId",
  "correctiveActionId",
  "exportId",
  "itemCount",
  "requirementCount",
  "mappingCount",
  "gapCount",
  "correctiveActionCount",
  "status",
  "previousStatus",
  "nextStatus",
  "reviewState",
  "previousReviewState",
  "nextReviewState",
  "previousState",
  "nextState",
  "severity",
  "format",
  "promptKey",
  "promptVersion",
  "promptKeys",
  "promptVersions",
  "contentHash",
  "errorCode"
] as const

export const NORMPILOT_AUDIT_METADATA_FORBIDDEN_KEY_PARTS = [
  "anchor",
  "customer",
  "description",
  "documentTitle",
  "evidenceExcerpt",
  "fullText",
  "normText",
  "ownerLabel",
  "recommendation",
  "sourceSummary",
  "text",
  "title"
] as const

type NormPilotAuditMetadataKey = (typeof NORMPILOT_AUDIT_METADATA_ALLOWED_KEYS)[number]
type NormPilotAuditMetadataScalar = string | number | boolean | null
type NormPilotAuditMetadataArray = ReadonlyArray<string | number | boolean>
type NormPilotAuditMetadataValue =
  | NormPilotAuditMetadataScalar
  | NormPilotAuditMetadataArray

export type NormPilotAuditMetadataInput = Partial<Record<NormPilotAuditMetadataKey, NormPilotAuditMetadataValue>>

const allowedKeySet = new Set<string>(NORMPILOT_AUDIT_METADATA_ALLOWED_KEYS)
const maxStringLength = 160
const maxArrayLength = 20

export function isNormPilotAuditMetadataKeyAllowed(key: string): boolean {
  const normalized = key.toLowerCase()
  return (
    allowedKeySet.has(key) &&
    !NORMPILOT_AUDIT_METADATA_FORBIDDEN_KEY_PARTS.some((part) => normalized.includes(part.toLowerCase()))
  )
}

function assertMetadataValue(key: string, value: NormPilotAuditMetadataValue) {
  if (value === null) return

  if (Array.isArray(value)) {
    if (value.length > maxArrayLength) {
      throw new Error(`NormPilot audit metadata array is too long: ${key}`)
    }
    for (const entry of value) {
      if (typeof entry === "string" && entry.length > maxStringLength) {
        throw new Error(`NormPilot audit metadata array entry is too long: ${key}`)
      }
    }
    return
  }

  if (typeof value === "string" && value.length > maxStringLength) {
    throw new Error(`NormPilot audit metadata string is too long: ${key}`)
  }
}

function isMetadataArrayValue(value: NormPilotAuditMetadataValue): value is NormPilotAuditMetadataArray {
  return Array.isArray(value)
}

export function buildNormPilotAuditMetadata(input: NormPilotAuditMetadataInput): Prisma.InputJsonValue {
  const metadata: Record<string, NormPilotAuditMetadataScalar | NormPilotAuditMetadataScalar[]> = {}

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (!isNormPilotAuditMetadataKeyAllowed(key)) {
      throw new Error(`NormPilot audit metadata key is not allowed: ${key}`)
    }
    assertMetadataValue(key, value)
    metadata[key] = isMetadataArrayValue(value) ? Array.from(value) : value
  }

  return metadata as Prisma.InputJsonValue
}
