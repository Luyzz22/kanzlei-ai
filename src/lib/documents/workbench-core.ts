import "server-only"

import { type DocumentIntakeStatus } from "@prisma/client"

import { listDocumentActivities, type DocumentActivityItem } from "@/lib/documents/document-activity-core"
import { getDocumentFileAccessContext } from "@/lib/documents/file-access-core"
import {
  getWorkbenchAiContractAnalysis,
  type WorkbenchAiContractAnalysis
} from "@/lib/documents/analysis-run-core"
import type { WorkbenchAiContractAnalysisProps } from "@/types/ai-workbench"
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

export function serializeWorkbenchAiContractAnalysis(
  ai: WorkbenchAiContractAnalysis | null
): WorkbenchAiContractAnalysisProps | null {
  if (!ai) return null
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
    extraction: ai.extraction,
    findings: ai.findings.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      severity: f.severity,
      category: f.category,
      confidence: f.confidence,
      clauseRef: f.clauseRef,
      sourceSpan: f.sourceSpan,
      latestReview: f.latestReview
        ? {
            decision: f.latestReview.decision,
            comment: f.latestReview.comment,
            reviewedAt: f.latestReview.reviewedAt.toISOString(),
            reviewerId: f.latestReview.reviewerId
          }
        : null
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
