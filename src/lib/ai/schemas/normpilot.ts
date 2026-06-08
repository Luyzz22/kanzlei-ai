import { z } from "zod"

import {
  NORMPILOT_AI_NOTICE,
  NORMPILOT_NORM_LICENSE_NOTICE,
  NORMPILOT_PROMPT_BUNDLE_KEY,
  NORMPILOT_PROMPT_VERSION
} from "@/lib/normpilot/constants"
import { normPilotEvidencePackExportSchema } from "@/lib/normpilot/export-structure"
import {
  normPilotActionStatusSchema,
  normPilotConfidenceSchema,
  normPilotEvidenceMappingSchema,
  normPilotEvidenceSourceSchema,
  normPilotGapFindingSchema,
  normPilotLocatorSchema,
  normPilotReviewStateSchema
} from "@/lib/normpilot/schemas"

export const normPilotPromptMetadataSchema = z
  .object({
    bundleKey: z.literal(NORMPILOT_PROMPT_BUNDLE_KEY),
    promptKey: z.string().max(120),
    promptVersion: z.literal(NORMPILOT_PROMPT_VERSION),
    providerLabel: z.string().max(40),
    modelLabel: z.string().max(120),
    inputHash: z.string().regex(/^[a-f0-9]{64}$/i).optional()
  })
  .strict()

export const normPilotStageComplianceSchema = z
  .object({
    aiNotice: z.literal(NORMPILOT_AI_NOTICE),
    normLicenseNotice: z.literal(NORMPILOT_NORM_LICENSE_NOTICE),
    reviewStateDefault: z.literal("UNGEPRUEFT")
  })
  .strict()

export const normPilotEvidenceCandidateSchema = normPilotEvidenceSourceSchema
  .extend({
    id: z.string().max(120).optional(),
    confidence: normPilotConfidenceSchema.optional(),
    anchorText: z.string().max(280).optional(),
    evidenceHash: z.string().regex(/^[a-f0-9]{64}$/i).optional()
  })
  .strict()

export const normPilotEvidenceExtractionOutputSchema = z
  .object({
    candidates: z.array(normPilotEvidenceCandidateSchema).max(200),
    compliance: normPilotStageComplianceSchema,
    promptMetadata: normPilotPromptMetadataSchema
  })
  .strict()

export const normPilotEvidenceMappingOutputSchema = z
  .object({
    mappings: z.array(normPilotEvidenceMappingSchema).max(2000),
    compliance: normPilotStageComplianceSchema,
    promptMetadata: normPilotPromptMetadataSchema
  })
  .strict()

export const normPilotGapAnalysisOutputSchema = z
  .object({
    gaps: z.array(normPilotGapFindingSchema).max(500),
    fallbackNotice: z.string().max(200).optional(),
    compliance: normPilotStageComplianceSchema,
    promptMetadata: normPilotPromptMetadataSchema
  })
  .strict()

export const normPilotCorrectiveActionDraftSchema = z
  .object({
    gapFindingId: z.string().max(120).optional(),
    requirementItemId: z.string().max(120).optional(),
    title: z.string().min(1).max(240),
    description: z.string().max(4000).optional(),
    ownerRole: z.string().max(120).optional(),
    ownerLabel: z.string().max(160).optional(),
    dueDate: z.union([z.string().datetime(), z.date()]).optional(),
    status: normPilotActionStatusSchema.default("DRAFT"),
    acceptanceCriteria: z.string().max(4000).optional(),
    reviewState: normPilotReviewStateSchema.default("UNGEPRUEFT")
  })
  .strict()

export const normPilotCorrectiveActionDraftOutputSchema = z
  .object({
    correctiveActions: z.array(normPilotCorrectiveActionDraftSchema).max(500),
    compliance: normPilotStageComplianceSchema,
    promptMetadata: normPilotPromptMetadataSchema
  })
  .strict()

export const normPilotEvidencePackSummaryOutputSchema = z
  .object({
    evidencePack: normPilotEvidencePackExportSchema,
    compliance: normPilotStageComplianceSchema,
    promptMetadata: normPilotPromptMetadataSchema
  })
  .strict()

export const normPilotPolicyMarkerSchema = z
  .object({
    allowed: z.boolean(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    reasons: z.array(z.string().max(500)).max(20),
    requiredActions: z.array(z.string().max(500)).max(20),
    pseudonymizationRequired: z.boolean(),
    thirdCountryTransfer: z.boolean()
  })
  .strict()

export const normPilotPipelineOutputSchema = z
  .object({
    caseId: z.string().max(160).optional(),
    inputHash: z.string().regex(/^[a-f0-9]{64}$/i),
    extraction: normPilotEvidenceExtractionOutputSchema,
    mapping: normPilotEvidenceMappingOutputSchema,
    gapAnalysis: normPilotGapAnalysisOutputSchema,
    correctiveActionDraft: normPilotCorrectiveActionDraftOutputSchema,
    evidencePackSummary: normPilotEvidencePackSummaryOutputSchema,
    policy: normPilotPolicyMarkerSchema
  })
  .strict()

export type NormPilotPromptMetadata = z.infer<typeof normPilotPromptMetadataSchema>
export type NormPilotEvidenceCandidate = z.infer<typeof normPilotEvidenceCandidateSchema>
export type NormPilotEvidenceExtractionOutput = z.infer<typeof normPilotEvidenceExtractionOutputSchema>
export type NormPilotEvidenceMappingOutput = z.infer<typeof normPilotEvidenceMappingOutputSchema>
export type NormPilotGapAnalysisOutput = z.infer<typeof normPilotGapAnalysisOutputSchema>
export type NormPilotCorrectiveActionDraft = z.infer<typeof normPilotCorrectiveActionDraftSchema>
export type NormPilotCorrectiveActionDraftOutput = z.infer<typeof normPilotCorrectiveActionDraftOutputSchema>
export type NormPilotEvidencePackSummaryOutput = z.infer<typeof normPilotEvidencePackSummaryOutputSchema>
export type NormPilotPolicyMarker = z.infer<typeof normPilotPolicyMarkerSchema>
export type NormPilotPipelineOutput = z.infer<typeof normPilotPipelineOutputSchema>
export type NormPilotLocator = z.infer<typeof normPilotLocatorSchema>
