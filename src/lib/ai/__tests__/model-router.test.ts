import test from "node:test"
import assert from "node:assert/strict"

import { selectOptimalModel } from "@/lib/ai/model-router"
import { AnalysisType, ModelType } from "@/types/ai"

test("wählt Claude für Vertragsanalyse", () => {
  const result = selectOptimalModel({
    documentId: "1",
    analysisType: AnalysisType.CONTRACT,
    documentLength: 12000
  })

  assert.equal(result, ModelType.CLAUDE_SONNET_4)
})

test("lange Dokumente gehen an Claude statt Gemini (ADR-0001)", () => {
  const result = selectOptimalModel({
    documentId: "2",
    analysisType: AnalysisType.SUMMARY,
    documentLength: 60000
  })

  assert.equal(result, ModelType.CLAUDE_SONNET_4)
})

test("kurze Zusammenfassung geht an Claude statt GPT (ADR-0001)", () => {
  const result = selectOptimalModel({
    documentId: "3",
    analysisType: AnalysisType.SUMMARY,
    documentLength: 1500
  })

  assert.equal(result, ModelType.CLAUDE_SONNET_4)
})
