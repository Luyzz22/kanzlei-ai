import test from "node:test"
import assert from "node:assert/strict"

import {
  healthTermDetector,
  identifierDetector,
  mandateTermDetector,
  nerCoverageDetector,
  runLocalDetectors
} from "@/lib/compliance/detectors"
import { decideRouting } from "@/lib/compliance/policy-decision"
import { evaluateGate } from "@/lib/hybrid/policy-gate"
import type { TenantAiGovernance } from "@/lib/ai/tenant-ai-governance"

const cloudAllowed: TenantAiGovernance = {
  allowedProviders: [],
  preferEuModels: false,
  requirePseudonymization: false,
  allowThirdCountryLlmTransfer: true,
  aiPolicyEnforcement: "block"
}

test("Gesundheitsbegriffe sind rot", () => {
  const d = healthTermDetector("Der Befund zeigt ein Karzinom im Frühstadium.")
  assert.equal(d.severity, "red")
  assert.equal(d.flagged, true)
})

test("Mandatsbegriffe sind rot", () => {
  const d = mandateTermDetector("Das Ermittlungsverfahren gegen den Beschuldigten läuft.")
  assert.equal(d.severity, "red")
})

test("Begriffserkennung ist case-insensitiv", () => {
  assert.equal(healthTermDetector("DIAGNOSE: unauffällig").severity, "red")
  assert.equal(mandateTermDetector("Haftbefehl erlassen").severity, "red")
})

test("unauffälliger Text löst keine Begriffs-Detektoren aus", () => {
  const text = "Die Parteien vereinbaren eine Laufzeit von 24 Monaten."
  assert.equal(healthTermDetector(text).severity, "none")
  assert.equal(mandateTermDetector(text).severity, "none")
})

test("Identifikatoren sind amber, nicht rot — sie sind pseudonymisierbar", () => {
  const d = identifierDetector("Kontakt: kanzlei@example.com, IBAN DE89 3704 0044 0532 0130 00")
  assert.equal(d.flagged, true)
  assert.equal(d.severity, "amber")
  assert.ok(d.detail?.startsWith("identifier_types:"))
})

test("Text ohne Identifikatoren ist unauffällig", () => {
  const d = identifierDetector("Die Vertragsstrafe beträgt zehntausend Euro pro Verstoss.")
  assert.equal(d.flagged, false)
  assert.equal(d.severity, "none")
})

test("NER-Melder meldet ohne lokales Modell Abdeckung 0", () => {
  delete process.env.AI_LOCAL_NER_ENABLED
  const d = nerCoverageDetector()
  assert.equal(d.confidence, 0)
  assert.equal(d.detail, "local_ner_not_deployed")
})

test("NER-Melder meldet volle Abdeckung, sobald das lokale Modell steht", () => {
  process.env.AI_LOCAL_NER_ENABLED = "true"
  try {
    assert.equal(nerCoverageDetector().confidence, 1)
  } finally {
    delete process.env.AI_LOCAL_NER_ENABLED
  }
})

test("fehlende NER-Abdeckung haelt sauberen Text lokal (fail closed)", () => {
  delete process.env.AI_LOCAL_NER_ENABLED
  const text = "Die Parteien vereinbaren eine Laufzeit von 24 Monaten."
  const outcome = evaluateGate({
    jobRef: "t",
    tenantScope: "t",
    policyVersion: "test",
    fields: { redactedText: "", documentKind: "other" },
    detectors: runLocalDetectors(text),
    tenantAllowsCloud: true,
    minCoverage: 0.98
  })
  assert.equal(outcome.decision, "AMBER")
  assert.ok(outcome.reasons.some((r) => r.startsWith("low_coverage:ner_persons_orgs")))
})

test("mit NER-Abdeckung wird sauberer Text extern zulaessig", () => {
  process.env.AI_LOCAL_NER_ENABLED = "true"
  try {
    const d = decideRouting({
      classification: 3,
      governance: cloudAllowed,
      providerProfile: {
        provider: "anthropic:bedrock",
        trustTier: "EU_CONTROLLED",
        verificationStatus: "VERIFIED",
        allowedDataClasses: [0, 1, 2, 3],
        euDataBoundaryVerified: true,
        noTrainingVerified: true,
        zeroRetentionVerified: true,
        noHumanAccessVerified: true,
        abuseMonitoringDisabled: true,
        supportEuOnlyVerified: true,
        section43eAgreementSignedAt: new Date("2026-01-01"),
        dpaSignedAt: new Date("2026-01-01"),
        tiaApprovedAt: new Date("2026-01-01"),
        expiresAt: null
      },
      detectors: runLocalDetectors("Die Parteien vereinbaren eine Laufzeit von 24 Monaten.")
    })
    assert.equal(d.action, "EXTERNAL")
    assert.equal(d.gateDecision, "GREEN")
  } finally {
    delete process.env.AI_LOCAL_NER_ENABLED
  }
})

test("Gesundheitsdaten bleiben lokal, auch mit voller NER-Abdeckung", () => {
  process.env.AI_LOCAL_NER_ENABLED = "true"
  try {
    const d = decideRouting({
      classification: 3,
      governance: cloudAllowed,
      detectors: runLocalDetectors("Der Befund bestätigt eine Depression.")
    })
    assert.equal(d.action, "LOCAL")
    assert.equal(d.gateDecision, "RED")
    assert.equal(d.reason, "RESIDUAL_SECRET_DETECTED")
  } finally {
    delete process.env.AI_LOCAL_NER_ENABLED
  }
})

test("runLocalDetectors liefert alle vier Detektoren mit Version", () => {
  const results = runLocalDetectors("Testtext")
  assert.equal(results.length, 4)
  for (const r of results) {
    assert.ok(r.name.length > 0)
    assert.match(r.version, /^\d+\.\d+\.\d+$/, `${r.name} ohne gueltige Version`)
  }
})
