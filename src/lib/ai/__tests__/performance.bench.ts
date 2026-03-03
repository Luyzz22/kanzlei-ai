import test from "node:test"
import assert from "node:assert/strict"

import { calculateCost } from "@/lib/ai/cost-tracker"
import { ModelType } from "@/types/ai"

test("Kostenberechnung bleibt performant bei 10k Iterationen", () => {
  const start = performance.now()
  let sum = 0

  for (let i = 0; i < 10_000; i += 1) {
    sum += calculateCost(ModelType.GPT_4O_MINI, 2500)
  }

  const duration = performance.now() - start
  assert.ok(sum > 0)
  assert.ok(duration < 200)
})
