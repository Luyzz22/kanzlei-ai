import test from "node:test"
import assert from "node:assert/strict"

import {
  normPilotEvidenceMappingSchema,
  normPilotEvidenceSourceSchema,
  normPilotGapFindingSchema,
  normPilotRequirementItemSchema,
  normPilotRequirementSetSchema
} from "@/lib/normpilot/schemas"

const hash = "a".repeat(64)

test("NormPilot requirement schemas validate customer-owned checklist data", () => {
  const set = normPilotRequirementSetSchema.safeParse({
    title: "Audit Evidence Sprint Checkliste",
    frameworkLabel: "Kundeneigene ISO-9001-nahe Checkliste",
    sourceKind: "customer_checklist",
    contentHash: hash
  })
  assert.equal(set.success, true)

  const item = normPilotRequirementItemSchema.safeParse({
    requirementSetId: "req-set-1",
    code: "QMS-001",
    title: "Pruefberichte muessen auffindbar sein",
    customerText: "Interne Checklistenanforderung ohne Norm-Volltext.",
    normReferenceCode: "ISO9001:8.6",
    criticality: "HIGH"
  })
  assert.equal(item.success, true)
})

test("NormPilot evidence mapping stores short anchors only", () => {
  const valid = normPilotEvidenceMappingSchema.safeParse({
    requirementItemId: "req-item-1",
    evidenceSourceId: "source-1",
    status: "PARTIAL",
    confidence: 0.99,
    anchorText: "Pruefbericht PB-2026-001, Seite 2",
    locator: { page: 2, sectionKey: "inspection-summary" },
    evidenceHash: hash
  })
  assert.equal(valid.success, true)
  if (valid.success) {
    assert.equal(valid.data.confidence, 0.98)
  }

  const invalid = normPilotEvidenceMappingSchema.safeParse({
    requirementItemId: "req-item-1",
    status: "COVERED",
    anchorText: "x".repeat(281)
  })
  assert.equal(invalid.success, false)
})

test("NormPilot source and gap schemas reject invalid enum values", () => {
  const source = normPilotEvidenceSourceSchema.safeParse({
    sourceType: "pdf",
    title: "Synthetischer Pruefbericht",
    sourceHash: hash,
    locator: { page: 1 }
  })
  assert.equal(source.success, true)

  const gap = normPilotGapFindingSchema.safeParse({
    requirementSetId: "req-set-1",
    severity: "EXTREME",
    title: "Unbekannte Severity",
    description: "Soll nicht akzeptiert werden."
  })
  assert.equal(gap.success, false)
})
