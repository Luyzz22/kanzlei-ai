import test from "node:test"
import assert from "node:assert/strict"

import { decideRouting, type SensitivityClass } from "@/lib/compliance/policy-decision"
import type { DetectorResult } from "@/lib/hybrid/policy-gate"
import type { TenantAiGovernance } from "@/lib/ai/tenant-ai-governance"

const permissiveGovernance: TenantAiGovernance = {
  allowedProviders: [],
  preferEuModels: false,
  requirePseudonymization: false,
  allowThirdCountryLlmTransfer: true,
  aiPolicyEnforcement: "block"
}

const restrictiveGovernance: TenantAiGovernance = {
  ...permissiveGovernance,
  allowThirdCountryLlmTransfer: false
}

const cleanDetector: DetectorResult = {
  name: "pii",
  version: "1.0.0",
  flagged: false,
  severity: "none",
  confidence: 1
}

/**
 * Vollstaendig freigegebener Anbieter. Seit der Provider-Governance ist ein
 * geprueftes Profil Voraussetzung fuer JEDEN externen Weg — Tests, die
 * EXTERNAL erwarten, muessen es deshalb mitliefern.
 */
const verifiedProvider = {
  provider: "anthropic:bedrock",
  trustTier: "EU_CONTROLLED" as const,
  verificationStatus: "VERIFIED" as const,
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
}

test("Klasse 4 bleibt lokal — auch bei maximal permissiver Governance", () => {
  const d = decideRouting({
    classification: 4,
    governance: permissiveGovernance,
    detectors: [cleanDetector]
  })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.reason, "CLASS_4_HARD_EGRESS_DENY")
  assert.equal(d.hardDeny, true)
})

test("Klasse 4 wird vor der Tenant-Prüfung entschieden (nicht freischaltbar)", () => {
  // Selbst wenn alle Detektoren sauber sind und der Tenant Cloud erlaubt:
  // die Klasse-4-Regel greift zuerst und kennt keinen Ausweg.
  const d = decideRouting({
    classification: 4,
    governance: permissiveGovernance,
    detectors: [cleanDetector, { ...cleanDetector, name: "ner" }]
  })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.gateDecision, undefined, "Gate darf gar nicht erst befragt werden")
})

test("Klasse 0 und 1 dürfen extern", () => {
  for (const c of [0, 1] as SensitivityClass[]) {
    const d = decideRouting({
      classification: c,
      governance: restrictiveGovernance,
      providerProfile: verifiedProvider
    })
    assert.equal(d.action, "EXTERNAL", `Klasse ${c}`)
    assert.equal(d.reason, "CLASS_0_1_NO_SECRET")
  }
})

test("Klasse 2 und 3 bleiben ohne Tenant-Opt-in lokal", () => {
  for (const c of [2, 3] as SensitivityClass[]) {
    const d = decideRouting({
      classification: c,
      governance: restrictiveGovernance,
      detectors: [cleanDetector]
    })
    assert.equal(d.action, "LOCAL", `Klasse ${c}`)
    assert.equal(d.reason, "TENANT_POLICY_LOCAL_ONLY")
  }
})

test("Klasse 3 ohne gelaufene Detektoren bleibt lokal (fail closed)", () => {
  const d = decideRouting({ classification: 3, governance: permissiveGovernance })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.gateDecision, "AMBER")
  assert.equal(d.reason, "RESIDUAL_REIDENTIFICATION_RISK")
})

test("Klasse 3 mit leerem Detektor-Array bleibt lokal", () => {
  const d = decideRouting({
    classification: 3,
    governance: permissiveGovernance,
    detectors: []
  })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.gateDecision, "AMBER")
})

test("roter Detektor blockiert den externen Weg", () => {
  const d = decideRouting({
    classification: 3,
    governance: permissiveGovernance,
    detectors: [{ ...cleanDetector, flagged: true, severity: "red" }]
  })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.gateDecision, "RED")
  assert.equal(d.reason, "RESIDUAL_SECRET_DETECTED")
})

test("zu geringe Detektor-Abdeckung blockiert den externen Weg", () => {
  const d = decideRouting({
    classification: 3,
    governance: permissiveGovernance,
    detectors: [{ ...cleanDetector, confidence: 0.5 }],
    minCoverage: 0.98
  })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.gateDecision, "AMBER")
})

test("Klasse 2–3 darf extern, wenn Opt-in UND Detektoren sauber sind", () => {
  const d = decideRouting({
    classification: 3,
    governance: permissiveGovernance,
    providerProfile: verifiedProvider,
    detectors: [cleanDetector]
  })
  assert.equal(d.action, "EXTERNAL")
  assert.equal(d.gateDecision, "GREEN")
  assert.equal(d.hardDeny, false)
})

test("ungültige Klassifikation fällt auf die strengste Regel zurück", () => {
  const d = decideRouting({
    classification: 99 as SensitivityClass,
    governance: permissiveGovernance,
    detectors: [cleanDetector]
  })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.reason, "INVALID_CLASSIFICATION")
  assert.equal(d.hardDeny, true)
  assert.equal(d.classification, 4, "unbekannt wird wie Klasse 4 behandelt")
})

test("jede Entscheidung trägt eine Policy-Version (Auditierbarkeit)", () => {
  for (const c of [0, 1, 2, 3, 4] as SensitivityClass[]) {
    const d = decideRouting({ classification: c, governance: permissiveGovernance })
    assert.ok(d.policyVersion.length > 0, `Klasse ${c} ohne policyVersion`)
  }
})
