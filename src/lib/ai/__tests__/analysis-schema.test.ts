import test from "node:test"
import assert from "node:assert/strict"

import {
  extractionStageSchema,
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
