import assert from "node:assert/strict"
import test from "node:test"
import { z } from "zod"
import { stageJsonSchema } from "../stage-json-schema"
import { classificationStageSchema, extractionStageSchema } from "../schemas/contract-analysis"

test("provider schema preserves bounded coercions, arrays and closed objects", () => {
  const classification = stageJsonSchema(classificationStageSchema) as {
    additionalProperties: boolean
    properties: Record<string, Record<string, unknown>>
  }
  assert.equal(classification.additionalProperties, false)
  assert.deepEqual(classification.properties.classificationConfidence, { type: "number", minimum: 0, maximum: 1 })
  assert.equal(classification.properties.contractClassification.maxLength, 120)
  const extraction = stageJsonSchema(extractionStageSchema) as { properties: Record<string, Record<string, unknown>> }
  assert.equal(extraction.properties.parties.maxItems, 20)
  assert.equal(extraction.properties.legalTopics.maxItems, 24)
  assert.equal(stageJsonSchema(classificationStageSchema), classification)
})

test("runtime validation keeps numeric coercion and the confidence ceiling", () => {
  const input = { contractClassification: "Synthetic", classificationConfidence: "1" }
  assert.equal(classificationStageSchema.parse(input).classificationConfidence, 0.98)
  assert.equal(classificationStageSchema.safeParse({ ...input, classificationConfidence: 2 }).success, false)
  assert.equal(classificationStageSchema.safeParse({ ...input, contractClassification: "x".repeat(121) }).success, false)
})

test("oversized arrays reject before visiting attacker-controlled elements", () => {
  const input = new Array(21)
  Object.defineProperty(input, 0, { get() { throw new Error("oversized element visited") } })
  const schema = z.array(z.object({ name: z.string() })).max(20)
  assert.equal(schema.safeParse(input).success, false)
  assert.deepEqual(schema.parse([{ name: "Synthetic" }]), [{ name: "Synthetic" }])
})

test("unrepresentable schemas retain the existing provider fallback", () => {
  assert.equal(stageJsonSchema(z.date()), undefined)
})
