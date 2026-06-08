import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { Role, TenantRole } from "@prisma/client"

import {
  canCreateNormPilotDraft,
  canExportNormPilot,
  canManageNormPilot,
  canTransitionNormPilotReviewState
} from "@/lib/normpilot/access"
import {
  buildNormPilotEvidenceMatrixCsv,
  buildNormPilotEvidencePackMarkdown
} from "@/lib/normpilot/export-core"
import { buildNormPilotEvidencePackExport } from "@/lib/normpilot/export-structure"

const root = process.cwd()

test("NormPilot role guards allow MEMBER drafts but restrict approval/export", () => {
  const member = {
    actorId: "user-member",
    platformRole: Role.ASSISTENT,
    tenantRole: TenantRole.MEMBER
  }
  const owner = {
    actorId: "user-owner",
    platformRole: Role.ADMIN,
    tenantRole: TenantRole.OWNER
  }

  assert.equal(canCreateNormPilotDraft(member), true)
  assert.equal(canManageNormPilot(member), false)
  assert.equal(canExportNormPilot(member), false)
  assert.equal(canTransitionNormPilotReviewState({ actor: member, nextState: "IN_PRUEFUNG" }), true)
  assert.equal(canTransitionNormPilotReviewState({ actor: member, nextState: "FREIGEGEBEN" }), false)
  assert.equal(canExportNormPilot(owner), true)
  assert.equal(canTransitionNormPilotReviewState({ actor: owner, nextState: "ZURUECKGEWIESEN" }), true)
})

test("NormPilot export markdown and CSV include compliance notices and review state", () => {
  const manifest = buildNormPilotEvidencePackExport({
    requirementSet: {
      id: "req-set-1",
      title: "Synthetisches Evidence Pack",
      frameworkLabel: "Kundeneigene Checkliste",
      reviewState: "IN_PRUEFUNG"
    },
    requirements: [
      {
        id: "req-1",
        code: "QMS-001",
        title: "Pruefbericht auffindbar",
        reviewState: "UNGEPRUEFT"
      }
    ],
    evidenceMatrix: [
      {
        requirementCode: "QMS-001",
        evidenceSourceTitle: "Synthetischer Pruefbericht",
        status: "PARTIAL",
        confidence: 0.64,
        reviewState: "UNGEPRUEFT"
      }
    ],
    gaps: [
      {
        requirementCode: "QMS-001",
        severity: "MEDIUM",
        title: "Nachweis pruefen",
        description: "Synthetischer Gap ohne Norm-Volltext.",
        reviewState: "UNGEPRUEFT"
      }
    ],
    correctiveActions: [
      {
        title: "Nachweis ergaenzen",
        ownerRole: "QM",
        status: "DRAFT",
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

  const markdown = buildNormPilotEvidencePackMarkdown(manifest)
  const csv = buildNormPilotEvidenceMatrixCsv(manifest)

  assert.match(markdown, /KI-generiert/)
  assert.match(markdown, /Keine proprietaeren Norm-Volltexte/)
  assert.match(markdown, /UNGEPRUEFT/)
  assert.match(markdown, /normpilot\.evidence_mapping\.default/)
  assert.match(csv, /QMS-001/)
  assert.equal(markdown.toLowerCase().includes("iso 9001 shall"), false)
})

test("NormPilot server core files use withTenant and explicit tenant filters", async () => {
  const files = [
    "requirement-core.ts",
    "evidence-core.ts",
    "matrix-core.ts",
    "gap-core.ts",
    "action-core.ts",
    "review-core.ts",
    "export-core.ts",
    "sprint-core.ts"
  ]

  for (const file of files) {
    const source = await readFile(path.join(root, "src/lib/normpilot", file), "utf8")
    assert.match(source, /withTenant\(/, `${file} must use withTenant`)
    assert.match(source, /tenantId/, `${file} must include explicit tenantId filters`)
    assert.equal(/findUnique\(\{\s*where:\s*\{\s*id:/.test(source), false, `${file} must not findUnique by id only`)
  }
})

test("NormPilot mock sprint persistence stays mock-only and audits draft outputs", async () => {
  const source = await readFile(path.join(root, "src/lib/normpilot/sprint-core.ts"), "utf8")

  assert.match(source, /runNormPilotPipeline\(/)
  assert.match(source, /\{\s*mock:\s*true\s*\}/)
  assert.match(source, /normpilot\.evidence\.mapped|evidenceMapped/)
  assert.match(source, /normpilot\.gap\.generated|gapGenerated/)
  assert.match(source, /normpilot\.corrective_action\.drafted|correctiveActionDrafted/)
  assert.equal(source.includes("generateText"), false)
  assert.equal(source.includes("streamText"), false)
})
