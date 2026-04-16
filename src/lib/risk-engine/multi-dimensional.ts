/**
 * Multi-Dimensional Risk Engine
 *
 * Loest das "Risk: 85"-Problem indem es Risiken in 4 Dimensionen aufsplittet:
 * - Legal Blocking Risk: kann der Vertrag rechtlich nicht unterschrieben werden?
 * - Financial Risk: was kostet uns dieser Vertrag potenziell?
 * - Operational Risk: wie schwer ist die Umsetzung im Alltag?
 * - Compliance Risk: verstossen wir gegen Regulatorik?
 *
 * Output: Klare Handlungsanweisung "Not Signable without Amendment"
 * statt nur einer Zahl.
 */

import { RiskDimension } from "@/lib/contract-types/registry"

export type RiskSeverity = "kritisch" | "hoch" | "mittel" | "niedrig" | "info"

export type SignatureStatus =
  | "ready-to-sign"
  | "sign-with-comments"
  | "amendment-required"
  | "not-signable"

export interface RiskFinding {
  id: string
  dimension: RiskDimension
  severity: RiskSeverity
  title: string
  description: string
  clauseReference?: string
  bgbReference?: string
  isSignatureBlocker: boolean
  recommendedAction: string
  fallbackClause?: string
}

export interface MultiDimensionalRiskScore {
  legal: number
  financial: number
  operational: number
  compliance: number
  weighted: number
  signatureStatus: SignatureStatus
  signatureBlockers: RiskFinding[]
  findings: RiskFinding[]
}

export interface MatchScore {
  structural: number
  substantive: number
  weighted: number
  interpretation: string
}

const DIMENSION_WEIGHTS: Record<RiskDimension, number> = {
  legal: 0.40,
  compliance: 0.30,
  financial: 0.20,
  operational: 0.10
}

const SEVERITY_VALUES: Record<RiskSeverity, number> = {
  kritisch: 100,
  hoch: 75,
  mittel: 50,
  niedrig: 25,
  info: 0
}

export function calculateRiskScore(findings: RiskFinding[]): MultiDimensionalRiskScore {
  const dimensionScores: Record<RiskDimension, number> = {
    legal: 0,
    financial: 0,
    operational: 0,
    compliance: 0
  }

  const dimensionCounts: Record<RiskDimension, number> = {
    legal: 0,
    financial: 0,
    operational: 0,
    compliance: 0
  }

  for (const f of findings) {
    dimensionScores[f.dimension] += SEVERITY_VALUES[f.severity]
    dimensionCounts[f.dimension] += 1
  }

  const legal = dimensionCounts.legal > 0 ? Math.min(100, dimensionScores.legal / dimensionCounts.legal) : 0
  const financial = dimensionCounts.financial > 0 ? Math.min(100, dimensionScores.financial / dimensionCounts.financial) : 0
  const operational = dimensionCounts.operational > 0 ? Math.min(100, dimensionScores.operational / dimensionCounts.operational) : 0
  const compliance = dimensionCounts.compliance > 0 ? Math.min(100, dimensionScores.compliance / dimensionCounts.compliance) : 0

  const weighted = Math.round(
    legal * DIMENSION_WEIGHTS.legal +
    compliance * DIMENSION_WEIGHTS.compliance +
    financial * DIMENSION_WEIGHTS.financial +
    operational * DIMENSION_WEIGHTS.operational
  )

  const signatureBlockers = findings.filter(f => f.isSignatureBlocker)
  const criticalCount = findings.filter(f => f.severity === "kritisch").length
  const highCount = findings.filter(f => f.severity === "hoch").length

  let signatureStatus: SignatureStatus
  if (signatureBlockers.length > 0 || criticalCount > 0) {
    signatureStatus = "not-signable"
  } else if (highCount >= 3) {
    signatureStatus = "amendment-required"
  } else if (highCount >= 1 || findings.filter(f => f.severity === "mittel").length >= 5) {
    signatureStatus = "sign-with-comments"
  } else {
    signatureStatus = "ready-to-sign"
  }

  return {
    legal: Math.round(legal),
    financial: Math.round(financial),
    operational: Math.round(operational),
    compliance: Math.round(compliance),
    weighted,
    signatureStatus,
    signatureBlockers,
    findings
  }
}

export function calculateMatchScore(structural: number, substantive: number): MatchScore {
  const weighted = Math.round(structural * 0.30 + substantive * 0.70)

  let interpretation: string
  if (substantive >= 85 && structural >= 85) {
    interpretation = "Vollstaendige Kompatibilitaet — sofort einsetzbar"
  } else if (substantive >= 70 && structural < 70) {
    interpretation = "Inhaltlich kompatibel, formal anders strukturiert — anpassbar"
  } else if (substantive < 70 && structural >= 85) {
    interpretation = "Formal aehnlich, aber inhaltliche Abweichungen — kritisch pruefen"
  } else if (substantive < 50) {
    interpretation = "Substantielle Abweichung — Nachverhandlung erforderlich"
  } else {
    interpretation = "Teilkompatibilitaet — selektiver Einsatz moeglich"
  }

  return { structural, substantive, weighted, interpretation }
}

export function getSignatureStatusLabel(status: SignatureStatus): { label: string; color: string; icon: string; description: string } {
  switch (status) {
    case "ready-to-sign":
      return {
        label: "Unterschriftsreif",
        color: "emerald",
        icon: "✓",
        description: "Vertrag kann ohne weitere Anpassungen unterzeichnet werden."
      }
    case "sign-with-comments":
      return {
        label: "Unterschrift mit Anmerkungen",
        color: "blue",
        icon: "ℹ",
        description: "Vertrag ist unterschriftsreif, aber Anmerkungen sollten dokumentiert werden."
      }
    case "amendment-required":
      return {
        label: "Nachtrag erforderlich",
        color: "amber",
        icon: "!",
        description: "Mehrere wichtige Klauseln muessen vor Unterzeichnung angepasst werden."
      }
    case "not-signable":
      return {
        label: "Nicht unterschreibbar ohne Aenderung",
        color: "red",
        icon: "✕",
        description: "Kritische Mängel oder Signature Blocker — Unterzeichnung nicht empfohlen."
      }
  }
}

export function getDimensionLabel(dim: RiskDimension): { label: string; emoji: string; description: string } {
  switch (dim) {
    case "legal":
      return {
        label: "Rechtliches Risiko",
        emoji: "⚖️",
        description: "Risiken aus rechtlicher Sicht — Klausel-Validitaet, BGB-Konformitaet, Rechtsstreit-Potenzial"
      }
    case "financial":
      return {
        label: "Finanzielles Risiko",
        emoji: "💰",
        description: "Wirtschaftliches Risiko — Haftungssummen, Strafzahlungen, Folgekosten"
      }
    case "operational":
      return {
        label: "Operatives Risiko",
        emoji: "⚙️",
        description: "Umsetzungsrisiko im Alltag — SLAs, Verfuegbarkeit, Prozess-Komplexitaet"
      }
    case "compliance":
      return {
        label: "Compliance-Risiko",
        emoji: "🛡️",
        description: "Regulatorische Risiken — DSGVO, EU AI Act, NIS2, LkSG, Branchenvorschriften"
      }
  }
}
