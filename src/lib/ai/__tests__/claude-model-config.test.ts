import test from "node:test"
import assert from "node:assert/strict"

import {
  ANTHROPIC_SAFE_MAX_OUTPUT_TOKENS,
  anthropicBetaHeaders
} from "@/lib/ai/claude-model-config"

test("anthropicBetaHeaders: kein Beta für Sonnet 4.5 bei 64k", () => {
  const prev = process.env.ANTHROPIC_CHAT_MODEL
  process.env.ANTHROPIC_CHAT_MODEL = "claude-sonnet-4-5-20250929"
  try {
    assert.equal(anthropicBetaHeaders(64_000), undefined)
    assert.equal(anthropicBetaHeaders(32_768), undefined)
    assert.equal(anthropicBetaHeaders(ANTHROPIC_SAFE_MAX_OUTPUT_TOKENS), undefined)
  } finally {
    if (prev === undefined) delete process.env.ANTHROPIC_CHAT_MODEL
    else process.env.ANTHROPIC_CHAT_MODEL = prev
  }
})

test("anthropicBetaHeaders: 128k-Beta nur für Sonnet 4.6 über Safe-Limit", () => {
  const prev = process.env.ANTHROPIC_CHAT_MODEL
  process.env.ANTHROPIC_CHAT_MODEL = "claude-sonnet-4-6-20260217"
  try {
    assert.deepEqual(anthropicBetaHeaders(64_000), {
      "anthropic-beta": "output-128k-2025-02-19"
    })
    assert.equal(anthropicBetaHeaders(32_768), undefined)
  } finally {
    if (prev === undefined) delete process.env.ANTHROPIC_CHAT_MODEL
    else process.env.ANTHROPIC_CHAT_MODEL = prev
  }
})
