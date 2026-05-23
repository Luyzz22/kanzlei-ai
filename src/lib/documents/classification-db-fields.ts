import type { ClassificationStagePayload } from "@/lib/ai/schemas/contract-analysis"

/** Denormalisierte Spalten in AnalysisRun (Filter/Analytics). */
export const CLASSIFICATION_DB_VARCHAR = 60

type ClassificationDbSource = Pick<
  ClassificationStagePayload,
  "contractClassification" | "partyConstellation" | "agbKontrolleAnwendbar"
>

/** Klassifikations-JSON darf länger sein; DB-Spalten sind VARCHAR(60). */
export function classificationFieldsForDb(
  classification: ClassificationDbSource | null | undefined
): {
  contractClassification: string | null
  partyConstellation: string | null
  agbKontrolleAnwendbar: boolean | null
} {
  if (!classification) {
    return {
      contractClassification: null,
      partyConstellation: null,
      agbKontrolleAnwendbar: null
    }
  }

  return {
    contractClassification: classification.contractClassification.slice(0, CLASSIFICATION_DB_VARCHAR),
    partyConstellation: classification.partyConstellation?.slice(0, CLASSIFICATION_DB_VARCHAR) ?? null,
    agbKontrolleAnwendbar: classification.agbKontrolleAnwendbar ?? null
  }
}
