#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const failures = []

const normPilotTables = [
  "NormPilotRequirementSet",
  "NormPilotRequirementItem",
  "NormPilotEvidenceSource",
  "NormPilotEvidenceMapping",
  "NormPilotGapFinding",
  "NormPilotCorrectiveAction",
  "NormPilotEvidencePackExport"
]

const tenantCoreFiles = [
  "requirement-core.ts",
  "evidence-core.ts",
  "matrix-core.ts",
  "gap-core.ts",
  "action-core.ts",
  "review-core.ts",
  "export-core.ts",
  "sprint-core.ts"
]

const providerCallPatterns = [
  /\bgenerateText\s*\(/,
  /\bstreamText\s*\(/,
  /\bgenerateObject\s*\(/,
  /\bstreamObject\s*\(/,
  /\bnew\s+OpenAI\s*\(/,
  /\bopenai\./,
  /\banthropic\.messages\b/,
  /\bGoogleGenerativeAI\s*\(/
]

const providerUrlFragments = [
  "https://api.openai.com",
  "https://api.anthropic.com",
  "https://generativelanguage.googleapis.com"
]

const normFullTextPatterns = [
  /\bthe organization shall\b/i,
  /\bshall\s+(establish|determine|maintain|provide|retain|ensure)\b/i,
  /\bdie organisation muss\b/i,
  /\bdas unternehmen muss\b/i
]

const forbiddenAuditMetadataParts = [
  "anchor",
  "customer",
  "description",
  "documentTitle",
  "evidenceExcerpt",
  "fullText",
  "normText",
  "ownerLabel",
  "recommendation",
  "sourceSummary",
  "text",
  "title"
]

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8")
}

async function collectFiles(relativeDir, matcher = () => true) {
  const entries = await readdir(path.join(root, relativeDir), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(relativePath, matcher))
    else if (matcher(relativePath)) files.push(relativePath)
  }
  return files
}

function fail(message) {
  failures.push(message)
  console.error(`not ok - ${message}`)
}

function pass(message) {
  console.log(`ok - ${message}`)
}

async function assertRls() {
  const source = await read("db/rls.sql")
  for (const table of normPilotTables) {
    if (!source.includes(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)) {
      fail(`${table} does not enable RLS`)
      continue
    }
    const policyIndex = source.indexOf(`CREATE POLICY tenant_isolation_`, source.indexOf(`ALTER TABLE "${table}"`))
    if (policyIndex === -1) {
      fail(`${table} tenant isolation policy missing`)
      continue
    }
    const block = source.slice(policyIndex, policyIndex + 500)
    if (!block.includes(`ON "${table}"`)) fail(`${table} RLS policy targets a different table`)
    if (!block.includes('USING ("tenantId" = current_tenant_id())')) fail(`${table} RLS USING guard missing`)
    if (!block.includes('WITH CHECK ("tenantId" = current_tenant_id())')) fail(`${table} RLS WITH CHECK guard missing`)
  }
  pass("NormPilot RLS policies cover all tenant-bound tables")
}

async function assertTenantIsolation() {
  for (const file of tenantCoreFiles) {
    const source = await read(`src/lib/normpilot/${file}`)
    if (!source.includes("withTenant(")) fail(`${file} does not use withTenant`)
    if (!source.includes("tenantId")) fail(`${file} does not include tenantId filters`)
    if (/findUnique\(\{\s*where:\s*\{\s*id:/.test(source)) fail(`${file} uses findUnique by id only`)
  }
  pass("NormPilot server core files retain tenant-isolation invariants")
}

async function assertAuditMetadataAllowlist() {
  const files = await collectFiles("src/lib/normpilot", (file) => file.endsWith(".ts"))
  let auditWriterCount = 0
  for (const file of files) {
    const source = await read(file)
    if (!source.includes("writeAuditEventTx")) continue
    auditWriterCount += 1
    if (!source.includes("buildNormPilotAuditMetadata")) {
      fail(`${file} writes audit events without metadata allowlist helper`)
    }
    if (/metadata:\s*\{/.test(source)) fail(`${file} contains inline audit metadata object`)
  }
  if (auditWriterCount === 0) fail("No NormPilot audit event writers found")

  const helper = await read("src/lib/normpilot/audit-metadata.ts")
  for (const part of forbiddenAuditMetadataParts) {
    if (!helper.includes(`"${part}"`)) fail(`audit metadata forbidden key part missing: ${part}`)
  }
  pass("NormPilot audit metadata is allowlist-gated")
}

async function assertExportAndUiNotices() {
  const constants = await read("src/lib/normpilot/constants.ts")
  const exportStructure = await read("src/lib/normpilot/export-structure.ts")
  const exportCore = await read("src/lib/normpilot/export-core.ts")
  const ui = await read("src/app/dashboard/normpilot/_components/normpilot-panels.tsx")

  if (!constants.includes("NORMPILOT_AI_NOTICE")) fail("AI notice constant missing")
  if (!constants.includes("NORMPILOT_NORM_LICENSE_NOTICE")) fail("norm license notice constant missing")
  if (!exportStructure.includes("normLicenseNotice")) fail("export structure omits norm license notice")
  if (!exportCore.includes("buildNormPilotEvidencePackMarkdown")) fail("markdown export builder missing")
  if (!exportCore.includes("buildNormPilotEvidenceMatrixCsv")) fail("evidence matrix CSV builder missing")
  if (!exportCore.includes("buildNormPilotGapCsv")) fail("gap CSV builder missing")
  if (!ui.includes("NORMPILOT_AI_NOTICE") || !ui.includes("NORMPILOT_NORM_LICENSE_NOTICE")) {
    fail("NormPilot dashboard does not render AI and norm license notices")
  }
  pass("NormPilot export and dashboard notices are present")
}

async function assertNoProviderCalls() {
  const files = [
    ...await collectFiles("src/lib/normpilot", (file) => file.endsWith(".ts")),
    ...await collectFiles("src/app/dashboard/normpilot", (file) => file.endsWith(".ts") || file.endsWith(".tsx"))
  ]
  for (const file of files) {
    const source = await read(file)
    for (const pattern of providerCallPatterns) {
      if (pattern.test(source)) fail(`${file} contains provider-call pattern ${pattern}`)
    }
    for (const fragment of providerUrlFragments) {
      if (source.includes(fragment)) fail(`${file} contains provider URL fragment ${fragment}`)
    }
  }
  pass("NormPilot code remains free of productive provider calls")
}

async function assertNoNormFullTextFixtures() {
  const files = [
    ...await collectFiles("evals/normpilot", (file) => file.endsWith(".json") || file.endsWith(".md")),
    ...await collectFiles("docs/normpilot-industrie", (file) => file.endsWith(".md"))
  ]

  for (const file of files) {
    const source = await read(file)
    for (const pattern of normFullTextPatterns) {
      if (pattern.test(source)) fail(`${file} contains norm-fulltext-like fixture pattern ${pattern}`)
    }
    source.split("\n").forEach((line, index) => {
      if (line.length > 1600) fail(`${file}:${index + 1} contains an unusually long line`)
    })
    const fileStat = await stat(path.join(root, file))
    if (fileStat.size > 80_000) fail(`${file} is too large for synthetic pilot material`)
  }
  pass("NormPilot docs and evals avoid obvious norm-fulltext fixtures")
}

await assertRls()
await assertTenantIsolation()
await assertAuditMetadataAllowlist()
await assertExportAndUiNotices()
await assertNoProviderCalls()
await assertNoNormFullTextFixtures()

if (failures.length > 0) {
  console.error(`\nNormPilot smoke failed with ${failures.length} issue(s).`)
  process.exit(1)
}

console.log("\nNormPilot smoke passed.")
