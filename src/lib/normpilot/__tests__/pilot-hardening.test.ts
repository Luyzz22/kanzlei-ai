import test from "node:test"
import assert from "node:assert/strict"
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

import {
  buildNormPilotAuditMetadata,
  isNormPilotAuditMetadataKeyAllowed
} from "@/lib/normpilot/audit-metadata"
import {
  buildNormPilotEvidenceMatrixCsv,
  buildNormPilotEvidencePackMarkdown,
  buildNormPilotGapCsv
} from "@/lib/normpilot/export-core"
import { buildNormPilotEvidencePackExport } from "@/lib/normpilot/export-structure"

const root = process.cwd()

async function collectFiles(relativeDir: string, matcher: (file: string) => boolean): Promise<string[]> {
  const entries = await readdir(path.join(root, relativeDir), { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(relativePath, matcher))
    } else if (matcher(relativePath)) {
      files.push(relativePath)
    }
  }
  return files
}

async function read(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8")
}

test("NormPilot audit metadata allowlist accepts IDs/counts/status and rejects text-bearing keys", () => {
  const metadata = buildNormPilotAuditMetadata({
    requirementSetId: "req-set-1",
    itemCount: 3,
    status: "GENERATED",
    reviewState: "UNGEPRUEFT",
    severity: "MEDIUM",
    format: "MARKDOWN",
    promptKey: "normpilot.evidence_mapping.default",
    promptVersion: "2026-06-08",
    contentHash: "f".repeat(64),
    errorCode: null
  })

  assert.deepEqual(metadata, {
    requirementSetId: "req-set-1",
    itemCount: 3,
    status: "GENERATED",
    reviewState: "UNGEPRUEFT",
    severity: "MEDIUM",
    format: "MARKDOWN",
    promptKey: "normpilot.evidence_mapping.default",
    promptVersion: "2026-06-08",
    contentHash: "f".repeat(64),
    errorCode: null
  })

  assert.equal(isNormPilotAuditMetadataKeyAllowed("ownerLabel"), false)
  assert.equal(isNormPilotAuditMetadataKeyAllowed("anchorText"), false)
  assert.throws(() => buildNormPilotAuditMetadata({ ownerLabel: "QM Leitung" } as never), /not allowed/)
  assert.throws(() => buildNormPilotAuditMetadata({ title: "Dokumenttitel" } as never), /not allowed/)
  assert.throws(() => buildNormPilotAuditMetadata({ errorCode: "x".repeat(180) }), /too long/)
})

