/**
 * Vertragsanalyse-Evals: lädt JSON-Fälle aus evals/contracts/cases/.
 *
 * EVAL_MOCK=true — synthetische Pipeline-Ergebnisse (CI).
 * Modell-Matrix: EVAL_MODEL_MATRIX oder --matrix=gpt-4o-mini,claude-sonnet-4,...
 * Persistenz: --persist und EVAL_PERSIST_DB=1 sowie DATABASE_URL → EvalRun + EvalResultRow
 *
 * Optional: --out=reports/contract-eval.json  --name=Laufname
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  createRegistryOnlyContractPromptResolver,
  runContractAnalysisPipeline,
  type ContractPipelineSuccess
} from "@/lib/ai/analysis-pipeline"
import { assertAnyProviderConfigured, type RouterContext } from "@/lib/ai/analysis-router"
import {
  type ContractEvalCaseFile,
  buildSyntheticEvalPipelineSuccess,
  scoreContractEvalCase,
  type ContractEvalMetrics
} from "@/lib/evals/contract-eval-runner"
import {
  modelTypeToProviderKind,
  parseModelTypeList,
  providerKindToShortLabel
} from "@/lib/evals/eval-model-matrix"
import { persistContractEvalRun } from "@/lib/evals/persist-eval-run"
import { prisma } from "@/lib/prisma"
import { ModelType } from "@/types/ai"
import type { Prisma } from "@prisma/client"

async function loadCases(dir: string): Promise<ContractEvalCaseFile[]> {
  let names: string[] = []
  try {
    names = await readdir(dir)
  } catch {
    return []
  }
  const jsonFiles = names.filter((n) => n.endsWith(".json"))
  const cases: ContractEvalCaseFile[] = []
  for (const name of jsonFiles) {
    const raw = await readFile(path.join(dir, name), "utf8")
    const parsed = JSON.parse(raw) as ContractEvalCaseFile
    if (parsed?.id && typeof parsed.documentText === "string") {
      cases.push(parsed)
    }
  }
  return cases.sort((a, b) => a.id.localeCompare(b.id))
}

function parseArgs(argv: string[]): {
  outPath: string | null
  matrixCsv: string | null
  persist: boolean
  name: string | null
} {
  let outPath: string | null = null
  let matrixCsv: string | null = null
  let persist = false
  let name: string | null = null
  for (const a of argv) {
    if (a.startsWith("--out=")) outPath = a.slice("--out=".length).trim() || null
    else if (a.startsWith("--matrix=")) matrixCsv = a.slice("--matrix=".length).trim() || null
    else if (a.startsWith("--name=")) name = a.slice("--name=".length).trim() || null
    else if (a === "--persist") persist = true
  }
  return { outPath, matrixCsv, persist, name }
}

function labelsFromPipeline(result: ContractPipelineSuccess): {
  providerLabel: string
  modelLabel: string
  promptVersion: string
} {
  return {
    providerLabel: providerKindToShortLabel(modelTypeToProviderKind(result.primaryModel)),
    modelLabel: String(result.primaryModel),
    promptVersion: result.promptMetadata.extractionVersion
  }
}

type RowOut = {
  caseId: string
  metrics: ContractEvalMetrics
  passed: boolean
  providerLabel: string | null
  modelLabel: string | null
  promptVersion: string | null
  costEstimate: number
  latencyMs: number
}

function failedMetrics(latencyMs: number): ContractEvalMetrics {
  return {
    schemaValidExtraction: false,
    schemaValidRisk: false,
    extractionCompleteness01: 0,
    fieldAccuracy01: 0,
    findingPrecision01: 0,
    findingRecall01: 0,
    refusalOrError: true,
    latencyMs,
    costEstimate: 0,
    passed: false
  }
}

async function runCasesForVariant(
  variant: ModelType | null,
  evalCases: ContractEvalCaseFile[],
  mock: boolean,
  routerBase: RouterContext
): Promise<RowOut[]> {
  const ctx: RouterContext =
    variant != null
      ? {
          ...routerBase,
          evalPrimaryByStage: { EXTRACTION: variant, RISK_AND_GUIDANCE: variant }
        }
      : routerBase

  const resolver = createRegistryOnlyContractPromptResolver()
  const rows: RowOut[] = []

  for (const c of evalCases) {
    const t0 = Date.now()
    if (mock) {
      const result = buildSyntheticEvalPipelineSuccess(c.documentText)
      const latencyMs = Date.now() - t0
      const metrics = scoreContractEvalCase(c, result, latencyMs)
      rows.push({
        caseId: c.id,
        metrics,
        passed: metrics.passed,
        providerLabel: variant != null ? providerKindToShortLabel(modelTypeToProviderKind(variant)) : "MOCK",
        modelLabel: variant != null ? String(variant) : "registry-synthetic",
        promptVersion: result.promptMetadata.extractionVersion,
        costEstimate: result.totalCost,
        latencyMs
      })
      continue
    }

    try {
      assertAnyProviderConfigured()
    } catch {
      console.error("Kein Provider konfiguriert. Setzen Sie EVAL_MOCK=true oder API-Keys.")
      throw new Error("NO_PROVIDER")
    }

    try {
      const result = await runContractAnalysisPipeline(c.documentText, ctx, resolver)
      const latencyMs = Date.now() - t0
      const metrics = scoreContractEvalCase(c, result, latencyMs)
      const lb = labelsFromPipeline(result)
      rows.push({
        caseId: c.id,
        metrics,
        passed: metrics.passed,
        providerLabel: lb.providerLabel,
        modelLabel: lb.modelLabel,
        promptVersion: lb.promptVersion,
        costEstimate: result.totalCost,
        latencyMs
      })
    } catch (e) {
      const latencyMs = Date.now() - t0
      console.error("Case", c.id, "Fehler:", e instanceof Error ? e.message : e)
      rows.push({
        caseId: c.id,
        metrics: failedMetrics(latencyMs),
        passed: false,
        providerLabel: variant != null ? providerKindToShortLabel(modelTypeToProviderKind(variant)) : null,
        modelLabel: variant != null ? String(variant) : null,
        promptVersion: null,
        costEstimate: 0,
        latencyMs
      })
    }
  }

  return rows
}

async function main() {
  const mock = process.env.EVAL_MOCK === "true" || process.env.EVAL_MOCK === "1"
  const args = parseArgs(process.argv.slice(2))
  const matrixRaw = args.matrixCsv ?? process.env.EVAL_MODEL_MATRIX ?? ""
  const parsedMatrix = parseModelTypeList(matrixRaw.trim() || undefined)

  if (matrixRaw.trim() && parsedMatrix.length === 0) {
    console.error("Keine gültigen Modell-Token in Matrix:", matrixRaw)
    process.exitCode = 1
    return
  }

  const variants: (ModelType | null)[] = parsedMatrix.length > 0 ? parsedMatrix : [null]

  const outPath = args.outPath
  const casesDir = path.join(process.cwd(), "evals", "contracts", "cases")
  const evalCases = await loadCases(casesDir)
  if (!evalCases.length) {
    console.error("Keine Eval-Fälle in", casesDir)
    process.exitCode = 1
    return
  }

  const routerBase: RouterContext = {
    documentLength: 12_000,
    mimeType: "text/plain",
    preferLocalOrPrivate: false
  }

  const variantReports: Array<{
    variantModel: string | null
    providerLabel: string | null
    passedCount: number
    caseCount: number
    passRate01: number
    rows: RowOut[]
  }> = []

  try {
    for (const variant of variants) {
      const rows = await runCasesForVariant(variant, evalCases, mock, routerBase)
      const passedCount = rows.filter((r) => r.passed).length
      const caseCount = rows.length
      variantReports.push({
        variantModel: variant != null ? String(variant) : "router-default",
        providerLabel: rows[0]?.providerLabel ?? null,
        passedCount,
        caseCount,
        passRate01: caseCount > 0 ? passedCount / caseCount : 0,
        rows
      })
    }
  } catch (e) {
    if (e instanceof Error && e.message === "NO_PROVIDER") {
      process.exitCode = 1
      return
    }
    throw e
  }

  const flatRows = variantReports.flatMap((vr) =>
    vr.rows.map((r) => ({
      caseId: r.caseId,
      providerLabel: r.providerLabel,
      modelLabel: r.modelLabel,
      promptVersion: r.promptVersion,
      metrics: { ...r.metrics, variantModel: vr.variantModel } as Record<string, unknown>,
      passed: r.passed,
      latencyMs: r.latencyMs,
      costEstimate: r.costEstimate
    }))
  )

  const totalPassed = flatRows.filter((r) => r.passed).length
  const totalCells = flatRows.length

  const ranking = [...variantReports]
    .map((v) => ({
      variantModel: v.variantModel,
      passRate01: v.passRate01,
      passedCount: v.passedCount,
      caseCount: v.caseCount
    }))
    .sort((a, b) => b.passRate01 - a.passRate01)

  const report = {
    generatedAt: new Date().toISOString(),
    evalMock: mock,
    matrix: variants.map((v) => (v != null ? String(v) : "router-default")),
    caseCount: evalCases.length,
    variantCount: variantReports.length,
    totalCells,
    passedCount: totalPassed,
    passRate01: totalCells > 0 ? totalPassed / totalCells : 0,
    ranking,
    variants: variantReports.map((v) => ({
      variantModel: v.variantModel,
      providerLabel: v.providerLabel,
      passedCount: v.passedCount,
      caseCount: v.caseCount,
      passRate01: v.passRate01,
      rows: v.rows.map((r) => ({ caseId: r.caseId, passed: r.passed, metrics: r.metrics }))
    }))
  }

  const json = JSON.stringify(report, null, 2)
  console.log(json)

  if (outPath) {
    const abs = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath)
    await mkdir(path.dirname(abs), { recursive: true })
    await writeFile(abs, json, "utf8")
  }

  const failMin = Number.parseFloat(process.env.EVAL_MIN_PASS_RATE ?? "1")
  const rate = report.passRate01
  const overallPassed = rate >= failMin

  if (rate < failMin) {
    console.error(`Eval-Mindestrate nicht erreicht: ${rate.toFixed(3)} < ${failMin}`)
    process.exitCode = 1
  }

  const persistRequested = args.persist || process.env.EVAL_PERSIST_DB === "1"
  if (persistRequested) {
    const runName =
      (args.name ?? process.env.EVAL_RUN_NAME ?? "").trim() || `contract-evals-${report.generatedAt.slice(0, 10)}`
    const evaluatorName = (process.env.EVAL_EVALUATOR_NAME ?? process.env.GITHUB_ACTOR ?? "local").slice(0, 64)
    try {
      const { id } = await persistContractEvalRun({
        name: runName,
        evaluatorName,
        overallPassed,
        reportJson: report as Prisma.InputJsonValue,
        configSnapshot: {
          evalMock: mock,
          matrix: report.matrix,
          evalMinPassRate: failMin
        } as Prisma.InputJsonValue,
        rows: flatRows
      })
      console.error(`EvalRun persistiert: id=${id}`)
    } catch (err) {
      console.error("Persistenz fehlgeschlagen:", err instanceof Error ? err.message : err)
      process.exitCode = 1
    } finally {
      await prisma.$disconnect().catch(() => {})
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
