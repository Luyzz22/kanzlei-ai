import {
  NORMPILOT_EVIDENCE_STATUSES,
  NORMPILOT_GAP_SEVERITIES
} from "./constants"

export type NormPilotGapSeverity = (typeof NORMPILOT_GAP_SEVERITIES)[number]
export type NormPilotEvidenceStatus = (typeof NORMPILOT_EVIDENCE_STATUSES)[number]

const SEVERITY_ALIASES: Record<string, NormPilotGapSeverity> = {
  critical: "CRITICAL",
  kritisch: "CRITICAL",
  blocker: "CRITICAL",
  high: "HIGH",
  hoch: "HIGH",
  medium: "MEDIUM",
  mittel: "MEDIUM",
  moderat: "MEDIUM",
  low: "LOW",
  niedrig: "LOW",
  gering: "LOW"
}

const EVIDENCE_STATUS_ALIASES: Record<string, NormPilotEvidenceStatus> = {
  covered: "COVERED",
  belegt: "COVERED",
  abgedeckt: "COVERED",
  partial: "PARTIAL",
  teilweise: "PARTIAL",
  teilweise_belegt: "PARTIAL",
  missing: "MISSING",
  fehlt: "MISSING",
  fehlend: "MISSING",
  conflicting: "CONFLICTING",
  widerspruechlich: "CONFLICTING",
  widersprüchlich: "CONFLICTING",
  conflict: "CONFLICTING",
  not_applicable: "NOT_APPLICABLE",
  notapplicable: "NOT_APPLICABLE",
  nicht_anwendbar: "NOT_APPLICABLE",
  needs_review: "NEEDS_REVIEW",
  needsreview: "NEEDS_REVIEW",
  review: "NEEDS_REVIEW",
  pruefen: "NEEDS_REVIEW",
  prüfen: "NEEDS_REVIEW"
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

export function normalizeNormPilotSeverity(value: unknown): NormPilotGapSeverity | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase()
  if (upper === "CRITICAL" || upper === "HIGH" || upper === "MEDIUM" || upper === "LOW") {
    return upper
  }

  return SEVERITY_ALIASES[normalizeKey(trimmed)] ?? null
}

export function coerceNormPilotSeverity(value: unknown, fallback: NormPilotGapSeverity = "MEDIUM"): NormPilotGapSeverity {
  return normalizeNormPilotSeverity(value) ?? fallback
}

export function normalizeNormPilotEvidenceStatus(value: unknown): NormPilotEvidenceStatus | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase()
  if (
    upper === "COVERED" ||
    upper === "PARTIAL" ||
    upper === "MISSING" ||
    upper === "CONFLICTING" ||
    upper === "NOT_APPLICABLE" ||
    upper === "NEEDS_REVIEW"
  ) {
    return upper
  }

  return EVIDENCE_STATUS_ALIASES[normalizeKey(trimmed)] ?? null
}

export function coerceNormPilotEvidenceStatus(
  value: unknown,
  fallback: NormPilotEvidenceStatus = "NEEDS_REVIEW"
): NormPilotEvidenceStatus {
  return normalizeNormPilotEvidenceStatus(value) ?? fallback
}

export function clampNormPilotConfidence(value: unknown): number | undefined {
  if (value == null) return undefined
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(value > 1 ? value / 100 : value, 0), 0.98)
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim().replace(",", ".").replace(/%$/, ""))
    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed > 1 ? parsed / 100 : parsed, 0), 0.98)
    }
  }
  return undefined
}
