import { z } from "zod"

import {
  NORMPILOT_AI_NOTICE,
  NORMPILOT_EU_AI_ACT_RISK_CLASS,
  NORMPILOT_NORM_LICENSE_NOTICE
} from "./constants"
import {
  normPilotActionStatusSchema,
  normPilotEvidenceStatusSchema,
  normPilotGapSeveritySchema,
  normPilotLocatorSchema,
  normPilotReviewStateSchema
} from "./schemas"

export const normPilotEvidencePackRequirementSchema = z.object({
  id: z.string().min(1).max(120),
  code: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  normReferenceCode: z.string().max(120).optional(),
  reviewState: normPilotReviewStateSchema
})

export const normPilotEvidencePackMappingSchema = z.object({
  requirementCode: z.string().min(1).max(80),
  evidenceSourceTitle: z.string().max(240).optional(),
  status: normPilotEvidenceStatusSchema,
  confidence: z.number().min(0).max(0.98).optional(),
  locator: normPilotLocatorSchema.optional(),
  anchorText: z.string().max(280).optional(),
  evidenceHash: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  reviewState: normPilotReviewStateSchema
})

export const normPilotEvidencePackGapSchema = z.object({
  requirementCode: z.string().max(80).optional(),
  severity: normPilotGapSeveritySchema,
  title: z.string().min(1).max(240),
  description: z.string().min(1).max(8000),
  recommendation: z.string().max(4000).optional(),
  reviewState: normPilotReviewStateSchema
})

export const normPilotEvidencePackActionSchema = z.object({
  title: z.string().min(1).max(240),
  ownerRole: z.string().max(120).optional(),
  ownerLabel: z.string().max(160).optional(),
  status: normPilotActionStatusSchema,
  acceptanceCriteria: z.string().max(4000).optional(),
  reviewState: normPilotReviewStateSchema
})

export const normPilotEvidencePackExportSchema = z.object({
  generatedAt: z.string().datetime(),
  aiNotice: z.literal(NORMPILOT_AI_NOTICE),
  compliance: z.object({
    euAiActRiskClass: z.literal(NORMPILOT_EU_AI_ACT_RISK_CLASS),
    gdprDataMinimization: z.boolean(),
    gobdAuditTrailRequired: z.boolean(),
    normLicenseNotice: z.literal(NORMPILOT_NORM_LICENSE_NOTICE)
  }),
  requirementSet: z.object({
    id: z.string().min(1).max(120),
    title: z.string().min(1).max(240),
    frameworkLabel: z.string().max(120).optional(),
    scopeLabel: z.string().max(200).optional(),
    versionLabel: z.string().max(80).optional(),
    reviewState: normPilotReviewStateSchema
  }),
  requirements: z.array(normPilotEvidencePackRequirementSchema).max(500),
  evidenceMatrix: z.array(normPilotEvidencePackMappingSchema).max(2000),
  gaps: z.array(normPilotEvidencePackGapSchema).max(500),
  correctiveActions: z.array(normPilotEvidencePackActionSchema).max(500),
  promptMetadata: z
    .object({
      promptKeys: z.array(z.string().max(120)).max(20),
      promptVersions: z.array(z.string().max(32)).max(20),
      providerLabels: z.array(z.string().max(40)).max(20),
      modelLabels: z.array(z.string().max(120)).max(20)
    })
    .partial()
    .optional()
})

export type NormPilotEvidencePackExport = z.infer<typeof normPilotEvidencePackExportSchema>

export function buildNormPilotEvidencePackExport(
  input: Omit<NormPilotEvidencePackExport, "aiNotice" | "compliance" | "generatedAt"> & {
    generatedAt?: Date
  }
): NormPilotEvidencePackExport {
  return normPilotEvidencePackExportSchema.parse({
    ...input,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    aiNotice: NORMPILOT_AI_NOTICE,
    compliance: {
      euAiActRiskClass: NORMPILOT_EU_AI_ACT_RISK_CLASS,
      gdprDataMinimization: true,
      gobdAuditTrailRequired: true,
      normLicenseNotice: NORMPILOT_NORM_LICENSE_NOTICE
    }
  })
}
