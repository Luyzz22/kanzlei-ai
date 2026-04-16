/**
 * Clause Library & Gap-Detection Engine
 *
 * Loest das "Kritik ohne Loesung"-Problem. Statt nur zu sagen
 * "Klausel X fehlt", liefert die Engine konkrete Ersatzformulierungen
 * zum Copy-Pasten — mit BGB-Referenz und Severity.
 */

import { ContractTypeId, MarketStandardClause, getContractProfile } from "@/lib/contract-types/registry"

export type ClauseGap = {
  clauseId: string
  clauseName: string
  category: "must-have" | "should-have" | "nice-to-have"
  description: string
  fallbackTemplate: string
  bgbReference?: string
  severity: "kritisch" | "hoch" | "mittel" | "niedrig"
}

export interface DetectedClauseRef {
  clauseId: string
  excerpt?: string
  confidence?: number
}

const SEVERITY_BY_CATEGORY: Record<MarketStandardClause["category"], ClauseGap["severity"]> = {
  "must-have": "kritisch",
  "should-have": "hoch",
  "nice-to-have": "mittel"
}

export function detectClauseGaps(typeId: ContractTypeId, detected: DetectedClauseRef[]): ClauseGap[] {
  const profile = getContractProfile(typeId)
  const detectedIds = new Set(detected.map(d => d.clauseId))
  const gaps: ClauseGap[] = []

  for (const standard of profile.marketStandardClauses) {
    if (!detectedIds.has(standard.id)) {
      gaps.push({
        clauseId: standard.id,
        clauseName: standard.name,
        category: standard.category,
        description: standard.description,
        fallbackTemplate: standard.fallbackTemplate,
        bgbReference: standard.bgbReference,
        severity: SEVERITY_BY_CATEGORY[standard.category]
      })
    }
  }

  return gaps.sort((a, b) => {
    const order: Record<ClauseGap["severity"], number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 }
    return order[a.severity] - order[b.severity]
  })
}

export function getMustHaveClauses(typeId: ContractTypeId): MarketStandardClause[] {
  return getContractProfile(typeId).marketStandardClauses.filter(c => c.category === "must-have")
}

export function getClauseFallback(typeId: ContractTypeId, clauseId: string): MarketStandardClause | undefined {
  return getContractProfile(typeId).marketStandardClauses.find(c => c.id === clauseId)
}
