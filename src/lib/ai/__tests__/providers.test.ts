import test from "node:test"
import assert from "node:assert/strict"

import { ModelType } from "@/types/ai"
import { BaseAIProvider } from "@/lib/ai/providers/types"

class MockProvider extends BaseAIProvider {
  constructor() {
    super({ apiKey: "test", model: ModelType.GPT_4O_MINI, maxRetries: 3 })
  }

  async analyze(): Promise<never> {
    throw new Error("Nicht genutzt")
  }

  async *stream(): AsyncGenerator<string> {
    yield "chunk"
  }
}

test("estimateTokens funktioniert deterministisch", () => {
  const provider = new MockProvider()
  assert.equal(provider.estimateTokens("12345678"), 2)
})

test("parseJsonSafely fällt bei invalidem JSON auf rawText zurück", () => {
  const provider = new MockProvider() as MockProvider & {
    parseJsonSafely: (text: string) => Record<string, unknown>
  }
  const parsed = provider.parseJsonSafely("kein-json")
  assert.equal(parsed.rawText, "kein-json")
})
