import test from "node:test"
import assert from "node:assert/strict"

import { classificationFieldsForDb, CLASSIFICATION_DB_VARCHAR } from "../classification-db-fields"

// --- null / undefined tolerance (PR #78 regression) ---

test("returns all-null for null input", () => {
  const result = classificationFieldsForDb(null)
  assert.deepEqual(result, {
    contractClassification: null,
    partyConstellation: null,
    agbKontrolleAnwendbar: null,
  })
})

test("returns all-null for undefined input", () => {
  const result = classificationFieldsForDb(undefined)
  assert.deepEqual(result, {
    contractClassification: null,
    partyConstellation: null,
    agbKontrolleAnwendbar: null,
  })
})

test("returns null contractClassification when field itself is null (legacy payload)", () => {
  // TypeScript allows casting here to simulate a malformed payload at runtime
  const input = { contractClassification: null as unknown as string, partyConstellation: undefined, agbKontrolleAnwendbar: null }
  const result = classificationFieldsForDb(input)
  assert.equal(result.contractClassification, null)
})

test("returns null contractClassification when field is undefined (legacy payload)", () => {
  const input = { contractClassification: undefined as unknown as string, partyConstellation: undefined, agbKontrolleAnwendbar: null }
  const result = classificationFieldsForDb(input)
  assert.equal(result.contractClassification, null)
})

test("returns null contractClassification when field is empty string", () => {
  const input = { contractClassification: "", partyConstellation: undefined, agbKontrolleAnwendbar: null }
  const result = classificationFieldsForDb(input)
  assert.equal(result.contractClassification, null)
})

// --- normal cases ---

test("slices contractClassification to VARCHAR limit", () => {
  const long = "A".repeat(CLASSIFICATION_DB_VARCHAR + 20)
  const result = classificationFieldsForDb({
    contractClassification: long,
    partyConstellation: undefined,
    agbKontrolleAnwendbar: null,
  })
  assert.equal(result.contractClassification?.length, CLASSIFICATION_DB_VARCHAR)
})

test("slices partyConstellation to VARCHAR limit", () => {
  const long = "B".repeat(CLASSIFICATION_DB_VARCHAR + 10)
  const result = classificationFieldsForDb({
    contractClassification: "Kaufvertrag",
    partyConstellation: long,
    agbKontrolleAnwendbar: null,
  })
  assert.equal(result.partyConstellation?.length, CLASSIFICATION_DB_VARCHAR)
})

test("passes through short values unchanged", () => {
  const input = {
    contractClassification: "Kaufvertrag",
    partyConstellation: "B2B",
    agbKontrolleAnwendbar: true,
  }
  const result = classificationFieldsForDb(input)
  assert.equal(result.contractClassification, "Kaufvertrag")
  assert.equal(result.partyConstellation, "B2B")
  assert.equal(result.agbKontrolleAnwendbar, true)
})

test("passes through agbKontrolleAnwendbar false", () => {
  const result = classificationFieldsForDb({
    contractClassification: "NDA",
    partyConstellation: undefined,
    agbKontrolleAnwendbar: false,
  })
  assert.equal(result.agbKontrolleAnwendbar, false)
})

test("returns null partyConstellation when field is absent", () => {
  const result = classificationFieldsForDb({
    contractClassification: "NDA",
    partyConstellation: undefined,
    agbKontrolleAnwendbar: null,
  })
  assert.equal(result.partyConstellation, null)
})
