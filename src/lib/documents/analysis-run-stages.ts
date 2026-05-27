/**
 * KanzleiAI v5.0 Stage-Chunked Pipeline — persistierte Stage-Funktionen.
 *
 * Jede Stage ist ein einzelner Lambda-Aufruf, der:
 *   1. Den aktuellen Run aus DB lädt (status, currentStage, stageStateJson)
 *   2. Document neu lädt + Text normalisiert
 *   3. Die entsprechende AI-Stage aus @/lib/ai/analysis-pipeline.ts aufruft
 *   4. Den neuen Zwischenstate in stageStateJson persistiert
 *   5. progress + currentStage in DB aktualisiert
 *   6. Den nextStage-Wert für den Worker zurückgibt (oder null bei COMPLETED)
 *
 * Die Risk-Stage führt zusätzlich die finale Aggregation aus und persistiert
 * Findings, Decisions, Audit-Events analog zur Legacy-Sync-Pipeline
 * (runPersistedContractAnalysis in analysis-run-core.ts).
 */

import "server-only"

import {
  AnalysisPipelineStageName,
  AnalysisReviewState,
  AnalysisRunStatus,
  DocumentFindingSeverity,
  Prisma
} from "@prisma/client"

import {
  assertAnyProviderConfigured,
  type RouterContext
} from "@/lib/ai/analysis-router"
import {
  assembleContractPipelineSuccess,
  hashTextSha256,
  normalizeDocumentTextForAnalysis,
  PipelineStageFailureError,
  runClassificationStage,
  runExtractionStage,
  runRiskStage,
  type ClassificationStageResult,
  type ExtractionStageResult,
  type RiskStageResult,
  type StageAttemptLog,
  type StageResolvedPrompt
} from "@/lib/ai/analysis-pipeline"
import { createTenantContractPromptResolver } from "@/lib/ai/prompt-governance.server"
import { contractAnalysisClaudeOnly } from "@/lib/ai/claude-model-config"
import {
  type ClassificationStagePayload,
  type ExtractionStagePayload
} from "@/lib/ai/schemas/contract-analysis"
import { writeAuditEventTx } from "@/lib/audit-write"
import { classificationFieldsForDb } from "@/lib/documents/classification-db-fields"
import { getDocumentTextForAnalysis } from "@/lib/documents/document-analysis-text"
import { getWorkspaceDocumentById } from "@/lib/documents/workspace-core"
import { sendAnalysisCompleteNotification } from "@/lib/email/analysis-notification"
import { prisma } from "@/lib/prisma"
import { withTenant } from "@/lib/tenant-context.server"
import { ModelType } from "@/types/ai"

// ============================================================================
// Types
// ============================================================================

export type StageName = "classification" | "extraction" | "risk"

/**
 * Was nach jedem Stage in stageStateJson abgelegt wird.
 * Bewusst klein gehalten: kein normalisierter Text, kein riesiger Prompt-Body —
 * der Text wird in jedem Stage neu aus dem Document geladen + gehasht.
 * Das spart DB-Schreiblast und vermeidet Inkonsistenzen.
 */
type PersistedStageState = {
  inputTextHash: string
  classification: {
    payload: ClassificationStagePayload | null
    resolved: StageResolvedPrompt | null
    stageLogs: StageAttemptLog[]
    fallbackKeys: string[]
  } | null
  extraction: {
    data: ExtractionStagePayload
    model: ModelType
    tokens: number
    resolved: StageResolvedPrompt
    stageLogs: StageAttemptLog[]
    fallbackKeys: string[]
  } | null
}

export type StageInput = {
  runId: string
  tenantId: string
  documentId: string
  actorId: string
}

