import test from "node:test"
import assert from "node:assert/strict"

import {
  extractionStageSchema,
  parseJsonUnknown,
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
