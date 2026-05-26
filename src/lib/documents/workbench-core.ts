import "server-only"

import { type DocumentIntakeStatus } from "@prisma/client"

import { listDocumentActivities, type DocumentActivityItem } from "@/lib/documents/document-activity-core"
import { getDocumentFileAccessContext } from "@/lib/documents/file-access-core"
import {
  getWorkbenchAiContractAnalysis,
  type WorkbenchAiContractAnalysis
} from "@/lib/documents/analysis-run-core"
import type {
  WorkbenchAiContractAnalysisProps,
  WorkbenchStructuredData,
  WorkbenchDeadlines,
  WorkbenchClassification,
  WorkbenchConfidenceFactors,
  WorkbenchEvidenceGraph
} from "@/types/ai-workbench"
import { getDocumentReviewSummary, type DocumentReviewSummary } from "@/lib/documents/review-workbench-core"
import { getWorkspaceDocumentById, type WorkspaceDocumentDetail } from "@/lib/documents/workspace-core"

export type StructuredAnalysisTopic = {
  label: string
  available: boolean
  note: string
}

export type StructuredAnalysisSection = {
  heading: string
  values: string[]
  emptyHint: string
}

export type DocumentWorkbenchData = {
  document: WorkspaceDocumentDetail
  fileAccess: Awaited<ReturnType<typeof getDocumentFileAccessContext>>
  activities: DocumentActivityItem[]
  reviewContext: {
    currentReviewState: string
    approvalState: string
    privilegedStepRecorded: boolean
    latestReviewAction: DocumentActivityItem | null
    latestApprovalAction: DocumentActivityItem | null
  }
  reviewSummary: DocumentReviewSummary
  analysis: {
    metadata: StructuredAnalysisSection[]
    clauseTopics: StructuredAnalysisTopic[]
    guidance: string[]
  }
  aiContractAnalysis: WorkbenchAiContractAnalysis | null
}

// =======================================================================
// Evidence Graph Extraction Helpers (v4)
// =======================================================================

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}

/** Extracts confidenceFactors from the combined evidenceGraph JSON blob. */
function extractConfidenceFactors(raw: unknown): WorkbenchConfidenceFactors | null {
  if (!isRecord(raw)) return null
  const cf = raw.confidenceFactors
  if (!isRecord(cf)) return null
  const n = (k: string) => typeof cf[k] === "number" ? cf[k] as number : 0
  return {
    normClarity: n("normClarity"),
    clauseClarity: n("clauseClarity"),
    contractContext: n("contractContext"),
    industryFit: n("industryFit"),
    precedent: n("precedent"),
    limitingFactor: typeof cf.limitingFactor === "string" ? cf.limitingFactor : null
  }
}

/** Extracts evidence graph data (normBasis, reasoningSteps, etc.) from JSON blob. */
function extractEvidenceGraph(raw: unknown): WorkbenchEvidenceGraph | null {
  if (!isRecord(raw)) return null

  const normBasis = Array.isArray(raw.normBasis)
    ? (raw.normBasis as Array<Record<string, unknown>>)
        .filter(isRecord)
        .map((n) => ({
          norm: String(n.norm ?? ""),
          marker: (["DIREKT", "ZWINGEND", "B2B-INDIZ", "ANALOG"].includes(String(n.marker)) ? String(n.marker) : "DIREKT") as "DIREKT" | "ZWINGEND" | "B2B-INDIZ" | "ANALOG",
          relevance: String(n.relevance ?? "")
        }))
    : null

  const reasoningSteps = Array.isArray(raw.reasoningSteps)
    ? (raw.reasoningSteps as Array<Record<string, unknown>>)
        .filter(isRecord)
        .map((s) => ({
          step: typeof s.step === "number" ? s.step : 0,
          label: String(s.label ?? ""),
          content: String(s.content ?? "")
        }))
        .sort((a, b) => a.step - b.step)
    : null

  const counterArguments = Array.isArray(raw.counterArguments)
    ? (raw.counterArguments as unknown[]).filter((s): s is string => typeof s === "string")
    : null

  const limitations = Array.isArray(raw.limitations)
    ? (raw.limitations as unknown[]).filter((s): s is string => typeof s === "string")
    : null

  // Only return if there's actual data
  if (!normBasis?.length && !reasoningSteps?.length && !counterArguments?.length && !limitations?.length) {
    return null
  }

  return { normBasis, reasoningSteps, counterArguments, limitations }
}