export type StageOutcome =
  | {
      ok: true
      /** null = Pipeline ist COMPLETED, kein weiterer Stage. */
      nextStage: StageName | null
      progress: number
    }
  | {
      ok: false
      code:
        | "RUN_NOT_FOUND"
        | "RUN_INVALID_STATE"
        | "DOCUMENT_NOT_FOUND"
        | "DOCUMENT_NOT_PROCESSED"
        | "NO_TEXT_CONTENT"
        | "STATE_HASH_MISMATCH"
        | "EXTRACTION_REQUIRED"
        | "PIPELINE_STAGE_FAILED"
        | "PIPELINE_ERROR"
      message: string
    }

// ============================================================================
// Helper: Document laden + Text vorbereiten
// ============================================================================

type LoadedDocumentContext = {
  normalizedText: string
  inputTextHash: string
  routerCtx: RouterContext
  documentTypeHint: string
}

type LoadFailureCode = "DOCUMENT_NOT_FOUND" | "DOCUMENT_NOT_PROCESSED" | "NO_TEXT_CONTENT"

async function loadDocumentAndPrepareContext(
  tenantId: string,
  documentId: string
): Promise<
  | { ok: true; context: LoadedDocumentContext }
  | { ok: false; code: LoadFailureCode; message: string }
> {
  const doc = await getWorkspaceDocumentById(tenantId, documentId)
  if (!doc) {
    return { ok: false, code: "DOCUMENT_NOT_FOUND", message: "Dokument nicht gefunden." }
  }
  if (doc.processingStatus !== "VERARBEITET") {
    return {
      ok: false,
      code: "DOCUMENT_NOT_PROCESSED",
      message: "Dokument ist noch nicht verarbeitet."
    }
  }

  const textResult = await getDocumentTextForAnalysis(tenantId, documentId)
  if (!textResult.ok) {
    const code =
      textResult.code === "NOT_FOUND"
        ? "DOCUMENT_NOT_FOUND"
        : textResult.code === "NOT_PROCESSED"
          ? "DOCUMENT_NOT_PROCESSED"
          : "NO_TEXT_CONTENT"
    return { ok: false, code, message: textResult.message }
  }

  const maxChars = Number.parseInt(process.env.AI_MAX_INPUT_CHARS ?? "120000", 10) || 120_000
  const normalizedText = normalizeDocumentTextForAnalysis(textResult.text, maxChars)
  const inputTextHash = hashTextSha256(normalizedText)

  // R-02 Policy Guard: Tenant-Governance laden für Provider-Filterung
  const governance = await prisma.tenantGovernanceSettings
    .findUnique({
      where: { tenantId },
      select: { allowedProviders: true, preferEuModels: true }
    })
    .catch(() => null)

  assertAnyProviderConfigured()
  const routerCtx: RouterContext = {
    documentLength: normalizedText.length,
    tenantId,
    allowedProviders: (governance?.allowedProviders as string[] | null) ?? undefined,
    preferEuModels: governance?.preferEuModels ?? undefined
  }

  return {
    ok: true,
    context: {
      normalizedText,
      inputTextHash,
      routerCtx,
      // documentType ist im Schema String @default("Sonstiges"), aber wir
      // sind defensiv falls getWorkspaceDocumentById nicht selectiert oder
      // anderes Format liefert. "Sonstiges" matcht den DB-Default.
      documentTypeHint:
        typeof (doc as { documentType?: unknown }).documentType === "string"
          ? (doc as { documentType: string }).documentType
          : "Sonstiges"
    }
  }
}

function emptyState(inputTextHash: string): PersistedStageState {
  return { inputTextHash, classification: null, extraction: null }
}

function readState(raw: unknown, inputTextHash: string): PersistedStageState {
  if (!raw || typeof raw !== "object") return emptyState(inputTextHash)
  const s = raw as Partial<PersistedStageState>
  return {
    inputTextHash: typeof s.inputTextHash === "string" ? s.inputTextHash : inputTextHash,
    classification: s.classification ?? null,
    extraction: s.extraction ?? null
  }
}

