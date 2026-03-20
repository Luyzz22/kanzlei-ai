import "server-only"

import { type DocumentIntakeStatus } from "@prisma/client"

import { listDocumentActivities, type DocumentActivityItem } from "@/lib/documents/document-activity-core"
import { getDocumentFileAccessContext } from "@/lib/documents/file-access-core"
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
  analysis: {
    metadata: StructuredAnalysisSection[]
    clauseTopics: StructuredAnalysisTopic[]
    guidance: string[]
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
    "Die Einordnung dient der Orientierung und ersetzt keine juristische Bewertung."
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

export async function getDocumentWorkbenchData(tenantId: string, documentId: string): Promise<DocumentWorkbenchData | null> {
  const document = await getWorkspaceDocumentById(tenantId, documentId)

  if (!document) {
    return null
  }

  const [activities, fileAccess] = await Promise.all([
    listDocumentActivities({
      tenantId,
      documentId: document.id,
      documentCreatedAt: document.createdAt,
      uploadedByLabel: document.uploadedByLabel
    }),
    getDocumentFileAccessContext(tenantId, document.id)
  ])

  return {
    document,
    fileAccess,
    activities,
    reviewContext: buildReviewContext(document, activities),
    analysis: buildStructuredAnalysis(document)
  }
}
