export const NORMPILOT_AI_NOTICE =
  "KI-generiert (NormPilot, limited_risk, EU AI Act). Vor Massnahmenumsetzung durch Fachverantwortlichen pruefen."

export const NORMPILOT_NORM_LICENSE_NOTICE =
  "Keine proprietaeren Norm-Volltexte enthalten. Bei unklarer Normgrundlage: Diesen Abschnitt bitte direkt in der Norm pruefen."

export const NORMPILOT_EU_AI_ACT_RISK_CLASS = "limited_risk" as const

export const NORMPILOT_DEFAULT_REQUIREMENT_SOURCE_KIND = "customer_checklist" as const

export const NORMPILOT_PROMPT_KEYS = {
  evidenceExtraction: "normpilot.evidence_extraction.default",
  evidenceMapping: "normpilot.evidence_mapping.default",
  gapAnalysis: "normpilot.gap_analysis.default",
  correctiveAction: "normpilot.corrective_action.default",
  auditQuestions: "normpilot.audit_questions.default"
} as const

export const NORMPILOT_REVIEW_STATES = [
  "UNGEPRUEFT",
  "IN_PRUEFUNG",
  "FREIGEGEBEN",
  "ZURUECKGEWIESEN"
] as const

export const NORMPILOT_EVIDENCE_STATUSES = [
  "COVERED",
  "PARTIAL",
  "MISSING",
  "CONFLICTING",
  "NOT_APPLICABLE",
  "NEEDS_REVIEW"
] as const

export const NORMPILOT_GAP_SEVERITIES = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW"
] as const

export const NORMPILOT_ACTION_STATUSES = [
  "DRAFT",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED"
] as const

export const NORMPILOT_EXPORT_FORMATS = ["MARKDOWN", "CSV", "JSON"] as const
export const NORMPILOT_EXPORT_STATUSES = ["REQUESTED", "GENERATED", "FAILED"] as const
