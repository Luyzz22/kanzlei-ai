import test from "node:test"
import assert from "node:assert/strict"

import {
  expiresWithin,
  isProviderEligible,
  type ProviderProfileSnapshot
} from "@/lib/compliance/provider-profile"
import { decideRouting } from "@/lib/compliance/policy-decision"
import { runLocalDetectors } from "@/lib/compliance/detectors"
import type { TenantAiGovernance } from "@/lib/ai/tenant-ai-governance"

const NOW = new Date("2026-08-12T12:00:00Z")

/** Vollstaendig freigegebenes Profil — Ausgangspunkt, den die Tests verschlechtern. */
function fullProfile(overrides: Partial<ProviderProfileSnapshot> = {}): ProviderProfileSnapshot {
  return {
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
    expiresAt: new Date("2027-01-01"),
    ...overrides
  }
}

const cloudAllowed: TenantAiGovernance = {
  allowedProviders: [],
  preferEuModels: false,
  requirePseudonymization: false,
  allowThirdCountryLlmTransfer: true,
  aiPolicyEnforcement: "block"
}

test("fehlendes Profil sperrt jeden externen Weg", () => {
  const r = isProviderEligible(null, 0, NOW)
  assert.equal(r.eligible, false)
  assert.equal(r.reason, "PROVIDER_PROFILE_MISSING")
})

test("nicht verifizierter Status sperrt — auch bei vollstaendigen Nachweisen", () => {
  for (const status of ["DRAFT", "PENDING_REVIEW", "SUSPENDED", "EXPIRED"] as const) {
    const r = isProviderEligible(fullProfile({ verificationStatus: status }), 1, NOW)
    assert.equal(r.eligible, false, status)
    assert.equal(r.reason, `PROVIDER_NOT_VERIFIED:${status}`)
  }
})

test("abgelaufene Evidenz ist keine Evidenz", () => {
  const r = isProviderEligible(fullProfile({ expiresAt: new Date("2026-08-01") }), 1, NOW)
  assert.equal(r.eligible, false)
  assert.equal(r.reason, "PROVIDER_EVIDENCE_EXPIRED")
})

test("Freigabe ohne Ablaufdatum gilt weiter", () => {
  assert.equal(isProviderEligible(fullProfile({ expiresAt: null }), 1, NOW).eligible, true)
})

test("nicht freigegebene Datenklasse sperrt", () => {
  const r = isProviderEligible(fullProfile({ allowedDataClasses: [0, 1] }), 3, NOW)
  assert.equal(r.eligible, false)
  assert.equal(r.reason, "PROVIDER_CLASS_NOT_ALLOWED:3")
})

test("Klasse 0/1 braucht keine technischen Nachweise", () => {
  const bare = fullProfile({
    euDataBoundaryVerified: false,
    noTrainingVerified: false,
    zeroRetentionVerified: false,
    noHumanAccessVerified: false
  })
  assert.equal(isProviderEligible(bare, 1, NOW).eligible, true)
})

test("ab Klasse 2 sind die technischen Nachweise Pflicht", () => {
  const r = isProviderEligible(fullProfile({ noTrainingVerified: false }), 2, NOW)
  assert.equal(r.eligible, false)
  assert.equal(r.reason, "PROVIDER_EVIDENCE_INCOMPLETE")
  assert.deepEqual(r.missing, ["noTrainingVerified"])
})

test("ab Klasse 3 ist die Vertragskette Pflicht", () => {
  const r = isProviderEligible(fullProfile({ section43eAgreementSignedAt: null }), 3, NOW)
  assert.equal(r.eligible, false)
  assert.deepEqual(r.missing, ["section43eAgreementSignedAt"])
})

test("Klasse 2 verlangt die Vertragskette noch nicht", () => {
  const r = isProviderEligible(
    fullProfile({ section43eAgreementSignedAt: null, dpaSignedAt: null, tiaApprovedAt: null }),
    2,
    NOW
  )
  assert.equal(r.eligible, true)
})

test("alle fehlenden Nachweise werden gemeldet, nicht nur der erste", () => {
  const r = isProviderEligible(
    fullProfile({ dpaSignedAt: null, tiaApprovedAt: null, zeroRetentionVerified: false }),
    3,
    NOW
  )
  assert.equal(r.missing.length, 3)
})

test("expiresWithin warnt vor dem Stillstand", () => {
  assert.equal(expiresWithin(fullProfile({ expiresAt: new Date("2026-08-20") }), 30, NOW), true)
  assert.equal(expiresWithin(fullProfile({ expiresAt: new Date("2027-01-01") }), 30, NOW), false)
  assert.equal(expiresWithin(fullProfile({ expiresAt: null }), 30, NOW), false)
})

// ── Zusammenspiel mit der Wegeentscheidung ────────────────────────────────

test("ohne Profil bleibt selbst Klasse 0 lokal", () => {
  const d = decideRouting({ classification: 0, governance: cloudAllowed, now: NOW })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.reason, "PROVIDER_PROFILE_MISSING")
})

test("mit Profil darf Klasse 0 extern", () => {
  const d = decideRouting({
    classification: 0,
    governance: cloudAllowed,
    providerProfile: fullProfile(),
    now: NOW
  })
  assert.equal(d.action, "EXTERNAL")
})

test("sauberes Gate plus unvollstaendiges Profil bleibt lokal", () => {
  process.env.AI_LOCAL_NER_ENABLED = "true"
  try {
    const d = decideRouting({
      classification: 3,
      governance: cloudAllowed,
      providerProfile: fullProfile({ tiaApprovedAt: null }),
      detectors: runLocalDetectors("Die Parteien vereinbaren eine Laufzeit von 24 Monaten."),
      now: NOW
    })
    assert.equal(d.gateDecision, "GREEN", "Detektoren sind zufrieden")
    assert.equal(d.action, "LOCAL", "die fehlende TIA ueberstimmt das")
    assert.deepEqual(d.missingProviderEvidence, ["tiaApprovedAt"])
  } finally {
    delete process.env.AI_LOCAL_NER_ENABLED
  }
})

test("Klasse 4 ignoriert das Profil vollstaendig", () => {
  const d = decideRouting({
    classification: 4,
    governance: cloudAllowed,
    providerProfile: fullProfile({ allowedDataClasses: [0, 1, 2, 3, 4] }),
    now: NOW
  })
  assert.equal(d.action, "LOCAL")
  assert.equal(d.reason, "CLASS_4_HARD_EGRESS_DENY")
})
