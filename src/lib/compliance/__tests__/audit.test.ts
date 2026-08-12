import test from "node:test"
import assert from "node:assert/strict"

import { buildPolicyAuditMetadata } from "@/lib/compliance/audit"
import { decideRouting } from "@/lib/compliance/policy-decision"
import { runLocalDetectors } from "@/lib/compliance/detectors"
import { ModelType } from "@/types/ai"
import type { TenantAiGovernance } from "@/lib/ai/tenant-ai-governance"

const cloudAllowed: TenantAiGovernance = {
  allowedProviders: [],
  preferEuModels: false,
  requirePseudonymization: false,
  allowThirdCountryLlmTransfer: true,
  aiPolicyEnforcement: "block"
}

/** Ein Text, dessen Bestandteile im Audit unter keinen Umständen auftauchen dürfen. */
const SENSITIVE =
  "Mandant Erika Mustermann, IBAN DE89 3704 0044 0532 0130 00, " +
  "erika@example.com. Der Befund bestätigt eine Depression. " +
  "Ermittlungsverfahren wegen Untreue, Aktenzeichen 4711/2026."

function metadataFor(classification: 0 | 1 | 2 | 3 | 4) {
  const decision = decideRouting({
    classification,
    governance: cloudAllowed,
    detectors: runLocalDetectors(SENSITIVE)
  })
  return buildPolicyAuditMetadata({
    decision,
    tenantId: "t1",
    actorId: "u1",
    useCase: "contract-analysis",
    modelType: ModelType.LLAMA_COMPAT,
    observedOnly: false,
    detectorVersions: { pii_regex: "1.2.0" }
  })
}

test("Audit-Metadaten enthalten keinerlei Klartext aus dem Dokument", () => {
  const serialized = JSON.stringify(metadataFor(3))
  const forbidden = [
    "Erika",
    "Mustermann",
    "DE89",
    "example.com",
    "Depression",
    "Befund",
    "Untreue",
    "4711"
  ]
  for (const needle of forbidden) {
    assert.equal(
      serialized.includes(needle),
      false,
      `"${needle}" darf nicht im Audit-Trail stehen`
    )
  }
})

test("Audit-Metadaten tragen alles, was eine Aufsichtsanfrage braucht", () => {
  const m = metadataFor(3)
  for (const key of [
    "useCase",
    "classification",
    "action",
    "reason",
    "hardDeny",
    "gateDecision",
    "policyVersion",
    "modelType",
    "observedOnly",
    "detectorVersions"
  ]) {
    assert.ok(key in m, `Feld "${key}" fehlt im Audit-Trail`)
  }
  assert.equal(typeof m.policyVersion, "string")
  assert.notEqual(m.policyVersion, "")
})

test("Gate-Gründe sind maschinenlesbare Codes, keine Textauszüge", () => {
  const m = metadataFor(3)
  const reasons = m.gateReasons as string[]
  assert.ok(Array.isArray(reasons))
  for (const r of reasons) {
    // Format ist "red:<detektor>" / "amber:<detektor>" / "low_coverage:<detektor>"
    assert.match(r, /^[a-z_]+(:[a-z_0-9]+)?$/, `Gate-Grund "${r}" sieht nach Freitext aus`)
  }
})

test("blockierte Entscheidung wird mit Grund festgehalten", () => {
  const decision = decideRouting({ classification: 4, governance: cloudAllowed })
  const m = buildPolicyAuditMetadata({
    decision,
    tenantId: "t1",
    actorId: "u1",
    useCase: "analyze",
    modelType: null,
    observedOnly: false,
    blockDetail: "no_local_model"
  })
  assert.equal(m.modelType, null)
  assert.equal(m.blockDetail, "no_local_model")
  assert.equal(m.hardDeny, true)
  assert.equal(m.reason, "CLASS_4_HARD_EGRESS_DENY")
})

test("Beobachtungsmodus ist im Trail als solcher erkennbar", () => {
  const decision = decideRouting({ classification: 3, governance: cloudAllowed })
  const m = buildPolicyAuditMetadata({
    decision,
    tenantId: "t1",
    actorId: "u1",
    useCase: "analyze",
    modelType: ModelType.CLAUDE_SONNET_4,
    observedOnly: true
  })
  assert.equal(m.observedOnly, true)
  assert.equal(m.action, "LOCAL", "die Entscheidung selbst bleibt LOCAL")
})
