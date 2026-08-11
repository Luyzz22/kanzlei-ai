import test from "node:test"
import assert from "node:assert/strict"

import { createProvider, RetiredProviderError } from "@/lib/ai/providers/registry"
import { isModelTypeRetired } from "@/lib/ai/provider-availability"
import { ModelType } from "@/types/ai"

test("stillgelegte Provider lassen sich nicht instanziieren (ADR-0001)", () => {
  for (const model of [ModelType.GPT_4O_MINI, ModelType.GEMINI_2_5_PRO]) {
    assert.equal(isModelTypeRetired(model), true, `${model} sollte stillgelegt sein`)
    assert.throws(() => createProvider(model), RetiredProviderError)
  }
})

test("gesetzter Provider-Key hebt die Stilllegung nicht auf", () => {
  process.env.OPENAI_API_KEY = "sk-x"
  process.env.GEMINI_API_KEY = "AIza-x"
  try {
    assert.throws(() => createProvider(ModelType.GPT_4O_MINI), RetiredProviderError)
    assert.throws(() => createProvider(ModelType.GEMINI_2_5_PRO), RetiredProviderError)
  } finally {
    delete process.env.OPENAI_API_KEY
    delete process.env.GEMINI_API_KEY
  }
})

test("unbekannter ModelType fällt nicht still auf einen Anbieter zurück", () => {
  assert.throws(
    () => createProvider("nicht-existent" as ModelType),
    RetiredProviderError,
    "default-Zweig muss werfen statt einen beliebigen Provider zu liefern"
  )
})

test("zugelassene Provider bleiben instanziierbar", () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-x"
  try {
    assert.ok(createProvider(ModelType.CLAUDE_SONNET_4))
    assert.ok(createProvider(ModelType.LLAMA_COMPAT))
  } finally {
    delete process.env.ANTHROPIC_API_KEY
  }
})