/** Phase 1.3: Extrahiert einen String-Wert aus dem evidenceGraph JSON (Fallback für vor-Migration-Findings). */
function extractStringFromJson(raw: unknown, key: string): string | null {
  if (!isRecord(raw)) return null
  const val = raw[key]
  return typeof val === "string" ? val : null
}

/** Phase 1.3: Extrahiert ein String-Array aus dem evidenceGraph JSON. */
function extractStringArrayFromJson(raw: unknown, key: string): string[] | null {
  if (!isRecord(raw)) return null
  const val = raw[key]
  if (!Array.isArray(val)) return null
  return val.filter((s): s is string => typeof s === "string")
}

export function serializeWorkbenchAiContractAnalysis(
  ai: WorkbenchAiContractAnalysis | null
): WorkbenchAiContractAnalysisProps | null {
  if (!ai) return null

  // v3: Classification aus classificationJson extrahieren
  const classJson = ai.run.classificationJson as Record<string, unknown> | null
  const classification: WorkbenchClassification | null = classJson
    ? {
        contractClassification: (classJson.contractClassification as string) ?? ai.run.contractClassification ?? null,
        partyConstellation: (classJson.partyConstellation as string) ?? ai.run.partyConstellation ?? null,
        clientRole: (classJson.clientRole as string) ?? null,
        industryClassification: (classJson.industryClassification as string) ?? null,
        internationalElement: (classJson.internationalElement as boolean) ?? null,
        agbKontrolleAnwendbar: (classJson.agbKontrolleAnwendbar as boolean) ?? ai.run.agbKontrolleAnwendbar ?? null,
        agbKontrollmassstab: (classJson.agbKontrollmassstab as string) ?? null,
        classificationSummary: (classJson.classificationSummary as string) ?? null,
        classificationConfidence: (classJson.classificationConfidence as number) ?? null
      }
    : null

  return {
    run: {
      id: ai.run.id,
      status: ai.run.status,
      startedAt: ai.run.startedAt.toISOString(),
      completedAt: ai.run.completedAt?.toISOString() ?? null,
      primaryProvider: ai.run.primaryProvider,
      primaryModel: ai.run.primaryModel,
      routerSummary: ai.run.routerSummary,
      riskScore01: ai.run.riskScore01,
      aggregateConfidence: ai.run.aggregateConfidence,
      structuredOutputValid: ai.run.structuredOutputValid,
      errorCode: ai.run.errorCode,
      fallbackReason: ai.run.fallbackReason,
      validationErrorSummary: ai.run.validationErrorSummary,
      reviewState: ai.run.reviewState,
      runSequence: ai.run.runSequence,
      promptBundleKey: ai.run.promptBundleKey,
      extractionPromptKey: ai.run.extractionPromptKey,
      extractionPromptVersion: ai.run.extractionPromptVersion,
      riskPromptKey: ai.run.riskPromptKey,
      riskPromptVersion: ai.run.riskPromptVersion
    },
    classification,
    extraction: ai.extraction
      ? {
          contractType: ai.extraction.contractType,
          parties: ai.extraction.parties,
          term: ai.extraction.term,
          legalTopics: ai.extraction.legalTopics,
          // Prisma liefert JSON-Felder als JsonValue (~unknown). Hier casten wir
          // auf das Client-Typ-Shape — Struktur wurde beim Persistieren gegen
          // das Zod-Schema validiert, daher sicher.
          structuredData: (ai.extraction.structuredData ?? null) as WorkbenchStructuredData | null,
          deadlines: (ai.extraction.deadlines ?? null) as WorkbenchDeadlines | null
        }
      : null,
    findings: ai.findings.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      severity: f.severity,
      category: f.category,
      confidence: f.confidence,
      clauseRef: f.clauseRef,
      sourceSpan: f.sourceSpan,
      // v2: Formulierungsvorschlag durchreichen
      suggestedRevision: f.suggestedRevision,
      // v4: confidenceFactors + evidenceGraph aus dem evidenceGraph JSON-Blob lesen
      confidenceFactors: extractConfidenceFactors(f.evidenceGraph),
      evidenceGraph: extractEvidenceGraph(f.evidenceGraph),
      // v5 Phase 1.3: Analyse-Qualitätsfelder (aus DB-Spalten oder evidenceGraph-Fallback)
      riskNature: (f as Record<string, unknown>).riskNature as string | null
        ?? extractStringFromJson(f.evidenceGraph, "riskNature"),
      findingType: (f as Record<string, unknown>).findingType as string | null
        ?? extractStringFromJson(f.evidenceGraph, "findingType"),
      primaryLegalBasis: (f as Record<string, unknown>).primaryLegalBasis as string[] | null
        ?? extractStringArrayFromJson(f.evidenceGraph, "primaryLegalBasis"),
      latestReview: f.latestReview
        ? {
            decision: f.latestReview.decision,
            comment: f.latestReview.comment,
            reviewedAt: f.latestReview.reviewedAt.toISOString(),
            reviewerId: f.latestReview.reviewerId,
            reviewerName: f.latestReview.reviewerName ?? null
          }
        : null,
      allReviews: (f.allReviews ?? []).map((rev: { decision: string; comment: string | null; reviewedAt: Date | string; reviewerId: string; reviewerName?: string | null }) => ({
        decision: rev.decision,
        comment: rev.comment,
        reviewedAt: typeof rev.reviewedAt === "string" ? rev.reviewedAt : rev.reviewedAt.toISOString(),
        reviewerId: rev.reviewerId,
        reviewerName: rev.reviewerName ?? null
      }))
    })),
    risk: ai.risk
  }
}

