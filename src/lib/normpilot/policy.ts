import {
  evaluateLlmTransferPolicy,
  type LlmProviderName
} from "@/lib/ai/llm-transfer-policy"
import type { NormPilotPolicyMarker } from "@/lib/ai/schemas/normpilot"
import type { NormPilotPipelineGovernance, NormPilotPipelineInput } from "./pipeline-types"

const THIRD_COUNTRY_PROVIDERS = new Set<LlmProviderName>(["openai", "anthropic", "gemini"])

function providerFromGovernance(governance?: NormPilotPipelineGovernance): LlmProviderName {
  return governance?.provider ?? "openai"
}

function isThirdCountry(provider: LlmProviderName): boolean {
  return THIRD_COUNTRY_PROVIDERS.has(provider)
}

export function evaluateNormPilotPolicy(input: NormPilotPipelineInput): NormPilotPolicyMarker {
  const governance = input.governance
  const provider = providerFromGovernance(governance)
  const syntheticOrAnonymized = governance?.syntheticOrAnonymized ?? input.syntheticOrAnonymized ?? false
  const pseudonymized =
    governance?.pseudonymized ?? (governance?.requirePseudonymization === true || syntheticOrAnonymized)
  const containsPersonalData = governance?.containsPersonalData ?? !syntheticOrAnonymized
  const containsMandateSecret = governance?.containsMandateSecret ?? false
  const enforcementMode = governance?.aiPolicyEnforcement ?? "block"

  const decision = evaluateLlmTransferPolicy({
    tenantId: governance?.tenantId ?? input.tenantId,
    provider,
    sensitivity: "confidential",
    containsPersonalData,
    containsMandateSecret,
    allowThirdCountryLlmTransfer: governance?.allowThirdCountryLlmTransfer ?? false,
    pseudonymized,
    enforcementMode,
    purpose: "other"
  })

  const reasons = [...decision.reasons]
  const requiredActions = [...decision.requiredActions]
  const allowedProviders = governance?.allowedProviders ?? []
  let allowed = decision.allowed
  let severity = decision.severity

  if (allowedProviders.length > 0 && !allowedProviders.includes(provider)) {
    allowed = enforcementMode === "log_only"
    severity = severity === "CRITICAL" ? severity : "HIGH"
    reasons.push("Provider ist nicht in der Tenant-Allowlist enthalten.")
    requiredActions.push("Tenant-Governance: Provider-Allowlist pruefen oder lokalen/EU-Provider nutzen.")
  }

  if (governance?.requirePseudonymization && !pseudonymized) {
    allowed = enforcementMode === "log_only"
    severity = severity === "CRITICAL" ? severity : "HIGH"
    reasons.push("Tenant-Governance verlangt Pseudonymisierung vor LLM-Transfer.")
    requiredActions.push("Pseudonymisierung anwenden, bevor Dokumentdaten an Provider uebergeben werden.")
  }

  return {
    allowed,
    severity,
    reasons: reasons.map((reason) => reason.slice(0, 500)),
    requiredActions: requiredActions.map((action) => action.slice(0, 500)),
    pseudonymizationRequired: governance?.requirePseudonymization ?? false,
    thirdCountryTransfer: isThirdCountry(provider)
  }
}
