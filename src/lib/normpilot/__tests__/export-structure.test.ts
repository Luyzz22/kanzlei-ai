import test from "node:test"
import assert from "node:assert/strict"

import { NORMPILOT_AI_NOTICE, NORMPILOT_NORM_LICENSE_NOTICE } from "@/lib/normpilot/constants"
import {
  buildNormPilotEvidencePackExport,
  normPilotEvidencePackExportSchema
} from "@/lib/normpilot/export-structure"

const hash = "b".repeat(64)

test("Evidence Pack export structure includes compliance notices and review state", () => {
  const pack = buildNormPilotEvidencePackExport({
    requirementSet: {
      id: "req-set-1",
      title: "Audit Evidence Sprint",
      frameworkLabel: "Kundeneigene Checkliste",
      reviewState: "IN_PRUEFUNG"
    },
    requirements: [
      {
        id: "req-1",
        code: "QMS-001",
        title: "Pruefberichte auffindbar",
        normReferenceCode: "ISO9001:8.6",
        reviewState: "UNGEPRUEFT"
      }
    ],
    evidenceMatrix: [
      {
        requirementCode: "QMS-001",
        evidenceSourceTitle: "Synthetischer Pruefbericht",
        status: "COVERED",
        confidence: 0.8,
        locator: { page: 2, anchorHash: hash },
        anchorText: "PB-2026-001, Seite 2",
        evidenceHash: hash,
        reviewState: "IN_PRUEFUNG"
      }
    ],
    gaps: [
      {
        requirementCode: "QMS-002",
        severity: "MEDIUM",
        title: "Schulungsnachweis fehlt",
        description: "Synthetischer Gap ohne Kundendaten.",
        reviewState: "UNGEPRUEFT"
      }
    ],
    correctiveActions: [
      {
        title: "Schulungsnachweis nachreichen",
        ownerRole: "QM",
        ownerLabel: "Rollenplatzhalter",
        status: "PLANNED",
        reviewState: "UNGEPRUEFT"
      }
    ],
    promptMetadata: {
      promptKeys: ["normpilot.evidence_mapping.default"],
      promptVersions: ["2026-06-08"],
      providerLabels: ["mock"],
      modelLabels: ["synthetic"]
    },
    generatedAt: new Date("2026-06-08T00:00:00.000Z")
  })

  assert.equal(pack.aiNotice, NORMPILOT_AI_NOTICE)
  assert.equal(pack.compliance.euAiActRiskClass, "limited_risk")
  assert.equal(pack.compliance.normLicenseNotice, NORMPILOT_NORM_LICENSE_NOTICE)
  assert.equal(normPilotEvidencePackExportSchema.safeParse(pack).success, true)
})
