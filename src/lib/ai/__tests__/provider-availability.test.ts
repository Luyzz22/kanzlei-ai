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

test("nur OpenAI gesetzt liefert GPT in der Verfügbarkeitsliste", () => {
  process.env.OPENAI_API_KEY = "sk-x"
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.GEMINI_API_KEY
  delete process.env.LLAMA_API_KEY
  delete process.env.LLAMA_API_BASE

  const avail = getAvailableModelTypes()
  assert.ok(avail.includes(ModelType.GPT_4O_MINI))
  assert.equal(avail.length, 1)
})
