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

test("wählt Gemini für lange Dokumente", () => {
  const result = selectOptimalModel({
    documentId: "2",
    analysisType: AnalysisType.SUMMARY,
    documentLength: 60000
  })

  assert.equal(result, ModelType.GEMINI_2_5_PRO)
})

test("wählt GPT-4o-mini für kurze Zusammenfassung", () => {
  const result = selectOptimalModel({
    documentId: "3",
    analysisType: AnalysisType.SUMMARY,
    documentLength: 1500
  })

  assert.equal(result, ModelType.GPT_4O_MINI)
})
