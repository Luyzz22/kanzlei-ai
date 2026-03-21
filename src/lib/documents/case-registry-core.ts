import "server-only"

import { DocumentIntakeStatus, type Prisma } from "@prisma/client"

import { mapAuditEventToDocumentActivity } from "@/lib/documents/document-activity-core"
import { getDocumentEvidenceReadiness, type DocumentEvidenceReadinessState } from "@/lib/documents/document-evidence-package-core"
import { getDocumentEvidenceSummary } from "@/lib/documents/document-dossier-core"
import { deriveReviewReadinessState, getReviewReadinessTone, type ReviewReadinessState } from "@/lib/documents/review-workbench-core"
import { withTenant } from "@/lib/tenant-context.server"

export type CaseRegistryEntry = {
  id: string
  title: string
  documentType: string
  organizationName: string
  status: DocumentIntakeStatus
  statusLabel: string
  statusTone: "warning" | "info" | "success" | "neutral"
  reviewState: ReviewReadinessState
  reviewLabel: string
  reviewTone: "warning" | "info" | "success" | "neutral"
  evidenceState: DocumentEvidenceReadinessState
  evidenceLabel: string
  evidenceTone: "warning" | "info" | "success"
  ownerLabel: string
  lastActivityAt: Date
  lastActivityLabel: string
}

export type CaseRegistryCounts = {
  total: number
  inReview: number
  approved: number
  evidencePrepared: number
  actionRequired: number
}

function getDocumentStatusLabel(status: DocumentIntakeStatus): string {
  if (status === DocumentIntakeStatus.EINGEGANGEN) return "Eingegangen"
  if (status === DocumentIntakeStatus.IN_PRUEFUNG) return "In Prüfung"
  if (status === DocumentIntakeStatus.FREIGEGEBEN) return "Freigegeben"
  return "Archiviert"
}

function getDocumentStatusTone(status: DocumentIntakeStatus): "warning" | "info" | "success" | "neutral" {
  if (status === DocumentIntakeStatus.EINGEGANGEN) return "warning"
  if (status === DocumentIntakeStatus.IN_PRUEFUNG) return "info"
  if (status === DocumentIntakeStatus.FREIGEGEBEN) return "success"
  return "neutral"
}

function getReviewStandLabel(state: ReviewReadinessState): string {
  if (state === "OFFEN") return "Noch nicht begonnen"
  if (state === "IN_PRUEFUNG") return "In Bearbeitung"
  if (state === "ENTSCHEIDUNGSVORBEREITUNG") return "Entscheidung dokumentieren"
  if (state === "FREIGABEREIF") return "Freigabereif"
  return "Abgeschlossen"
}

function getEvidenceTone(state: DocumentEvidenceReadinessState): "warning" | "info" | "success" {
  if (state === "UNVOLLSTAENDIG") return "warning"
  if (state === "IN_BEARBEITUNG" || state === "INTERN_PRUEFFAEHIG") return "info"
  return "success"
}

