import "server-only"

import { randomUUID } from "node:crypto"

import {
  type AnalysisRun,
  AnalysisPipelineStageName,
  AnalysisRunStatus,
  DocumentFindingSeverity,
  Prisma
} from "@prisma/client"

import { assertAnyProviderConfigured, type RouterContext } from "@/lib/ai/analysis-router"
import {
  PipelineStageFailureError,
  runContractAnalysisPipeline,
  type ContractPipelineSuccess
} from "@/lib/ai/analysis-pipeline"
import { CONTRACT_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/schemas/contract-analysis"
import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

function severityFromLiteral(s: "niedrig" | "mittel" | "hoch"): DocumentFindingSeverity {
  if (s === "niedrig") return DocumentFindingSeverity.NIEDRIG
  if (s === "hoch") return DocumentFindingSeverity.HOCH
  return DocumentFindingSeverity.MITTEL
}

export type RunContractAnalysisResult =
  | { ok: true; runId: string }
  | {
      ok: false
      code:
        | "NOT_FOUND"
        | "FORBIDDEN"
        | "NO_TEXT"
        | "NO_PROVIDER"
        | "PIPELINE_ERROR"
        | "TENANT_MISMATCH"
        | "ALREADY_RUNNING"
      message: string
    }

export type WorkbenchAiContractAnalysis = {
  run: Pick<
    AnalysisRun,
    | "id"
    | "status"
    | "startedAt"
    | "completedAt"
    | "primaryProvider"
    | "primaryModel"
    | "routerSummary"
    | "riskScore01"
    | "aggregateConfidence"
    | "structuredOutputValid"
    | "errorCode"
    | "fallbackReason"
    | "validationErrorSummary"
  >
  extraction: {
    contractType: string
    parties: unknown
    term: unknown
    legalTopics: unknown
  } | null
  findings: Array<{
    id: string
    title: string
    description: string
    severity: DocumentFindingSeverity
    category: string
    confidence: number | null
  }>
  risk: {
    recommendedMeasures: string[]
    negotiationHints: string[]
    explanationSummary: string
  } | null
}

export async function getWorkbenchAiContractAnalysis(
  tenantId: string,
  actorId: string,
  documentId: string
): Promise<WorkbenchAiContractAnalysis | null> {
  return withTenant(tenantId, async (tx) => {
    const member = await tx.tenantMember.findFirst({
      where: { tenantId, userId: actorId },
      select: { id: true }
    })
    if (!member) return null

    const doc = await tx.document.findFirst({
      where: { id: documentId, tenantId },
      select: { id: true }
    })
    if (!doc) return null

    const run = await tx.analysisRun.findFirst({
      where: { tenantId, documentId },
      orderBy: { startedAt: "desc" },
      include: {
        extraction: true,
        findings: {
          orderBy: { createdAt: "asc" },
          take: 50
        }
      }
    })

    if (!run) return null

    const measures = parseStringArrayJson(run.recommendedMeasures)
    const hints = parseStringArrayJson(run.negotiationHints)
    const hasRiskPayload = run.status === AnalysisRunStatus.COMPLETED && run.structuredOutputValid

    return {
      run: {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        primaryProvider: run.primaryProvider,
        primaryModel: run.primaryModel,
        routerSummary: run.routerSummary,
        riskScore01: run.riskScore01,
        aggregateConfidence: run.aggregateConfidence,
        structuredOutputValid: run.structuredOutputValid,
        errorCode: run.errorCode,
        fallbackReason: run.fallbackReason,
        validationErrorSummary: run.validationErrorSummary
      },
      extraction: run.extraction
        ? {
            contractType: run.extraction.contractType,
            parties: run.extraction.parties,
            term: run.extraction.term,
            legalTopics: run.extraction.legalTopics
          }
        : null,
      findings: run.findings.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        severity: f.severity,
        category: f.category,
        confidence: f.confidence
      })),
      risk: hasRiskPayload
        ? {
            recommendedMeasures: measures,
            negotiationHints: hints,
            explanationSummary: run.explanationSummary ?? ""
          }
        : null
    }
  })
}

