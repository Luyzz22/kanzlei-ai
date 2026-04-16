/**
 * Multi-Dimensional Risk Engine (Modul 2)
 * 
 * Replaces single Risk-Score with structured assessment:
 * - Legal Blocking Risk (would prevent signature)
 * - Economic / Operational Risk (cost / friction)
 * - Risk by Category (Legal / Financial / Operational / Compliance)
 * - Signature Blocking Flag (binary: signable or not)
 * - Structural vs Substantive Match (for AGB-Vergleich)
 */

export type RiskCategory = "legal" | "financial" | "operational" | "compliance"
export type RiskSeverity = "critical" | "high" | "medium" | "low" | "informational"
export type SignatureStatus = "signable" | "amendments_required" | "not_signable"

export interface RiskFinding {
  id: string
  category: RiskCategory
  severity: RiskSeverity
  blockingSignature: boolean
  title: string
  description: string
  affectedClause?: string
  recommendation: string
  fallbackClause?: string  // Modul 3: Copy-paste alternative
  legalReference?: string
}

export interface RiskAssessment {
  legalBlockingScore: number     // 0-100: how much legal/compliance risk blocks signature
  economicOperationalScore: number  // 0-100: cost / friction risk (not blocking)
  byCategory: Record<RiskCategory, number>
  signatureStatus: SignatureStatus
  signatureBlockers: string[]   // Specific reasons it's not signable
  findings: RiskFinding[]
  overallRecommendation: string
}

const SEVERITY_WEIGHTS: Record<RiskSeverity, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 5,
  informational: 0,
}

const CATEGORY_LABELS: Record<RiskCategory, string> = {
  legal: "Legal Risk",
  financial: "Financial Risk",
  operational: "Operational Risk",
  compliance: "Compliance Risk",
}

export function getCategoryLabel(category: RiskCategory): string {
  return CATEGORY_LABELS[category]
}

/**
 * Computes the multi-dimensional risk assessment from raw findings.
 */
export function computeRiskAssessment(findings: RiskFinding[]): RiskAssessment {
  const byCategory: Record<RiskCategory, number> = {
    legal: 0,
    financial: 0,
    operational: 0,
    compliance: 0,
  }

  let legalBlockingScore = 0
  let economicOperationalScore = 0
  const signatureBlockers: string[] = []

  for (const finding of findings) {
    const weight = SEVERITY_WEIGHTS[finding.severity]
    byCategory[finding.category] += weight

    if (finding.category === "legal" || finding.category === "compliance") {
      legalBlockingScore += weight
    } else {
      economicOperationalScore += weight
    }

    if (finding.blockingSignature) {
      signatureBlockers.push(`${finding.title} — ${finding.recommendation}`)
    }
  }

  legalBlockingScore = Math.min(100, legalBlockingScore)
  economicOperationalScore = Math.min(100, economicOperationalScore)
  for (const cat of Object.keys(byCategory) as RiskCategory[]) {
    byCategory[cat] = Math.min(100, byCategory[cat])
  }

  let signatureStatus: SignatureStatus = "signable"
  if (signatureBlockers.length > 0) {
    signatureStatus = "not_signable"
  } else if (legalBlockingScore > 50 || findings.some(f => f.severity === "critical")) {
    signatureStatus = "amendments_required"
  } else if (legalBlockingScore > 25 || findings.some(f => f.severity === "high")) {
    signatureStatus = "amendments_required"
  }

  let overallRecommendation = ""
  if (signatureStatus === "not_signable") {
    overallRecommendation = `🛑 Vertrag in vorliegender Form nicht unterschreibbar. ${signatureBlockers.length} kritische Maengel muessen vor Unterzeichnung behoben werden.`
  } else if (signatureStatus === "amendments_required") {
    overallRecommendation = `⚠️ Vertrag mit Nachverhandlungen unterschreibbar. ${findings.filter(f => f.severity === "critical" || f.severity === "high").length} substantielle Punkte sollten adressiert werden.`
  } else {
    overallRecommendation = "✅ Vertrag im Wesentlichen unterschreibbar. Nur kleinere Optimierungspotenziale identifiziert."
  }

  return {
    legalBlockingScore,
    economicOperationalScore,
    byCategory,
    signatureStatus,
    signatureBlockers,
    findings,
    overallRecommendation,
  }
}

// =====================================================================
// Match Quality (for AGB-Vergleich) — Modul 2
// =====================================================================

export interface MatchAssessment {
  structuralOverlap: number      // 0-100: How similar is the FORM (sections, structure)
  substantiveCompatibility: number  // 0-100: How compatible is the CONTENT (provisions)
  overallMatch: number             // Weighted combination
  divergences: number              // Count of meaningful differences
  blockingDivergences: number      // Count of differences that block signature
  interpretation: string
}

export function computeMatchAssessment(
  totalSections: number,
  matchedSections: number,
  compatibleProvisions: number,
  totalCheckedProvisions: number,
  blockingCount: number,
): MatchAssessment {
  const structuralOverlap = totalSections > 0 ? Math.round((matchedSections / totalSections) * 100) : 0
  const substantiveCompatibility = totalCheckedProvisions > 0
    ? Math.round((compatibleProvisions / totalCheckedProvisions) * 100)
    : 0

  // Substantive compatibility weighs more (60/40)
  const overallMatch = Math.round(structuralOverlap * 0.4 + substantiveCompatibility * 0.6)

  const divergences = totalCheckedProvisions - compatibleProvisions

  let interpretation = ""
  if (blockingCount > 0) {
    interpretation = `🛑 ${blockingCount} blockierende Abweichungen — Vergleichsdokument muss vor Akzeptanz angepasst werden.`
  } else if (substantiveCompatibility < 60) {
    interpretation = `⚠️ Substantielle inhaltliche Abweichungen (${100 - substantiveCompatibility}% Konflikt-Quote) — Verhandlung empfohlen.`
  } else if (structuralOverlap < 50) {
    interpretation = `ℹ️ Hohe formale Abweichung, aber inhaltlich kompatibel — andere Vertragsstruktur, vergleichbare Substanz.`
  } else {
    interpretation = `✅ Hohe Kompatibilitaet — sowohl strukturell als auch inhaltlich. Geringe Verhandlungslast.`
  }

  return {
    structuralOverlap,
    substantiveCompatibility,
    overallMatch,
    divergences,
    blockingDivergences: blockingCount,
    interpretation,
  }
}