export function mapDocumentToCaseRegistryEntry(document: {
  id: string
  title: string
  documentType: string
  organizationName: string
  status: DocumentIntakeStatus
  createdAt: Date
  reviewOwner: { name: string | null; email: string | null } | null
  uploadedBy: { name: string | null; email: string | null } | null
  reviewNotes: Array<{ type: "NOTE" | "DECISION_MEMO" }>
  findings: Array<{ status: "OFFEN" | "GEKLAERT" | "AKZEPTIERT"; severity: "NIEDRIG" | "MITTEL" | "HOCH" }>
  auditEvents: Array<{
    id: string
    createdAt: Date
    action: string
    actorId: string | null
    metadata: Prisma.JsonValue | null
    actor: { name: string | null; email: string | null } | null
  }>
}): CaseRegistryEntry {
  const hasDecisionMemo = document.reviewNotes.some((note) => note.type === "DECISION_MEMO")
  const hasNotesOrFindings = document.reviewNotes.some((note) => note.type === "NOTE") || document.findings.length > 0
  const openFindingsCount = document.findings.filter((finding) => finding.status === "OFFEN").length
  const openHighRiskFindingsCount = document.findings.filter((finding) => finding.status === "OFFEN" && finding.severity === "HOCH").length

  const reviewState = deriveReviewReadinessState({
    status: document.status,
    openFindingsCount,
    hasReviewOwner: Boolean(document.reviewOwner),
    hasDecisionMemo
  })

  const legacySummary = getDocumentEvidenceSummary({
    hasDocument: Boolean(document.id && document.title),
    hasReviewOwner: Boolean(document.reviewOwner),
    hasDueDate: false,
    hasNotesOrFindings,
    hasDecisionMemo,
    reviewStatus: document.status,
    hasAuditTrail: document.auditEvents.length > 0
  })

  const consistencyRequired = document.status === DocumentIntakeStatus.FREIGEGEBEN || document.status === DocumentIntakeStatus.ARCHIVIERT
  const hasConsistentReleaseState = consistencyRequired ? hasDecisionMemo && openFindingsCount === 0 : true

  const evidenceReadiness = getDocumentEvidenceReadiness({
    hasDocument: Boolean(document.id && document.title),
    hasDocumentStatus: Boolean(document.status),
    hasContextBasis: Boolean(document.documentType && document.organizationName),
    hasAuditTrail: document.auditEvents.length > 0,
    hasReviewOwner: Boolean(document.reviewOwner),
    hasNotesOrFindings,
    hasDecisionMemo,
    decisionMemoRequired: consistencyRequired,
    openHighRiskFindingsCount,
    hasConsistentReleaseState,
    legacyCaseStatus: legacySummary.caseStatus
  })

  const latestAudit = document.auditEvents[0]
  const mappedActivity = latestAudit
    ? mapAuditEventToDocumentActivity({
        id: latestAudit.id,
        createdAt: latestAudit.createdAt,
        action: latestAudit.action,
        actorId: latestAudit.actorId,
        metadata: latestAudit.metadata,
        actor: latestAudit.actor
      })
    : null

  return {
    id: document.id,
    title: document.title,
    documentType: document.documentType,
    organizationName: document.organizationName,
    status: document.status,
    statusLabel: getDocumentStatusLabel(document.status),
    statusTone: getDocumentStatusTone(document.status),
    reviewState,
    reviewLabel: getReviewStandLabel(reviewState),
    reviewTone: getReviewReadinessTone(reviewState),
    evidenceState: evidenceReadiness.state,
    evidenceLabel: evidenceReadiness.label,
    evidenceTone: getEvidenceTone(evidenceReadiness.state),
    ownerLabel: document.reviewOwner?.name ?? document.reviewOwner?.email ?? document.uploadedBy?.name ?? document.uploadedBy?.email ?? "Nicht zugeordnet",
    lastActivityAt: mappedActivity?.timestamp ?? document.createdAt,
    lastActivityLabel: mappedActivity?.title ?? "Dokumenteingang erfasst"
  }
}

export async function listCaseRegistryEntries(tenantId: string): Promise<CaseRegistryEntry[]> {
  return withTenant(tenantId, async (tx) => {
    const documents = await tx.document.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        documentType: true,
        organizationName: true,
        status: true,
        createdAt: true,
        reviewOwner: {
          select: {
            name: true,
            email: true
          }
        },
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        },
        reviewNotes: {
          select: {
            type: true
          }
        },
        findings: {
          select: {
            status: true,
            severity: true
          }
        },
        auditEvents: {
          orderBy: [{ createdAt: "desc" }],
          take: 1,
          select: {
            id: true,
            createdAt: true,
            action: true,
            actorId: true,
            metadata: true,
            actor: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return documents
      .map((document) => mapDocumentToCaseRegistryEntry(document))
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
  })
}

export function getCaseRegistryCounts(entries: CaseRegistryEntry[]): CaseRegistryCounts {
  return {
    total: entries.length,
    inReview: entries.filter((entry) => entry.status === DocumentIntakeStatus.IN_PRUEFUNG).length,
    approved: entries.filter((entry) => entry.status === DocumentIntakeStatus.FREIGEGEBEN).length,
    evidencePrepared: entries.filter((entry) => entry.evidenceState === "NACHWEIS_VORBEREITET").length,
    actionRequired: entries.filter((entry) => entry.evidenceState !== "NACHWEIS_VORBEREITET" || entry.reviewState === "OFFEN" || entry.reviewState === "IN_PRUEFUNG").length
  }
}