async function persistFailure(
  tenantId: string,
  runId: string,
  actorId: string,
  documentId: string,
  errorCode: string,
  message: string,
  wallStart: number,
  /**
   * Optional: Per-Provider-Attempts der gescheiterten Stage.
   * Werden als AnalysisProviderDecision-Rows persistiert, damit Diagnose
   * möglich ist (welcher Provider mit welchem ErrorCode abgewiesen hat).
   * Ohne dies geht der Per-Versuch-Debug-Spur mit dem Lambda verloren.
   */
  stageLogs: StageAttemptLog[] = [],
  failedCurrentStage: StageName | null = null
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.analysisRun.update({
      where: { id: runId },
      data: {
        status: AnalysisRunStatus.FAILED,
        completedAt: new Date(),
        errorCode: errorCode.slice(0, 64),
        error: message.slice(0, 1000),
        fallbackReason: message.slice(0, 4000),
        durationMs: Date.now() - wallStart,
        ...(failedCurrentStage ? { currentStage: failedCurrentStage } : {})
      }
    })

    // Per-Provider-Attempts persistieren — auch bei Failure wichtig für Diagnose
    if (stageLogs.length > 0) {
      await tx.analysisProviderDecision.createMany({
        data: stageLogs.map((l) => ({
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
    }

    await writeAuditEventTx(tx, {
      tenantId,
      actorId,
      action: "analysis.pipeline.failed",
      resourceType: "analysisRun",
      resourceId: runId,
      documentId,
      metadata: {
        errorCode,
        message: message.slice(0, 2000),
        pipeline: "v5.0_stage_chunked",
        attemptCount: stageLogs.length
      } satisfies Prisma.InputJsonValue
    })
  })
}

// ============================================================================
// Stage 0: Classification
// ============================================================================

export async function runPersistedClassificationStage(input: StageInput): Promise<StageOutcome> {
  const wallStart = Date.now()

  const run = await prisma.analysisRun.findUnique({
    where: { id: input.runId },
    select: { id: true, tenantId: true, status: true, startedAt: true }
  })
  if (!run) return { ok: false, code: "RUN_NOT_FOUND", message: "Run nicht gefunden." }
  if (run.tenantId !== input.tenantId)
    return { ok: false, code: "RUN_NOT_FOUND", message: "Run nicht gefunden." }

  const ctxResult = await loadDocumentAndPrepareContext(input.tenantId, input.documentId)
  if (!ctxResult.ok) {
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      ctxResult.code,
      ctxResult.message,
      wallStart,
      [],
      "classification"
    )
    return ctxResult
  }
  const { normalizedText, inputTextHash, routerCtx, documentTypeHint } = ctxResult.context

  const promptResolver = createTenantContractPromptResolver(input.tenantId, documentTypeHint)

  let stage: ClassificationStageResult
  try {
    stage = await runClassificationStage(normalizedText, routerCtx, promptResolver)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Klassifikationsfehler"
    if (contractAnalysisClaudeOnly()) {
      const failureStageLogs = err instanceof PipelineStageFailureError ? err.stageLogs : []
      await persistFailure(
        input.tenantId,
        input.runId,
        input.actorId,
        input.documentId,
        "PIPELINE_STAGE_FAILED",
        message,
        wallStart,
        failureStageLogs,
        "classification"
      )
      return { ok: false, code: "PIPELINE_STAGE_FAILED", message }
    }
    console.warn(
      "[Pipeline.v5.classification] non-blocking failure:",
      message
    )
    stage = { classification: null, classificationResolved: null, stageLogs: [], fallbackKeys: [] }
  }

  const state: PersistedStageState = {
    inputTextHash,
    classification: {
      payload: stage.classification,
      resolved: stage.classificationResolved,
      stageLogs: stage.stageLogs,
      fallbackKeys: stage.fallbackKeys
    },
    extraction: null
  }

  await prisma.analysisRun.update({
    where: { id: input.runId },
    data: {
      status: AnalysisRunStatus.RUNNING,
      currentStage: "extraction",
      progress: 33,
      stageStateJson: state as unknown as Prisma.InputJsonValue,
      classificationJson:
        stage.classification != null
          ? (stage.classification as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      ...classificationFieldsForDb(stage.classification),
      classificationPromptKey: stage.classificationResolved?.key ?? null,
      classificationPromptVersion: stage.classificationResolved?.version ?? null,
      inputTextHash
    }
  })

  console.log(
    `[Pipeline.v5.classification] runId=${input.runId} done in ${Date.now() - wallStart}ms, classification=${stage.classification ? "ok" : "skipped"}, nextStage=extraction`
  )

  return { ok: true, nextStage: "extraction", progress: 33 }
}

// ============================================================================
// Stage 1: Extraction
// ============================================================================

export async function runPersistedExtractionStage(input: StageInput): Promise<StageOutcome> {
  const wallStart = Date.now()

  const run = await prisma.analysisRun.findUnique({
    where: { id: input.runId },
    select: { id: true, tenantId: true, status: true, stageStateJson: true, startedAt: true }
  })
  if (!run) return { ok: false, code: "RUN_NOT_FOUND", message: "Run nicht gefunden." }
  if (run.tenantId !== input.tenantId)
    return { ok: false, code: "RUN_NOT_FOUND", message: "Run nicht gefunden." }

  const ctxResult = await loadDocumentAndPrepareContext(input.tenantId, input.documentId)
  if (!ctxResult.ok) {
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      ctxResult.code,
      ctxResult.message,
      wallStart,
      [],
      "extraction"
    )
    return ctxResult
  }
  const { normalizedText, inputTextHash, routerCtx } = ctxResult.context

  const previousState = readState(run.stageStateJson, inputTextHash)
  // Hash-Drift erkennen — Document hat sich zwischen Stages verändert
  if (previousState.inputTextHash !== inputTextHash) {
    const msg = `Document-Inhalt hat sich zwischen Stages geändert (hash drift). previous=${previousState.inputTextHash.slice(0, 8)}, current=${inputTextHash.slice(0, 8)}`
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      "STATE_HASH_MISMATCH",
      msg,
      wallStart,
      [],
      "extraction"
    )
    return { ok: false, code: "STATE_HASH_MISMATCH", message: msg }
  }

  const classificationPayload = previousState.classification?.payload ?? null
  const promptResolver = createTenantContractPromptResolver(
    input.tenantId,
    classificationPayload?.contractClassification ?? ctxResult.context.documentTypeHint
  )

  let stage: ExtractionStageResult
  try {
    stage = await runExtractionStage(normalizedText, routerCtx, promptResolver, classificationPayload)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Extraktionsfehler"
    const code = err instanceof PipelineStageFailureError ? "PIPELINE_STAGE_FAILED" : "PIPELINE_ERROR"
    // Per-Provider-Logs bei Stage-Failure für Diagnose persistieren
    const failureStageLogs = err instanceof PipelineStageFailureError ? err.stageLogs : []
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      code,
      message,
      wallStart,
      failureStageLogs,
      "extraction"
    )
    console.error(`[Pipeline.v5.extraction] runId=${input.runId} FAILED: ${message} (attempts=${failureStageLogs.length})`)
    return { ok: false, code, message }
  }

  const state: PersistedStageState = {
    ...previousState,
    extraction: {
      data: stage.extraction,
      model: stage.extractionModel,
      tokens: stage.extractionTokens,
      resolved: stage.extractionResolved,
      stageLogs: stage.stageLogs,
      fallbackKeys: stage.fallbackKeys
    }
  }

  await prisma.analysisRun.update({
    where: { id: input.runId },
    data: {
      status: AnalysisRunStatus.RUNNING,
      currentStage: "risk",
      progress: 66,
      stageStateJson: state as unknown as Prisma.InputJsonValue,
      extractionPromptKey: stage.extractionResolved.key,
      extractionPromptVersion: stage.extractionResolved.version
    }
  })

  console.log(
    `[Pipeline.v5.extraction] runId=${input.runId} done in ${Date.now() - wallStart}ms, ${stage.extractionTokens} tokens, nextStage=risk`
  )

  return { ok: true, nextStage: "risk", progress: 66 }
}