test("NormPilot audit writers use the central metadata allowlist helper", async () => {
  const files = await collectFiles("src/lib/normpilot", (file) => file.endsWith(".ts") && !file.includes("__tests__"))
  let writerCount = 0

  for (const file of files) {
    const source = await read(file)
    if (!source.includes("writeAuditEventTx")) continue
    writerCount += 1
    assert.match(source, /buildNormPilotAuditMetadata/, `${file} must import/use audit metadata allowlist`)
    assert.equal(/metadata:\s*\{/.test(source), false, `${file} must not write inline audit metadata`)
  }

  assert.ok(writerCount > 0)
})

test("NormPilot tenant isolation and RLS invariants remain present", async () => {
  const rls = await read("db/rls.sql")
  const tables = [
    "NormPilotRequirementSet",
    "NormPilotRequirementItem",
    "NormPilotEvidenceSource",
    "NormPilotEvidenceMapping",
    "NormPilotGapFinding",
    "NormPilotCorrectiveAction",
    "NormPilotEvidencePackExport"
  ]

  for (const table of tables) {
    const tableIndex = rls.indexOf(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
    assert.notEqual(tableIndex, -1, `${table} must enable RLS`)
    const policyIndex = rls.indexOf("CREATE POLICY tenant_isolation_", tableIndex)
    assert.notEqual(policyIndex, -1, `${table} must define a tenant isolation policy`)
    const block = rls.slice(policyIndex, policyIndex + 500)
    assert.match(block, new RegExp(`ON "${table}"`))
    assert.match(block, /USING \("tenantId" = current_tenant_id\(\)\)/)
    assert.match(block, /WITH CHECK \("tenantId" = current_tenant_id\(\)\)/)
  }

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
    const source = await read(path.join("src/lib/normpilot", file))
    assert.match(source, /withTenant\(/, `${file} must use withTenant`)
    assert.match(source, /tenantId/, `${file} must include tenantId filters`)
    assert.equal(/findUnique\(\{\s*where:\s*\{\s*id:/.test(source), false, `${file} must not findUnique by id only`)
  }
})

test("NormPilot exports keep AI, norm license and bounded-copy notices visible", () => {
  const manifest = buildNormPilotEvidencePackExport({
    requirementSet: {
      id: "req-set-1",
      title: "Synthetisches Evidence Pack",
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
        anchorText: "Kurzer synthetischer Anchor ohne Kundentext.",
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
  const matrixCsv = buildNormPilotEvidenceMatrixCsv(manifest)
  const gapCsv = buildNormPilotGapCsv(manifest)

  assert.match(markdown, /KI-generiert/)
  assert.match(markdown, /Keine proprietaeren Norm-Volltexte/)
  assert.match(markdown, /UNGEPRUEFT/)
  assert.match(markdown, /Prompt-Metadaten/)
  assert.match(matrixCsv, /Review-State/)
  assert.match(gapCsv, /Review-State/)
  assert.equal(markdown.toLowerCase().includes("the organization shall"), false)
  assert.equal(manifest.evidenceMatrix[0].anchorText!.length <= 280, true)
})

test("NormPilot code and fixtures avoid provider calls, norm fulltexts and long copies", async () => {
  const sourceFiles = [
    ...await collectFiles("src/lib/normpilot", (file) => file.endsWith(".ts") && !file.includes("__tests__")),
    ...await collectFiles("src/app/dashboard/normpilot", (file) => file.endsWith(".ts") || file.endsWith(".tsx"))
  ]
  const providerPatterns = [
    /\bgenerateText\s*\(/,
    /\bstreamText\s*\(/,
    /\bgenerateObject\s*\(/,
    /\bstreamObject\s*\(/,
    /\bnew\s+OpenAI\s*\(/,
    /\bopenai\./,
    /\banthropic\.messages\b/,
    /\bGoogleGenerativeAI\s*\(/,
    /https:\/\/api\.openai\.com/,
    /https:\/\/api\.anthropic\.com/,
    /https:\/\/generativelanguage\.googleapis\.com/
  ]

  for (const file of sourceFiles) {
    const source = await read(file)
    for (const pattern of providerPatterns) {
      assert.equal(pattern.test(source), false, `${file} must not contain provider-call pattern ${pattern}`)
    }
  }

  const fixtureFiles = [
    ...await collectFiles("evals/normpilot", (file) => file.endsWith(".json") || file.endsWith(".md")),
    ...await collectFiles("docs/normpilot-industrie", (file) => file.endsWith(".md"))
  ]
  const normFullTextPatterns = [
    /\bthe organization shall\b/i,
    /\bshall\s+(establish|determine|maintain|provide|retain|ensure)\b/i,
    /\bdie organisation muss\b/i,
    /\bdas unternehmen muss\b/i
  ]

  for (const file of fixtureFiles) {
    const source = await read(file)
    for (const pattern of normFullTextPatterns) {
      assert.equal(pattern.test(source), false, `${file} must not contain norm-fulltext-like pattern ${pattern}`)
    }
    for (const [index, line] of source.split("\n").entries()) {
      assert.equal(line.length <= 1600, true, `${file}:${index + 1} has an unusually long line`)
    }
    const fileStat = await stat(path.join(root, file))
    assert.equal(fileStat.size <= 80_000, true, `${file} is too large for synthetic pilot material`)
  }
})
