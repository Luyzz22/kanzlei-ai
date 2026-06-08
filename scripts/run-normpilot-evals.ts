import { readdir, readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

import { runNormPilotPipeline } from "@/lib/normpilot/pipeline"
import type { NormPilotPipelineInput } from "@/lib/normpilot/pipeline-types"

type NormPilotEvalCaseFile = {
  id: string
  displayName?: string
  documentText?: string
  requirementSet?: NormPilotPipelineInput["requirementSet"]
  requirements?: NormPilotPipelineInput["requirements"]
  evidenceSources?: NormPilotPipelineInput["evidenceSources"]
  governance?: NormPilotPipelineInput["governance"]
  input?: Record<string, unknown>
  expected?: {
    minRequirements?: number
    minEvidenceMappings?: number
    minGaps?: number
    minCorrectiveActions?: number
    requiredStatuses?: string[]
    requiredGapSeverities?: string[]
    requiredActionStatus?: string
    requiredReviewState?: string
    status?: string
    reviewState?: string
    maxAnchorLength?: number
    mustIncludeAiNotice?: boolean
    mustIncludeNormLicenseNotice?: boolean
    treatDocumentTextAsData?: boolean
    mustNotReturnNormFullText?: boolean
    fallbackNotice?: string
    policyAllowed?: boolean
    policySeverity?: string
    pseudonymizationRequired?: boolean
  }
}

type NormPilotEvalRow = {
  caseId: string
  displayName: string
  passed: boolean
  checks: Record<string, boolean>
  promptKeys: string[]
  promptVersions: string[]
  policy: {
    allowed: boolean
    severity: string
    pseudonymizationRequired: boolean
    thirdCountryTransfer: boolean
  }
}

function parseArgs(argv: string[]): { outPath: string | null } {
  const out = argv.find((arg) => arg.startsWith("--out="))
  return { outPath: out ? out.slice("--out=".length).trim() || null : null }
}

async function loadCases(dir: string): Promise<NormPilotEvalCaseFile[]> {
  const names = await readdir(dir).catch(() => [])
  const cases: NormPilotEvalCaseFile[] = []
  for (const name of names.filter((n) => n.endsWith(".json")).sort()) {
    const raw = await readFile(path.join(dir, name), "utf8")
    const parsed = JSON.parse(raw) as NormPilotEvalCaseFile
    if (parsed.id) cases.push(parsed)
  }
  return cases
}

function fallbackRequirementSet(evalCase: NormPilotEvalCaseFile): NormPilotPipelineInput["requirementSet"] {
  return {
    title: evalCase.displayName ?? evalCase.id,
    frameworkLabel: "Synthetische Kundeneigene Checkliste",
    sourceKind: "customer_checklist"
  }
}

function fallbackRequirements(evalCase: NormPilotEvalCaseFile): NormPilotPipelineInput["requirements"] {
  const input = evalCase.input ?? {}
  const requirementCode = typeof input.requirementCode === "string" ? input.requirementCode : "QMS-001"
  return [
    {
      code: requirementCode,
      title: "Synthetische pruefbare Anforderung",
      customerText: "Kundeneigene Kurzanforderung ohne Norm-Volltext.",
      criticality: "MEDIUM"
    }
  ]
}

function fallbackEvidenceSources(evalCase: NormPilotEvalCaseFile): NormPilotPipelineInput["evidenceSources"] {
  const input = evalCase.input ?? {}
  const title =
    typeof input.evidenceSourceTitle === "string"
      ? input.evidenceSourceTitle
      : "Synthetische Evidence Source"
  const sourceType = typeof input.sourceType === "string" ? input.sourceType : "pdf"
  const locator = typeof input.locator === "object" && input.locator !== null ? input.locator : undefined
  return [
    {
      sourceType,
      title,
      locator
    }
  ]
}

function toPipelineInput(evalCase: NormPilotEvalCaseFile): NormPilotPipelineInput {
  const input = evalCase.input ?? {}
  return {
    caseId: evalCase.id,
    syntheticOrAnonymized: true,
    documentText:
      evalCase.documentText ??
      (typeof input.documentText === "string" ? input.documentText : undefined),
    requirementSet: evalCase.requirementSet ?? fallbackRequirementSet(evalCase),
    requirements: evalCase.requirements ?? fallbackRequirements(evalCase),
    evidenceSources: evalCase.evidenceSources ?? fallbackEvidenceSources(evalCase),
    governance: evalCase.governance,
    generatedAt: new Date("2026-06-08T00:00:00.000Z")
  }
}

function includesAll(actual: string[], required: string[] | undefined): boolean {
  if (!required?.length) return true
  return required.every((value) => actual.includes(value))
}

function scoreCase(evalCase: NormPilotEvalCaseFile, result: Awaited<ReturnType<typeof runNormPilotPipeline>>): NormPilotEvalRow {
  const expected = evalCase.expected ?? {}
  const statuses: string[] = result.mapping.mappings.map((m) => m.status)
  const severities: string[] = result.gapAnalysis.gaps.map((g) => g.severity)
  const actions = result.correctiveActionDraft.correctiveActions
  const anchors = [
    ...result.extraction.candidates.map((c) => c.anchorText),
    ...result.mapping.mappings.map((m) => m.anchorText)
  ].filter((value): value is string => typeof value === "string")

  const checks: Record<string, boolean> = {
    minRequirements:
      expected.minRequirements == null ||
      result.evidencePackSummary.evidencePack.requirements.length >= expected.minRequirements,
    minEvidenceMappings:
      expected.minEvidenceMappings == null || result.mapping.mappings.length >= expected.minEvidenceMappings,
    minGaps: expected.minGaps == null || result.gapAnalysis.gaps.length >= expected.minGaps,
    minCorrectiveActions:
      expected.minCorrectiveActions == null || actions.length >= expected.minCorrectiveActions,
    requiredStatuses: includesAll(statuses, expected.requiredStatuses),
    requiredGapSeverities: includesAll(severities, expected.requiredGapSeverities),
    requiredActionStatus:
      expected.requiredActionStatus == null ||
      actions.every((action) => action.status === expected.requiredActionStatus),
    requiredReviewState:
      expected.requiredReviewState == null ||
      [
        ...result.mapping.mappings.map((m) => m.reviewState),
        ...result.gapAnalysis.gaps.map((g) => g.reviewState),
        ...actions.map((a) => a.reviewState)
      ].every((state) => state === expected.requiredReviewState),
    status: expected.status == null || statuses.includes(expected.status),
    reviewState:
      expected.reviewState == null ||
      result.mapping.mappings.some((mapping) => mapping.reviewState === expected.reviewState),
    maxAnchorLength:
      expected.maxAnchorLength == null || anchors.every((anchor) => anchor.length <= expected.maxAnchorLength!),
    mustIncludeAiNotice:
      expected.mustIncludeAiNotice !== true ||
      result.evidencePackSummary.evidencePack.aiNotice.length > 0,
    mustIncludeNormLicenseNotice:
      expected.mustIncludeNormLicenseNotice !== true ||
      result.evidencePackSummary.evidencePack.compliance.normLicenseNotice.length > 0,
    treatDocumentTextAsData:
      expected.treatDocumentTextAsData !== true || result.mapping.mappings.some((m) => m.status === "NEEDS_REVIEW"),
    mustNotReturnNormFullText:
      expected.mustNotReturnNormFullText !== true ||
      !JSON.stringify(result).toLowerCase().includes("proprietary norm text"),
    fallbackNotice:
      expected.fallbackNotice == null ||
      result.gapAnalysis.fallbackNotice === expected.fallbackNotice ||
      result.gapAnalysis.gaps.some((gap) => gap.description.includes(expected.fallbackNotice!)),
    policyAllowed: expected.policyAllowed == null || result.policy.allowed === expected.policyAllowed,
    policySeverity: expected.policySeverity == null || result.policy.severity === expected.policySeverity,
    pseudonymizationRequired:
      expected.pseudonymizationRequired == null ||
      result.policy.pseudonymizationRequired === expected.pseudonymizationRequired
  }

  return {
    caseId: evalCase.id,
    displayName: evalCase.displayName ?? evalCase.id,
    passed: Object.values(checks).every(Boolean),
    checks,
    promptKeys: result.evidencePackSummary.evidencePack.promptMetadata?.promptKeys ?? [],
    promptVersions: result.evidencePackSummary.evidencePack.promptMetadata?.promptVersions ?? [],
    policy: {
      allowed: result.policy.allowed,
      severity: result.policy.severity,
      pseudonymizationRequired: result.policy.pseudonymizationRequired,
      thirdCountryTransfer: result.policy.thirdCountryTransfer
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const casesDir = path.join(process.cwd(), "evals", "normpilot", "cases")
  const cases = await loadCases(casesDir)
  const rows: NormPilotEvalRow[] = []

  for (const evalCase of cases) {
    const result = await runNormPilotPipeline(toPipelineInput(evalCase), { mock: true })
    rows.push(scoreCase(evalCase, result))
  }

  const passedCount = rows.filter((row) => row.passed).length
  const report = {
    generatedAt: new Date().toISOString(),
    evalMock: true,
    caseCount: rows.length,
    passedCount,
    passRate01: rows.length > 0 ? passedCount / rows.length : 0,
    rows
  }

  if (args.outPath) {
    await mkdir(path.dirname(args.outPath), { recursive: true })
    await writeFile(args.outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  }

  console.log(JSON.stringify(report, null, 2))
  if (passedCount !== rows.length) {
    process.exitCode = 1
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
