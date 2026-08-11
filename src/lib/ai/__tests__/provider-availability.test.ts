import test from "node:test"
import assert from "node:assert/strict"

import { filterModelsByAvailability, getAvailableModelTypes } from "@/lib/ai/provider-availability"
import { ModelType } from "@/types/ai"

test("ohne API-Keys sind keine Modelle verfügbar", () => {
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.GEMINI_API_KEY
  delete process.env.LLAMA_API_KEY
  delete process.env.LLAMA_API_BASE

  assert.deepEqual(getAvailableModelTypes(), [])
  assert.deepEqual(
    filterModelsByAvailability([ModelType.GPT_4O_MINI, ModelType.CLAUDE_SONNET_4]),
    []
  )
})

test("gesetzter OPENAI_API_KEY macht GPT NICHT verfügbar (ADR-0001)", () => {
  process.env.OPENAI_API_KEY = "sk-x"
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.GEMINI_API_KEY
  delete process.env.LLAMA_API_KEY
  delete process.env.LLAMA_API_BASE

  const avail = getAvailableModelTypes()
  assert.equal(avail.includes(ModelType.GPT_4O_MINI), false)
  assert.equal(avail.length, 0)
})

test("gesetzter GEMINI_API_KEY macht Gemini NICHT verfügbar (ADR-0001)", () => {
  process.env.GEMINI_API_KEY = "AIza-x"
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.LLAMA_API_KEY
  delete process.env.LLAMA_API_BASE

  const avail = getAvailableModelTypes()
  assert.equal(avail.includes(ModelType.GEMINI_2_5_PRO), false)
  assert.equal(avail.length, 0)
})
