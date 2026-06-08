import type {
  NormPilotEvidenceCandidate,
  NormPilotEvidenceExtractionOutput,
  NormPilotEvidenceMappingOutput,
  NormPilotGapAnalysisOutput,
  NormPilotCorrectiveActionDraftOutput,
  NormPilotEvidencePackSummaryOutput,
  NormPilotPipelineOutput,
  NormPilotPolicyMarker,
  NormPilotPromptMetadata
} from "@/lib/ai/schemas/normpilot"
import type { NormPilotEvidencePackExport } from "@/lib/normpilot/export-structure"
import type {
  NormPilotEvidenceSourceInput,
  NormPilotRequirementItemInput,
  NormPilotRequirementSetInput
} from "@/lib/normpilot/types"

export type NormPilotPipelineRequirementSet = NormPilotRequirementSetInput & {
  id?: string
}

export type NormPilotPipelineRequirementItem = Omit<NormPilotRequirementItemInput, "requirementSetId"> & {
  id?: string
  requirementSetId?: string
}

export type NormPilotPipelineEvidenceSource = NormPilotEvidenceSourceInput & {
  id?: string
}

export type NormPilotPipelineGovernance = {
  tenantId?: string
  provider?: "openai" | "anthropic" | "gemini" | "llama" | "local"
  allowedProviders?: string[]
  preferEuModels?: boolean
  requirePseudonymization?: boolean
  allowThirdCountryLlmTransfer?: boolean
  aiPolicyEnforcement?: "log_only" | "block"
  containsPersonalData?: boolean
  containsMandateSecret?: boolean
  syntheticOrAnonymized?: boolean
  pseudonymized?: boolean
}

export type NormPilotPipelineInput = {
  caseId?: string
  tenantId?: string
  syntheticOrAnonymized?: boolean
  documentText?: string
  requirementSet: NormPilotPipelineRequirementSet
  requirements: NormPilotPipelineRequirementItem[]
  evidenceSources: NormPilotPipelineEvidenceSource[]
  governance?: NormPilotPipelineGovernance
  generatedAt?: Date
}

export type NormPilotPipelineOptions = {
  mock: true
}

export type NormPilotPipelineStageName =
  | "evidenceExtraction"
  | "evidenceMapping"
  | "gapAnalysis"
  | "correctiveActionDraft"
  | "evidencePackSummary"

export type NormPilotPipelineResult = NormPilotPipelineOutput

export type {
  NormPilotEvidenceCandidate,
  NormPilotEvidenceExtractionOutput,
  NormPilotEvidenceMappingOutput,
  NormPilotGapAnalysisOutput,
  NormPilotCorrectiveActionDraftOutput,
  NormPilotEvidencePackSummaryOutput,
  NormPilotEvidencePackExport,
  NormPilotPolicyMarker,
  NormPilotPromptMetadata
}
