import { z } from "zod"

import {
  NORMPILOT_ACTION_STATUSES,
  NORMPILOT_DEFAULT_REQUIREMENT_SOURCE_KIND,
  NORMPILOT_EVIDENCE_STATUSES,
  NORMPILOT_EXPORT_FORMATS,
  NORMPILOT_EXPORT_STATUSES,
  NORMPILOT_GAP_SEVERITIES,
  NORMPILOT_REVIEW_STATES
} from "./constants"

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i)
const optionalDateLikeSchema = z.union([z.string().datetime(), z.date()]).optional()

export const normPilotReviewStateSchema = z.enum(NORMPILOT_REVIEW_STATES)
export const normPilotEvidenceStatusSchema = z.enum(NORMPILOT_EVIDENCE_STATUSES)
export const normPilotGapSeveritySchema = z.enum(NORMPILOT_GAP_SEVERITIES)
export const normPilotActionStatusSchema = z.enum(NORMPILOT_ACTION_STATUSES)
export const normPilotExportFormatSchema = z.enum(NORMPILOT_EXPORT_FORMATS)
export const normPilotExportStatusSchema = z.enum(NORMPILOT_EXPORT_STATUSES)

export const normPilotConfidenceSchema = z.coerce
  .number()
  .min(0)
  .max(1)
  .transform((value) => Math.min(value, 0.98))

export const normPilotLocatorSchema = z
  .object({
    documentId: z.string().max(120).optional(),
    sourceId: z.string().max(120).optional(),
    page: z.coerce.number().int().min(1).max(100000).optional(),
    sheet: z.string().max(120).optional(),
    row: z.coerce.number().int().min(1).max(1000000).optional(),
    column: z.string().max(40).optional(),
    sectionKey: z.string().max(120).optional(),
    anchorHash: sha256Schema.optional(),
    anchorText: z.string().max(280).optional()
  })
  .strict()

export const normPilotRequirementSetSchema = z
  .object({
    title: z.string().min(1).max(240),
    description: z.string().max(4000).optional(),
    frameworkLabel: z.string().max(120).optional(),
    scopeLabel: z.string().max(200).optional(),
    versionLabel: z.string().max(80).optional(),
    sourceKind: z.string().max(80).default(NORMPILOT_DEFAULT_REQUIREMENT_SOURCE_KIND),
    sourceDocumentId: z.string().max(120).optional(),
    contentHash: sha256Schema.optional(),
    reviewState: normPilotReviewStateSchema.default("UNGEPRUEFT"),
    retentionUntil: optionalDateLikeSchema
  })
  .strict()

export const normPilotRequirementItemSchema = z
  .object({
    requirementSetId: z.string().min(1).max(120),
    code: z.string().min(1).max(80),
    title: z.string().min(1).max(240),
    customerText: z.string().max(4000).optional(),
    normReferenceCode: z.string().max(120).optional(),
    sectionLabel: z.string().max(160).optional(),
    sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
    criticality: normPilotGapSeveritySchema.optional(),
    reviewState: normPilotReviewStateSchema.default("UNGEPRUEFT"),
    retentionUntil: optionalDateLikeSchema
  })
  .strict()

export const normPilotEvidenceSourceSchema = z
  .object({
    documentId: z.string().max(120).optional(),
    sourceType: z.string().min(1).max(80),
    title: z.string().min(1).max(240),
    sourceHash: sha256Schema.optional(),
    locator: normPilotLocatorSchema.optional(),
    reviewState: normPilotReviewStateSchema.default("UNGEPRUEFT"),
    retentionUntil: optionalDateLikeSchema
  })
  .strict()

export const normPilotEvidenceMappingSchema = z
  .object({
    requirementItemId: z.string().min(1).max(120),
    evidenceSourceId: z.string().max(120).optional(),
    status: normPilotEvidenceStatusSchema.default("NEEDS_REVIEW"),
    confidence: normPilotConfidenceSchema.optional(),
    rationale: z.string().max(3000).optional(),
    anchorText: z.string().max(280).optional(),
    locator: normPilotLocatorSchema.optional(),
    evidenceHash: sha256Schema.optional(),
    promptKey: z.string().max(120).optional(),
    promptVersion: z.string().max(32).optional(),
    provider: z.string().max(40).optional(),
    model: z.string().max(120).optional(),
    reviewState: normPilotReviewStateSchema.default("UNGEPRUEFT"),
    reviewerLabel: z.string().max(120).optional(),
    retentionUntil: optionalDateLikeSchema
  })
  .strict()

export const normPilotGapFindingSchema = z
  .object({
    requirementSetId: z.string().min(1).max(120),
    requirementItemId: z.string().max(120).optional(),
    evidenceMappingId: z.string().max(120).optional(),
    severity: normPilotGapSeveritySchema.default("MEDIUM"),
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(8000),
    recommendation: z.string().max(4000).optional(),
    sourceSummary: z
      .array(
        z.object({
          requirementCode: z.string().max(80).optional(),
          evidenceSourceTitle: z.string().max(240).optional(),
          locator: normPilotLocatorSchema.optional()
        })
      )
      .max(20)
      .optional(),
    confidence: normPilotConfidenceSchema.optional(),
    promptKey: z.string().max(120).optional(),
    promptVersion: z.string().max(32).optional(),
    provider: z.string().max(40).optional(),
    model: z.string().max(120).optional(),
    reviewState: normPilotReviewStateSchema.default("UNGEPRUEFT"),
    retentionUntil: optionalDateLikeSchema
  })
  .strict()

export const normPilotCorrectiveActionSchema = z
  .object({
    gapFindingId: z.string().max(120).optional(),
    requirementItemId: z.string().max(120).optional(),
    title: z.string().min(1).max(240),
    description: z.string().max(4000).optional(),
    ownerRole: z.string().max(120).optional(),
    ownerLabel: z.string().max(160).optional(),
    dueDate: optionalDateLikeSchema,
    status: normPilotActionStatusSchema.default("DRAFT"),
    acceptanceCriteria: z.string().max(4000).optional(),
    reviewState: normPilotReviewStateSchema.default("UNGEPRUEFT"),
    retentionUntil: optionalDateLikeSchema
  })
  .strict()

export const normPilotEvidencePackExportRecordSchema = z
  .object({
    requirementSetId: z.string().min(1).max(120),
    title: z.string().min(1).max(240),
    format: normPilotExportFormatSchema.default("MARKDOWN"),
    status: normPilotExportStatusSchema.default("REQUESTED"),
    storageKey: z.string().max(500).optional(),
    contentHash: sha256Schema.optional(),
    generatedAt: optionalDateLikeSchema,
    retentionUntil: optionalDateLikeSchema
  })
  .strict()
