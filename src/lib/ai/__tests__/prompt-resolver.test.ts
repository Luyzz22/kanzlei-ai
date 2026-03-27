import test from "node:test"
import assert from "node:assert/strict"

import { createRegistryOnlyContractPromptResolver } from "@/lib/ai/analysis-pipeline"
import { CONTRACT_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/schemas/contract-analysis"
import {
  CONTRACT_EXTRACTION_PROMPT_KEY,
  CONTRACT_RISK_PROMPT_KEY
} from "@/lib/ai/prompt-registry/contract-defaults"

test("Registry-Resolver liefert stabile Keys und Versionen ohne DB", async () => {
  const r = createRegistryOnlyContractPromptResolver()
  const norm = "Kurzer Mustertext."
  const ext = await r.resolveExtraction(norm)
  assert.equal(ext.key, CONTRACT_EXTRACTION_PROMPT_KEY)
  assert.equal(ext.version, CONTRACT_ANALYSIS_PROMPT_VERSION)
  assert.ok(ext.text.includes(norm))
  assert.equal(ext.source, "registry_default")

  const risk = await r.resolveRisk(norm, '{"contractType":"X"}', "X")
  assert.equal(risk.key, CONTRACT_RISK_PROMPT_KEY)
  assert.equal(risk.version, CONTRACT_ANALYSIS_PROMPT_VERSION)
  assert.ok(risk.text.includes("X"))
})
