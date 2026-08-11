import test from "node:test"
import assert from "node:assert/strict"

import {
  buildModelExecutionPlan,
  getFallbackChainForStage,
  selectOptimalModel,
  selectPrimaryModelForStage,
  type RouterContext
} from "@/lib/ai/analysis-router"
import { AnalysisType, ModelType } from "@/types/ai"

const baseCtx = (len: number): RouterContext => ({ documentLength: len })

test("evalPrimaryByStage kann keinen stillgelegten Provider wiederbeleben (ADR-0001)", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.OPENAI_API_KEY = "sk-oai"
  process.env.ANTHROPIC_API_KEY = "sk-ant"
  process.env.GEMINI_API_KEY = "gem"

  // Ein Eval-Override ist ein Bequemlichkeits-Feature und darf die
  // Anbieter-Freigabe nicht aushebeln — sonst wäre er ein Compliance-Bypass.
  const plan = buildModelExecutionPlan("EXTRACTION", {
    documentLength: 3000,
    evalPrimaryByStage: { EXTRACTION: ModelType.GEMINI_2_5_PRO }
  })
  assert.equal(plan.includes(ModelType.GEMINI_2_5_PRO), false)
  assert.equal(plan.includes(ModelType.GPT_4O_MINI), false)
  assert.ok(plan.every((m) => m === ModelType.CLAUDE_SONNET_4 || m === ModelType.LLAMA_COMPAT))
})

test("EXTRACTION: gesetzter OpenAI-Key erzeugt keinen GPT-Plan mehr (ADR-0001)", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.OPENAI_API_KEY = "sk-test"
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.GEMINI_API_KEY
  delete process.env.LLAMA_API_KEY
  delete process.env.LLAMA_API_BASE

  const plan = buildModelExecutionPlan("EXTRACTION", baseCtx(3000))
  assert.equal(plan.includes(ModelType.GPT_4O_MINI), false)
  assert.equal(plan.includes(ModelType.GEMINI_2_5_PRO), false)
})

test("RISK_AND_GUIDANCE: Standard bevorzugt Claude wenn Anthropic konfiguriert", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.ANTHROPIC_API_KEY = "sk-ant-test"
  process.env.OPENAI_API_KEY = "sk-oai"
  process.env.GEMINI_API_KEY = "gem"

  const plan = buildModelExecutionPlan("RISK_AND_GUIDANCE", baseCtx(5000))
  assert.equal(plan[0], ModelType.CLAUDE_SONNET_4)
})

test("EXTRACTION: langes Dokument bleibt bei Claude, auch mit Gemini-Key (ADR-0001)", () => {
  process.env.AI_ROUTER_ENABLED = "true"
  process.env.GEMINI_API_KEY = "g"
  process.env.OPENAI_API_KEY = "o"
  process.env.ANTHROPIC_API_KEY = "a"

  const primary = selectPrimaryModelForStage("EXTRACTION", baseCtx(80_000))
  assert.equal(primary, ModelType.CLAUDE_SONNET_4)
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

test("lokales Modell fällt NICHT auf einen Cloud-Provider zurück (Invariante 3)", () => {
  // Lokal wird gewählt, weil die Daten sensibel sind. Ein Ausweichen nach
  // extern wäre ein Sicherheits-Downgrade — die Kette muss leer sein.
  assert.deepEqual(getFallbackChainForStage(ModelType.LLAMA_COMPAT), [])
})

test("externes Modell darf auf das lokale zurückfallen", () => {
  const chain = getFallbackChainForStage(ModelType.CLAUDE_SONNET_4)
  assert.deepEqual(chain, [ModelType.LLAMA_COMPAT])
  assert.equal(chain.includes(ModelType.GPT_4O_MINI), false)
  assert.equal(chain.includes(ModelType.GEMINI_2_5_PRO), false)
})
