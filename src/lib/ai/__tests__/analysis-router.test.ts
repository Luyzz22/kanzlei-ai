import test from "node:test"
import assert from "node:assert/strict"

import {
  buildModelExecutionPlan,
  selectOptimalModel,
  selectPrimaryModelForStage,
  type RouterContext
} from "@/lib/ai/analysis-router"
import { AnalysisType, ModelType } from "@/types/ai"

const baseCtx = (len: number): RouterContext => ({ documentLength: len })

test("EXTRACTION: kurzes Dokument bevorzugt GPT-4o-mini wenn OpenAI konfiguriert", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.OPENAI_API_KEY = "sk-test"
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.GEMINI_API_KEY
  delete process.env.LLAMA_API_KEY
  delete process.env.LLAMA_API_BASE

  const plan = buildModelExecutionPlan("EXTRACTION", baseCtx(3000))
  assert.ok(plan.includes(ModelType.GPT_4O_MINI))
  assert.equal(plan[0], ModelType.GPT_4O_MINI)
})

test("RISK_AND_GUIDANCE: Standard bevorzugt Claude wenn Anthropic konfiguriert", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.ANTHROPIC_API_KEY = "sk-ant-test"
  process.env.OPENAI_API_KEY = "sk-oai"
  process.env.GEMINI_API_KEY = "gem"

  const plan = buildModelExecutionPlan("RISK_AND_GUIDANCE", baseCtx(5000))
  assert.equal(plan[0], ModelType.CLAUDE_SONNET_4)
})

test("EXTRACTION: langes Dokument nutzt Gemini wenn verfügbar", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.GEMINI_API_KEY = "g"
  process.env.OPENAI_API_KEY = "o"
  process.env.ANTHROPIC_API_KEY = "a"

  const primary = selectPrimaryModelForStage("EXTRACTION", baseCtx(80_000))
  assert.equal(primary, ModelType.GEMINI_2_5_PRO)
})

test("Vertragsanalyse (Legacy): langer Vertrag bleibt bei Claude", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  const m = selectOptimalModel({
    documentId: "x",
    analysisType: AnalysisType.CONTRACT,
    documentLength: 120_000
  })
  assert.equal(m, ModelType.CLAUDE_SONNET_4)
})

test("Llama-Priorität bei AI_SENSITIVE_USE_LLAMA", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.AI_SENSITIVE_USE_LLAMA = "true"
  process.env.LLAMA_API_KEY = "k"
  process.env.LLAMA_API_BASE = "https://example.com"
  process.env.OPENAI_API_KEY = "o"

  const primary = selectPrimaryModelForStage("EXTRACTION", { documentLength: 1000, preferLocalOrPrivate: true })
  assert.equal(primary, ModelType.LLAMA_COMPAT)
})