// ============================================================================
// Stage 2: Risk + finale Aggregation/Persistierung (COMPLETED)
// ============================================================================

function severityFromLiteral(s: "niedrig" | "mittel" | "hoch"): DocumentFindingSeverity {
  if (s === "niedrig") return DocumentFindingSeverity.NIEDRIG
  if (s === "hoch") return DocumentFindingSeverity.HOCH
  return DocumentFindingSeverity.MITTEL
}

export async function runPersistedRiskStage(input: StageInput): Promise<StageOutcome> {
  const wallStart = Date.now()

  const run = await prisma.analysisRun.findUnique({
    where: { id: input.runId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      stageStateJson: true,
      startedAt: true,
      runSequence: true,
      promptVersion: true
    }
  })
  if (!run) return { ok: false, code: "RUN_NOT_FOUND", message: "Run nicht gefunden." }
  if (run.tenantId !== input.tenantId)
    return { ok: false, code: "RUN_NOT_FOUND", message: "Run nicht gefunden." }

  const ctxResult = await loadDocumentAndPrepareContext(input.tenantId, input.documentId)
  if (!ctxResult.ok) {
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      ctxResult.code,
      ctxResult.message,
      wallStart,
      [],
      "risk"
    )
    return ctxResult
  }
  const { normalizedText, inputTextHash, routerCtx } = ctxResult.context

  const previousState = readState(run.stageStateJson, inputTextHash)
  if (previousState.inputTextHash !== inputTextHash) {
    const msg = `Document-Inhalt hat sich zwischen Stages geändert (hash drift).`
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      "STATE_HASH_MISMATCH",
      msg,
      wallStart,
      [],
      "risk"
    )
    return { ok: false, code: "STATE_HASH_MISMATCH", message: msg }
  }
  if (!previousState.extraction) {
    const msg = "Risk-Stage ohne vorherige Extraction aufgerufen — Pipeline-State inkonsistent."
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      "EXTRACTION_REQUIRED",
      msg,
      wallStart,
      [],
      "risk"
    )
    return { ok: false, code: "EXTRACTION_REQUIRED", message: msg }
  }

  const classificationPayload = previousState.classification?.payload ?? null
  const promptResolver = createTenantContractPromptResolver(
    input.tenantId,
    classificationPayload?.contractClassification ?? ctxResult.context.documentTypeHint
  )

  // ── Stage 3 ausführen ──────────────────────────────────────────────
  let stage: RiskStageResult
  try {
    stage = await runRiskStage(
      normalizedText,
      routerCtx,
      promptResolver,
      classificationPayload,
      previousState.extraction.data
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Risk-Fehler"
    const code = err instanceof PipelineStageFailureError ? "PIPELINE_STAGE_FAILED" : "PIPELINE_ERROR"
    // Per-Provider-Logs der Risk-Stage bei Failure für Diagnose persistieren
    // (Sie liegen sonst nur im RAM und gehen mit dem Lambda verloren.)
    const failureStageLogs = err instanceof PipelineStageFailureError ? err.stageLogs : []
    await persistFailure(
      input.tenantId,
      input.runId,
      input.actorId,
      input.documentId,
      code,
      message,
      wallStart,
      failureStageLogs,
      "risk"
    )
    console.error(`[Pipeline.v5.risk] runId=${input.runId} FAILED: ${message} (attempts=${failureStageLogs.length})`)
    return { ok: false, code, message }
  }

  // ── Final-Aggregation ──────────────────────────────────────────────
  const allStageLogs: StageAttemptLog[] = [
    ...(previousState.classification?.stageLogs ?? []),
    ...previousState.extraction.stageLogs,
    ...stage.stageLogs
  ]
  const allFallbackKeys: string[] = [
    ...(previousState.classification?.fallbackKeys ?? []),
    ...previousState.extraction.fallbackKeys,
    ...stage.fallbackKeys
  ]

  const pipeline = assembleContractPipelineSuccess({
    classification: classificationPayload,
    classificationResolved: previousState.classification?.resolved ?? null,
    extraction: previousState.extraction.data,
    extractionModel: previousState.extraction.model,
    extractionResolved: previousState.extraction.resolved,
    risk: stage.risk,
    riskModel: stage.riskModel,
    riskResolved: stage.riskResolved,
    stageLogs: allStageLogs,
    fallbackModelKeys: allFallbackKeys,
    inputTextHash
  })

  // ── Persistierung COMPLETED + alle related records ────────────────
  const startedAt = run.startedAt ?? new Date(wallStart)
  const totalDurationMs = Date.now() - startedAt.getTime()
  const runId = input.runId

  await withTenant(input.tenantId, async (tx) => {
    await tx.analysisRun.update({
      where: { id: runId },
      data: {
        status: AnalysisRunStatus.COMPLETED,
        currentStage: null,
        progress: 100,
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
        durationMs: totalDurationMs,
        recommendedMeasures: pipeline.risk.recommendedMeasures as Prisma.InputJsonValue,
        negotiationHints: pipeline.risk.negotiationHints as Prisma.InputJsonValue,
        explanationSummary: pipeline.risk.explanationSummary,
        promptBundleKey: pipeline.promptMetadata.bundleKey,
        extractionPromptKey: pipeline.promptMetadata.extractionKey,
        extractionPromptVersion: pipeline.promptMetadata.extractionVersion,
        riskPromptKey: pipeline.promptMetadata.riskKey,
        riskPromptVersion: pipeline.promptMetadata.riskVersion,
        classificationPromptKey: pipeline.promptMetadata.classificationKey,
        classificationPromptVersion: pipeline.promptMetadata.classificationVersion,
        classificationJson:
          pipeline.classification != null
            ? (pipeline.classification as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        ...classificationFieldsForDb(pipeline.classification),
        promptVersion: pipeline.promptMetadata.extractionVersion,
        reviewState: AnalysisReviewState.ANALYSIERT,
        // stageStateJson nach erfolgreichem Abschluss zurücksetzen — nicht mehr nötig
        stageStateJson: Prisma.JsonNull
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
        structuredData:
          pipeline.extraction.structuredData != null
            ? (pipeline.extraction.structuredData as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        deadlines:
          pipeline.extraction.deadlines != null
            ? (pipeline.extraction.deadlines as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        confidence: pipeline.extraction.extractionConfidence ?? null,
        promptVersion: pipeline.promptMetadata.extractionVersion,
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
          clauseRef: f.clauseRef?.slice(0, 200) ?? null,
          sourceSpan: f.quote ?? null,
          suggestedRevision: f.suggestedRevision ?? null,
          // v3: dedicated columns for analytics/filtering (moved out of evidenceGraph blob)
          riskNature: f.riskNature?.slice(0, 80) ?? null,
          findingType: f.findingType?.slice(0, 30) ?? null,
          primaryLegalBasis: f.primaryLegalBasis ?? [],
          referenceLegalBasis: f.referenceLegalBasis ?? [],
          // evidenceGraph: structured reasoning chain only (confidenceFactors + normBasis)
          evidenceGraph:
            f.evidenceGraph || f.confidenceFactors || f.riskNature || f.findingType || f.primaryLegalBasis
              ? ({
                  ...(f.evidenceGraph ?? {}),
                  confidenceFactors: f.confidenceFactors ?? undefined,
                  // Phase 1.3 v3: Analyse-Qualitätsfelder in evidenceGraph persistieren
                  // (eigene DB-Spalten als Prisma-Migration geplant — bis dahin hier)
                  riskNature: f.riskNature ?? undefined,
                  findingType: f.findingType ?? undefined,
                  primaryLegalBasis: f.primaryLegalBasis ?? undefined,
                  referenceLegalBasis: f.referenceLegalBasis ?? undefined
                } as Prisma.InputJsonValue)
              : Prisma.JsonNull
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
        duration: totalDurationMs
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
        routerSummary: pipeline.routerSummary,
        promptBundleKey: pipeline.promptMetadata.bundleKey,
        extractionPromptKey: pipeline.promptMetadata.extractionKey,
        extractionPromptVersion: pipeline.promptMetadata.extractionVersion,
        riskPromptKey: pipeline.promptMetadata.riskKey,
        riskPromptVersion: pipeline.promptMetadata.riskVersion,
        pipeline: "v5.0_stage_chunked",
        totalDurationMs
      } satisfies Prisma.InputJsonValue
    })
  })

  // ── Post-Processing (best-effort, non-blocking) ────────────────────
  try {
    const dynamicsConfig = await prisma.dynamicsIntegration.findUnique({
      where: { tenantId: input.tenantId },
      select: { syncEnabled: true, companyId: true }
    })
    if (dynamicsConfig?.syncEnabled && dynamicsConfig.companyId) {
      const { pushRiskToVendor } = await import("@/lib/dynamics/risk-push")
      await pushRiskToVendor(input.tenantId, runId, input.actorId).catch((e) => {
        console.warn(
          "[Pipeline.v5.risk Dynamics Auto-Push] Fehlgeschlagen:",
          e instanceof Error ? e.message : e
        )
      })
    }
  } catch {
    /* Dynamics nicht konfiguriert */
  }

  try {
    const notifyUser = await prisma.user.findUnique({
      where: { id: input.actorId },
      select: { email: true, name: true }
    })
    const notifyDoc = await prisma.document.findUnique({
      where: { id: input.documentId },
      select: { title: true }
    })
    if (notifyUser?.email && notifyDoc?.title) {
      const high = pipeline.risk.findings.filter((f) => f.severity === "hoch").length
      const medium = pipeline.risk.findings.filter((f) => f.severity === "mittel").length
      const low = pipeline.risk.findings.filter((f) => f.severity === "niedrig").length

      sendAnalysisCompleteNotification({
        recipientEmail: notifyUser.email,
        recipientName: notifyUser.name,
        documentId: input.documentId,
        documentTitle: notifyDoc.title,
        riskScore01: pipeline.risk.riskScore01,
        findingsCount: pipeline.risk.findings.length,
        highFindings: high,
        mediumFindings: medium,
        lowFindings: low,
        primaryModel: pipeline.primaryModel,
        durationMs: totalDurationMs,
        contractClassification: pipeline.classification?.contractClassification ?? null
      }).catch((e) => {
        console.warn(
          "[Pipeline.v5.risk email.analysis_complete] Fehlgeschlagen:",
          e instanceof Error ? e.message : e
        )
      })
    }
  } catch {
    /* E-Mail-Benachrichtigung fehlgeschlagen */
  }

  console.log(
    `[Pipeline.v5.risk] runId=${runId} COMPLETED in ${Date.now() - wallStart}ms (total ${totalDurationMs}ms), ${pipeline.risk.findings.length} findings, riskScore=${pipeline.risk.riskScore01}`
  )

  return { ok: true, nextStage: null, progress: 100 }
}

// ============================================================================
// Stage-Router-Helper
// ============================================================================

/**
 * Dispatcher für den Worker (/api/workspace/analysis/run).
 * Liest currentStage aus DB, ruft die entsprechende Stage-Funktion auf.
 * Wird vom /run-Endpoint aufgerufen.
 */
export async function runNextStageForRun(
  input: StageInput,
  currentStage: string | null
): Promise<StageOutcome> {
  // null oder "classification" → starte Klassifikation
  if (currentStage === null || currentStage === "classification") {
    return runPersistedClassificationStage(input)
  }
  if (currentStage === "extraction") {
    return runPersistedExtractionStage(input)
  }
  if (currentStage === "risk") {
    return runPersistedRiskStage(input)
  }
  return {
    ok: false,
    code: "RUN_INVALID_STATE",
    message: `Unbekannter currentStage: ${currentStage}`
  }
}
