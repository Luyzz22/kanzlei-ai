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

export type NormPilotRequirementSetInput = z.input<typeof normPilotRequirementSetSchema>
export type NormPilotRequirementItemInput = z.input<typeof normPilotRequirementItemSchema>
export type NormPilotEvidenceSourceInput = z.input<typeof normPilotEvidenceSourceSchema>
export type NormPilotEvidenceMappingInput = z.input<typeof normPilotEvidenceMappingSchema>
export type NormPilotGapFindingInput = z.input<typeof normPilotGapFindingSchema>
export type NormPilotCorrectiveActionInput = z.input<typeof normPilotCorrectiveActionSchema>
export type NormPilotEvidencePackExportRecordInput = z.input<typeof normPilotEvidencePackExportRecordSchema>
