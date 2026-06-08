import test from "node:test"
import assert from "node:assert/strict"

import { evaluateNormPilotPolicy } from "@/lib/normpilot/policy"

const input = {
  caseId: "policy-test",
  requirementSet: {
    title: "Policy Checkliste",
    sourceKind: "customer_checklist"
  },
  requirements: [
    {
      code: "DSGVO-001",
      title: "Pseudonymisierung",
      customerText: "Kurzanforderung ohne Norm-Volltext."
    }
  ],
  evidenceSources: [
    {
      sourceType: "txt",
      title: "Synthetische Quelle"
    }
  ]
}

test("NormPilot policy blocks third-country transfer when pseudonymization is required but missing", () => {
  const decision = evaluateNormPilotPolicy({
    ...input,
    governance: {
      provider: "openai",
      allowedProviders: ["openai"],
      requirePseudonymization: true,
      allowThirdCountryLlmTransfer: false,
      aiPolicyEnforcement: "block",
      containsPersonalData: true,
      syntheticOrAnonymized: false,
      pseudonymized: false
    }
  })

  assert.equal(decision.allowed, false)
  assert.equal(decision.severity, "HIGH")
  assert.equal(decision.pseudonymizationRequired, true)
  assert.equal(decision.thirdCountryTransfer, true)
})

test("NormPilot policy allows synthetic local-provider eval context", () => {
  const decision = evaluateNormPilotPolicy({
    ...input,
    syntheticOrAnonymized: true,
    governance: {
      provider: "local",
      allowedProviders: ["local"],
      requirePseudonymization: false,
      allowThirdCountryLlmTransfer: false,
      aiPolicyEnforcement: "block",
      syntheticOrAnonymized: true
    }
  })

  assert.equal(decision.allowed, true)
  assert.equal(decision.severity, "LOW")
  assert.equal(decision.thirdCountryTransfer, false)
})