function parseStringArrayJson(value: Prisma.JsonValue | null | undefined): string[] {
  if (!value || !Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === "string")
}

type RunInput = {
  tenantId: string
  documentId: string
  actorId: string
  documentText: string
  documentSha256?: string | null
}

export async function runPersistedContractAnalysis(input: RunInput): Promise<RunContractAnalysisResult> {
  const text = input.documentText.trim()
  if (!text) {
    return { ok: false, code: "NO_TEXT", message: "Für die KI-Analyse liegt keine Textgrundlage vor." }
  }

  try {
    assertAnyProviderConfigured()
  } catch {
    return {
      ok: false,
      code: "NO_PROVIDER",
      message: "Es ist kein KI-Anbieter konfiguriert. Bitte mindestens einen API-Schlüssel hinterlegen."
    }
  }

  const runId = randomUUID()
  const wallStart = Date.now()

  const preflight = await withTenant(input.tenantId, async (tx) => {
    const member = await tx.tenantMember.findFirst({
      where: { tenantId: input.tenantId, userId: input.actorId },
      select: { id: true }
    })
    if (!member) return { ok: false as const, code: "FORBIDDEN" as const }

    const doc = await tx.document.findFirst({
      where: { id: input.documentId, tenantId: input.tenantId },
      select: { id: true, sha256: true, mimeType: true }
    })
    if (!doc) return { ok: false as const, code: "NOT_FOUND" as const }

    const running = await tx.analysisRun.findFirst({
      where: {
        tenantId: input.tenantId,
        documentId: input.documentId,
        status: AnalysisRunStatus.RUNNING
      },
      select: { id: true }
    })
    if (running) {
      return { ok: false as const, code: "ALREADY_RUNNING" as const }
    }

    await tx.analysisRun.create({
      data: {
        id: runId,
        tenantId: input.tenantId,
        documentId: input.documentId,
        userId: input.actorId,
        status: AnalysisRunStatus.RUNNING,
        promptVersion: CONTRACT_ANALYSIS_PROMPT_VERSION,
        documentContentHash: input.documentSha256 ?? doc.sha256 ?? null
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "analysis.pipeline.started",
      resourceType: "analysisRun",
      resourceId: runId,
      documentId: input.documentId,
      metadata: {
        promptVersion: CONTRACT_ANALYSIS_PROMPT_VERSION
      } satisfies Prisma.InputJsonValue
    })

    return { ok: true as const, mimeType: doc.mimeType }
  })

  if (!preflight.ok) {
    if (preflight.code === "FORBIDDEN") {
      return { ok: false, code: "FORBIDDEN", message: "Keine Berechtigung für diese Mandantenressource." }
    }
    if (preflight.code === "ALREADY_RUNNING") {
      return {
        ok: false,
        code: "ALREADY_RUNNING",
        message: "Für dieses Dokument läuft bereits eine KI-Analyse. Bitte warten Sie auf den Abschluss."
      }
    }
    return { ok: false, code: "NOT_FOUND", message: "Dokument im Mandanten nicht gefunden." }
  }

  const routerCtx: RouterContext = {
    documentLength: text.length,
    mimeType: preflight.mimeType ?? undefined,
    preferLocalOrPrivate: process.env.AI_SENSITIVE_USE_LLAMA === "true"
  }

  let pipeline: ContractPipelineSuccess
  try {
    pipeline = await runContractAnalysisPipeline(text, routerCtx)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unbekannter Fehler"
    const errCode = e instanceof PipelineStageFailureError ? "PIPELINE_STAGE_FAILED" : "PIPELINE_FAILED"

    await withTenant(input.tenantId, async (tx) => {
      await tx.analysisRun.update({
        where: { id: runId },
        data: {
          status: AnalysisRunStatus.FAILED,
          completedAt: new Date(),
          errorCode: errCode,
          fallbackReason: message.slice(0, 4000),
          durationMs: Date.now() - wallStart
        }
      })
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: "analysis.pipeline.failed",
        resourceType: "analysisRun",
        resourceId: runId,
        documentId: input.documentId,
        metadata: { errorCode: errCode, message: message.slice(0, 2000) } satisfies Prisma.InputJsonValue
      })
    })

    return { ok: false, code: "PIPELINE_ERROR", message: "Die KI-Analyse konnte nicht abgeschlossen werden." }
  }

  const durationMs = Date.now() - wallStart

  await withTenant(input.tenantId, async (tx) => {
    await tx.analysisRun.update({
      where: { id: runId },
      data: {
        status: AnalysisRunStatus.COMPLETED,
        completedAt: new Date(),
        primaryProvider: pipeline.primaryProvider,
        primaryModel: pipeline.primaryModel,
        routerSummary: pipeline.routerSummary,
        fallbackModelKeys: pipeline.fallbackModelKeys as Prisma.InputJsonValue,
        structuredOutputValid: true,
        aggregateConfidence: pipeline.aggregateConfidence,
        riskScore01: pipeline.risk.riskScore01,
        inputTextHash: pipeline.inputTextHash,
        totalTokensUsed: pipeline.totalTokens,
        totalCostEstimate: pipeline.totalCost,
        durationMs,
        recommendedMeasures: pipeline.risk.recommendedMeasures as Prisma.InputJsonValue,
        negotiationHints: pipeline.risk.negotiationHints as Prisma.InputJsonValue,
        explanationSummary: pipeline.risk.explanationSummary
      }
    })

    await tx.analysisProviderDecision.createMany({
      data: pipeline.stageLogs.map((l) => ({
        analysisRunId: runId,
        stage: l.stage,
        attemptOrder: l.attemptOrder,
        provider: l.provider,
        model: l.model,
        selectionReason: l.selectionReason,
        wasPrimaryChoice: l.wasPrimaryChoice,
        wasSuccessful: l.wasSuccessful,
        fallbackFromProvider: l.fallbackFromProvider,
        latencyMs: l.latencyMs,
        tokensUsed: l.tokensUsed,
        errorCode: l.errorCode,
        structuredValid: l.structuredValid
      }))
    })

    await tx.documentExtraction.create({
      data: {
        tenantId: input.tenantId,
        documentId: input.documentId,
        analysisRunId: runId,
        contractType: pipeline.extraction.contractType,
        parties: pipeline.extraction.parties as Prisma.InputJsonValue,
        term: pipeline.extraction.term as Prisma.InputJsonValue,
        legalTopics: pipeline.extraction.legalTopics as Prisma.InputJsonValue,
        confidence: pipeline.extraction.extractionConfidence ?? null,
        promptVersion: CONTRACT_ANALYSIS_PROMPT_VERSION,
        contentHash: pipeline.inputTextHash
      }
    })

    if (pipeline.risk.findings.length) {
      await tx.analysisFinding.createMany({
        data: pipeline.risk.findings.map((f) => ({
          tenantId: input.tenantId,
          documentId: input.documentId,
          analysisRunId: runId,
          category: f.category.slice(0, 64),
          title: f.title.slice(0, 240),
          description: f.description,
          severity: severityFromLiteral(f.severity),
          confidence: f.confidence ?? null,
          sourceStage: AnalysisPipelineStageName.RISK_AND_GUIDANCE,
          clauseRef: f.clauseRef?.slice(0, 200) ?? null
        }))
      })
    }

    const log = await tx.analysisLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.actorId,
        documentId: input.documentId,
        analysisRunId: runId,
        modelUsed: String(pipeline.primaryModel),
        tokensUsed: pipeline.totalTokens,
        cost: pipeline.totalCost,
        duration: durationMs
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "analysis.pipeline.completed",
      resourceType: "analysisRun",
      resourceId: runId,
      documentId: input.documentId,
      analysisLogId: log.id,
      metadata: {
        primaryProvider: pipeline.primaryProvider,
        primaryModel: String(pipeline.primaryModel),
        totalTokens: pipeline.totalTokens,
        structuredOutputValid: true,
        routerSummary: pipeline.routerSummary
      } satisfies Prisma.InputJsonValue
    })
  })

  return { ok: true, runId }
}
