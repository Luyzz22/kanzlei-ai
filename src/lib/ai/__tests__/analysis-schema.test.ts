import test from "node:test"
import assert from "node:assert/strict"

import {
  extractionStageSchema,
  normalizeConfidence01,
  normalizeSeverityValue,
  normalizeRiskScore01,
  parseJsonUnknown,
  preprocessRiskStageJson,
  riskAndGuidanceStageSchema,
  stripCodeFences
} from "@/lib/ai/schemas/contract-analysis"

test("stripCodeFences entfernt Markdown-Fences", () => {
  const inner = `{"a":1}`
  assert.equal(stripCodeFences(`\`\`\`json\n${inner}\n\`\`\``), inner)
})

test("extractionStageSchema validiert gültige Extraktion", () => {
  const raw = JSON.stringify({
    contractType: "Dienstvertrag",
    parties: [{ name: "Firma A GmbH", role: "Auftraggeber" }],
    term: { startHint: "01.01.2025", endHint: null },
    legalTopics: [{ topic: "haftung", summary: "Begrenzung", riskHint: "mittel" }]
  })
  const parsed = extractionStageSchema.safeParse(parseJsonUnknown(raw))
  assert.equal(parsed.success, true)
})

test("riskAndGuidanceStageSchema lehnt ungültige Severity ab", () => {
  const raw = JSON.stringify({
    findings: [
      {
        category: "test",
        title: "T",
        description: "D",
        severity: "extrem"
      }
    ],
    riskScore01: 0.5,
    recommendedMeasures: ["x"],
    negotiationHints: ["y"],
    explanationSummary: "Zusammenfassung"
  })
  const parsed = riskAndGuidanceStageSchema.safeParse(parseJsonUnknown(raw))
  assert.equal(parsed.success, false)
})

test("preprocessRiskStageJson normalisiert EN-Severity und Prozent-Scores", () => {
  const raw = {
    findings: [{ category: "x", title: "T", description: "D", severity: "high" }],
    riskScore01: 75,
    recommendedMeasures: ["a"],
    negotiationHints: ["b"],
    explanationSummary: "ok"
  }
  const normalized = preprocessRiskStageJson(raw)
  const parsed = riskAndGuidanceStageSchema.safeParse(normalized)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.findings[0]?.severity, "hoch")
    assert.equal(parsed.data.riskScore01, 0.75)
  }
})

test("normalizeSeverityValue mappt englische Werte", () => {
  assert.equal(normalizeSeverityValue("high"), "hoch")
  assert.equal(normalizeRiskScore01(82), 0.82)
})

test("preprocessRiskStageJson entfernt null confidence und normalisiert Strings", () => {
  const raw = {
    findings: [
      {
        category: "x",
        title: "T",
        description: "D",
        severity: "mittel",
        confidence: null
      },
      {
        category: "y",
        title: "T2",
        description: "D2",
        severity: "hoch",
        confidence: "85%"
      }
    ],
    riskScore01: 0.4,
    recommendedMeasures: ["a"],
    negotiationHints: ["b"],
    explanationSummary: "ok",
    aggregateConfidence: "90"
  }
  const normalized = preprocessRiskStageJson(raw)
  const parsed = riskAndGuidanceStageSchema.safeParse(normalized)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.findings[0]?.confidence, undefined)
    assert.equal(parsed.data.findings[1]?.confidence, 0.85)
    assert.equal(parsed.data.aggregateConfidence, 0.9)
  }
})

test("normalizeConfidence01", () => {
  assert.equal(normalizeConfidence01(null), undefined)
  assert.equal(normalizeConfidence01("75%"), 0.75)
  assert.equal(normalizeConfidence01(82), 0.82)
})
