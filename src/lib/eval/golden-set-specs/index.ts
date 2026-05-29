import ndaJson from "./nda-nexus-trentmann.json"
import lieferantJson from "./lieferantenvertrag-mueller-schneider.json"

export type RequiredFinding = {
  keyword: string
  severity: "hoch" | "mittel" | "niedrig"
  module?: string
}

export type GoldenSetSpec = {
  id: string
  name: string
  contractType: string
  documentHash?: string
  version: string
  expectations: {
    minFindings: number
    maxFindings: number
    minHighFindings: number
    riskScoreRange: [number, number]
    requiredFindings: RequiredFinding[]
    requiredRiskNatures: string[]
    classificationExpected: {
      contractClassification: string
      agbKontrolleAnwendbar: boolean
    }
  }
}

export const GOLDEN_SET_SPECS: GoldenSetSpec[] = [
  ndaJson as GoldenSetSpec,
  lieferantJson as GoldenSetSpec
]

export function getGoldenSetSpec(id: string): GoldenSetSpec | undefined {
  return GOLDEN_SET_SPECS.find((gs) => gs.id === id)
}
