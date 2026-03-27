import test from "node:test"
import assert from "node:assert/strict"

import { parseModelTypeList } from "@/lib/evals/eval-model-matrix"
import { ModelType } from "@/types/ai"

test("parseModelTypeList erkennt Enum-Werte und Aliasse", () => {
  const a = parseModelTypeList("gpt-4o-mini, claude-sonnet-4")
  assert.deepEqual(a, [ModelType.GPT_4O_MINI, ModelType.CLAUDE_SONNET_4])
  const b = parseModelTypeList("gemini;openai")
  assert.ok(b.includes(ModelType.GEMINI_2_5_PRO))
  assert.ok(b.includes(ModelType.GPT_4O_MINI))
})

test("parseModelTypeList dedupliziert", () => {
  const a = parseModelTypeList("gpt-4o-mini,gpt-4o-mini")
  assert.equal(a.length, 1)
})
