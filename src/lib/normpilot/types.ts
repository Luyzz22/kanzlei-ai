import type { z } from "zod"

import type {
  normPilotCorrectiveActionSchema,
  normPilotEvidenceMappingSchema,
  normPilotEvidencePackExportRecordSchema,
  normPilotEvidenceSourceSchema,
  normPilotGapFindingSchema,
  normPilotRequirementItemSchema,
  normPilotRequirementSetSchema
} from "./schemas"

export type NormPilotRequirementSetInput = z.infer<typeof normPilotRequirementSetSchema>
export type NormPilotRequirementItemInput = z.infer<typeof normPilotRequirementItemSchema>
export type NormPilotEvidenceSourceInput = z.infer<typeof normPilotEvidenceSourceSchema>
export type NormPilotEvidenceMappingInput = z.infer<typeof normPilotEvidenceMappingSchema>
export type NormPilotGapFindingInput = z.infer<typeof normPilotGapFindingSchema>
export type NormPilotCorrectiveActionInput = z.infer<typeof normPilotCorrectiveActionSchema>
export type NormPilotEvidencePackExportRecordInput = z.infer<typeof normPilotEvidencePackExportRecordSchema>
