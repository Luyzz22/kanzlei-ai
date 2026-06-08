import test from "node:test"
import assert from "node:assert/strict"

import {
  clampNormPilotConfidence,
  coerceNormPilotEvidenceStatus,
  coerceNormPilotSeverity,
  normalizeNormPilotEvidenceStatus,
  normalizeNormPilotSeverity
} from "@/lib/normpilot/mappings"

test("Severity mapping normalizes German and English values", () => {
  assert.equal(normalizeNormPilotSeverity("critical"), "CRITICAL")
  assert.equal(normalizeNormPilotSeverity("kritisch"), "CRITICAL")
  assert.equal(normalizeNormPilotSeverity("hoch"), "HIGH")
  assert.equal(normalizeNormPilotSeverity("mittel"), "MEDIUM")
  assert.equal(normalizeNormPilotSeverity("low"), "LOW")
  assert.equal(normalizeNormPilotSeverity("extrem"), null)
  assert.equal(coerceNormPilotSeverity("extrem"), "MEDIUM")
})

test("Evidence status mapping normalizes common values", () => {
  assert.equal(normalizeNormPilotEvidenceStatus("covered"), "COVERED")
  assert.equal(normalizeNormPilotEvidenceStatus("teilweise"), "PARTIAL")
  assert.equal(normalizeNormPilotEvidenceStatus("fehlend"), "MISSING")
  assert.equal(normalizeNormPilotEvidenceStatus("nicht anwendbar"), "NOT_APPLICABLE")
  assert.equal(normalizeNormPilotEvidenceStatus("pruefen"), "NEEDS_REVIEW")
  assert.equal(normalizeNormPilotEvidenceStatus("unknown"), null)
  assert.equal(coerceNormPilotEvidenceStatus("unknown"), "NEEDS_REVIEW")
})

test("Confidence mapping handles percentages and caps AI confidence", () => {
  assert.equal(clampNormPilotConfidence("85%"), 0.85)
  assert.equal(clampNormPilotConfidence(75), 0.75)
  assert.equal(clampNormPilotConfidence(1), 0.98)
  assert.equal(clampNormPilotConfidence(null), undefined)
})