const reviewStateByStatus: Record<DocumentIntakeStatus, string> = {
  EINGEGANGEN: "Erstprüfung ausstehend",
  IN_PRUEFUNG: "Juristische Prüfung aktiv",
  FREIGEGEBEN: "Prüfung abgeschlossen",
  ARCHIVIERT: "Prüfung abgeschlossen"
}

const approvalStateByStatus: Record<DocumentIntakeStatus, string> = {
  EINGEGANGEN: "Noch nicht freigegeben",
  IN_PRUEFUNG: "Freigabeentscheidung ausstehend",
  FREIGEGEBEN: "Freigegeben",
  ARCHIVIERT: "Archiviert"
}

function findMatches(text: string, regex: RegExp): string[] {
  return Array.from(text.matchAll(regex))
    .map((match) => match[0]?.trim())
    .filter((value): value is string => Boolean(value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function buildStructuredAnalysis(document: WorkspaceDocumentDetail) {
  const text = document.extractedTextPreview ?? ""
  const normalizedText = text.toLowerCase()

  const references = unique(findMatches(text, /\b(?:Az\.|Aktenzeichen|Vertragsnr\.|Vertrag\sNr\.)\s*[:#]?\s*[A-Za-z0-9\-/.]+/gi)).slice(0, 4)
  const dates = unique(findMatches(text, /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g)).slice(0, 6)
  const parties = unique(findMatches(text, /\b(?:GmbH|AG|UG|GbR|e\.V\.|KG|OHG|SE)\b[^\n,.]{0,50}/g)).slice(0, 4)

  const clauseTopics: StructuredAnalysisTopic[] = [
    {
      label: "Haftung",
      available: normalizedText.includes("haftung"),
      note: normalizedText.includes("haftung") ? "Hinweise auf Haftungsregelungen erkannt." : "Derzeit keine belastbare Ableitung aus der Textgrundlage."
    },
    {
      label: "Laufzeit / Kündigung",
      available: normalizedText.includes("laufzeit") || normalizedText.includes("kündigung"),
      note:
        normalizedText.includes("laufzeit") || normalizedText.includes("kündigung")
          ? "Hinweise zu Laufzeit- oder Kündigungsregelungen erkannt."
          : "Nicht eindeutig erkannt."
    },
    {
      label: "Datenschutz / AVV",
      available: normalizedText.includes("datenschutz") || normalizedText.includes("avv") || normalizedText.includes("dsgvo"),
      note:
        normalizedText.includes("datenschutz") || normalizedText.includes("avv") || normalizedText.includes("dsgvo")
          ? "Datenschutzbezogene Passagen wurden erkannt."
          : "Derzeit keine strukturierte Erkennung verfügbar."
    },
    {
      label: "Vertraulichkeit",
      available: normalizedText.includes("vertraulich") || normalizedText.includes("geheimhaltung"),
      note:
        normalizedText.includes("vertraulich") || normalizedText.includes("geheimhaltung")
          ? "Hinweise auf Vertraulichkeitsklauseln erkannt."
          : "Nicht eindeutig erkannt."
    },
    {
      label: "Vergütung / Leistung",
      available: normalizedText.includes("vergütung") || normalizedText.includes("leistung"),
      note:
        normalizedText.includes("vergütung") || normalizedText.includes("leistung")
          ? "Passagen zu Leistung und Vergütung erkannt."
          : "Derzeit keine belastbare Ableitung."
    }
  ]

  const metadata: StructuredAnalysisSection[] = [
    {
      heading: "Dokumenteinordnung",
      values: [document.documentType, document.organizationName],
      emptyHint: "Keine eindeutige Dokumenteinordnung verfügbar."
    },
    {
      heading: "Beteiligte / Parteien",
      values: parties,
      emptyHint: "Keine belastbaren Parteienangaben aus der Textgrundlage abgeleitet."
    },
    {
      heading: "Referenzen / Nummern",
      values: references,
      emptyHint: "Keine eindeutigen Referenzen in der aktuellen Textgrundlage erkannt."
    },
    {
      heading: "Relevante Datumsangaben",
      values: dates,
      emptyHint: "Keine belastbaren Datumsangaben erkannt."
    }
  ]

  const guidance = [
    "Die strukturierte Analyse basiert ausschließlich auf der aktuell verfügbaren Textgrundlage.",
    "Nicht eindeutig erkennbare Inhalte werden bewusst als unsicher markiert.",
    "Die Einordnung dient der Orientierung und ersetzt keine juristische Bewertung.",
    "Optional: mandantenbezogene KI-Vertragsanalyse mit gespeicherten, validierten Ergebnissen — stets fachlich prüfen (Human-in-the-Loop)."
  ]

  return {
    metadata,
    clauseTopics,
    guidance
  }
}

function buildReviewContext(document: WorkspaceDocumentDetail, activities: DocumentActivityItem[]) {
  const latestReviewAction = activities.find((item) => item.action === "document.review.started") ?? null
  const latestApprovalAction =
    activities.find((item) => item.action === "document.review.approved" || item.action === "document.review.archived") ?? null

  return {
    currentReviewState: reviewStateByStatus[document.status],
    approvalState: approvalStateByStatus[document.status],
    privilegedStepRecorded: activities.some((item) => item.context.includes("Privilegierter Schritt")),
    latestReviewAction,
    latestApprovalAction
  }
}

export async function getDocumentWorkbenchData(tenantId: string, actorId: string, documentId: string): Promise<DocumentWorkbenchData | null> {
  const document = await getWorkspaceDocumentById(tenantId, documentId)

  if (!document) {
    return null
  }

  const [activities, fileAccess, reviewSummaryResult, aiContractAnalysis] = await Promise.all([
    listDocumentActivities({
      tenantId,
      documentId: document.id,
      documentCreatedAt: document.createdAt,
      uploadedByLabel: document.uploadedByLabel
    }),
    getDocumentFileAccessContext(tenantId, document.id),
    getDocumentReviewSummary(tenantId, actorId, document.id),
    getWorkbenchAiContractAnalysis(tenantId, actorId, document.id)
  ])

  if (!reviewSummaryResult.ok) {
    return null
  }

  return {
    document,
    fileAccess,
    activities,
    reviewContext: buildReviewContext(document, activities),
    reviewSummary: reviewSummaryResult.summary,
    analysis: buildStructuredAnalysis(document),
    aiContractAnalysis
  }
}
