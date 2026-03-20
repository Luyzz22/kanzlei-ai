import "server-only"

import { DocumentIntakeStatus, DocumentProcessingStatus } from "@prisma/client"

import { TENANT_POLICY_CATEGORIES, TENANT_POLICY_MATURITY_LABELS, type TenantPolicyCategory } from "@/config/tenant-policies"
import { withTenant } from "@/lib/tenant-context.server"

import { listDocumentActivities, type DocumentActivityItem } from "./document-activity-core"
import { deriveReviewReadinessState, getReviewReadinessLabel, type DocumentFindingListItem, type DocumentReviewNoteListItem } from "./review-workbench-core"

export type DossierCaseStatus = "UNVOLLSTAENDIG" | "IN_BEARBEITUNG" | "INTERNER_REVIEW" | "NACHWEIS_VORBEREITET"

type EvidenceItemKey =
  | "document_stammdaten"
  | "review_owner"
  | "review_due_date"
  | "review_notes_or_findings"
  | "decision_memo"
  | "audit_trail"

type EvidenceItem = {
  key: EvidenceItemKey
  label: string
  available: boolean
  detail: string
}

export type DocumentPolicyContext = {
  relevantCategories: Array<{
    id: string
    title: string
    owner: TenantPolicyCategory["owner"]
    maturityLabel: string
    maturity: TenantPolicyCategory["maturity"]
    relevanceReason: string
  }>
  governanceSignals: string[]
}

export type DocumentDecisionSummary = {
  headline: string
  facts: string[]
  missingElements: string[]
  recommendation: string
}

export type DocumentEvidenceSummary = {
  caseStatus: DossierCaseStatus
  caseStatusLabel: string
  items: EvidenceItem[]
  completedCount: number
  totalCount: number
  exportReadinessHint: string
}

export type DocumentDossierData = {
  document: {
    id: string
    title: string
    documentType: string
    organizationName: string
    status: DocumentIntakeStatus
    processingStatus: DocumentProcessingStatus
    description: string | null
    filename: string
    mimeType: string | null
    sizeBytes: number | null
    extractedTextPreview: string | null
    textExtractedAt: Date | null
    createdAt: Date
    processedAt: Date | null
    processingError: string | null
    reviewOwnerLabel: string | null
    reviewDueAt: Date | null
    updatedReferenceAt: Date
  }
  notes: DocumentReviewNoteListItem[]
  findings: DocumentFindingListItem[]
  decisionMemo: {
    id: string
    title: string | null
    body: string
    createdAt: Date
    authorLabel: string
  } | null
  activities: DocumentActivityItem[]
  references: {
    parties: string[]
    documentReferences: string[]
    dates: string[]
  }
  reviewReadiness: {
    state: ReturnType<typeof deriveReviewReadinessState>
    label: string
    openFindingsCount: number
    closedFindingsCount: number
  }
  decisionSummary: DocumentDecisionSummary
  evidenceSummary: DocumentEvidenceSummary
  policyContext: DocumentPolicyContext
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function extractReferences(text: string | null) {
  const source = text ?? ""

  const documentReferences = unique(
    Array.from(source.matchAll(/\b(?:Az\.|Aktenzeichen|Vertragsnr\.|Vertrag\sNr\.)\s*[:#]?\s*[A-Za-z0-9\-/.]+/gi))
      .map((entry) => entry[0]?.trim())
      .filter((entry): entry is string => Boolean(entry))
  ).slice(0, 6)

  const parties = unique(
    Array.from(source.matchAll(/\b[\p{L}0-9&\-. ]{2,50}\b(?:GmbH|AG|UG|GbR|e\.V\.|KG|OHG|SE)\b/gu))
      .map((entry) => entry[0]?.trim())
      .filter((entry): entry is string => Boolean(entry))
  ).slice(0, 6)

  const dates = unique(
    Array.from(source.matchAll(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g))
      .map((entry) => entry[0]?.trim())
      .filter((entry): entry is string => Boolean(entry))
  ).slice(0, 8)

  return { parties, documentReferences, dates }
}

function getCaseStatusLabel(status: DossierCaseStatus): string {
  if (status === "UNVOLLSTAENDIG") return "Unvollständig"
  if (status === "IN_BEARBEITUNG") return "In Bearbeitung"
  if (status === "INTERNER_REVIEW") return "Für internen Review geeignet"
  return "Für Nachweisdokumentation vorbereitet"
}

function deriveEvidenceSummary(input: {
  hasDocument: boolean
  hasReviewOwner: boolean
  hasDueDate: boolean
  hasNotesOrFindings: boolean
  hasDecisionMemo: boolean
  reviewStatus: DocumentIntakeStatus
  hasAuditTrail: boolean
}) {
  const decisionMemoRequired = input.reviewStatus === "FREIGEGEBEN" || input.reviewStatus === "ARCHIVIERT"

  const items: EvidenceItem[] = [
    {
      key: "document_stammdaten",
      label: "Dokumentstammdaten",
      available: input.hasDocument,
      detail: input.hasDocument ? "Dokumentkopf und Metadaten sind vorhanden." : "Dokumentkopf ist unvollständig."
    },
    {
      key: "review_owner",
      label: "Review-Verantwortung",
      available: input.hasReviewOwner,
      detail: input.hasReviewOwner ? "Review Owner ist zugewiesen." : "Review Owner ist nicht gesetzt."
    },
    {
      key: "review_due_date",
      label: "Fälligkeit",
      available: input.hasDueDate,
      detail: input.hasDueDate ? "Fälligkeit ist dokumentiert." : "Fälligkeit ist derzeit bewusst offen oder nicht gepflegt."
    },
    {
      key: "review_notes_or_findings",
      label: "Review-Notizen oder Prüfhinweise",
      available: input.hasNotesOrFindings,
      detail: input.hasNotesOrFindings ? "Mindestens ein strukturierter Prüfbaustein liegt vor." : "Es liegt noch keine strukturierte Prüfdokumentation vor."
    },
    {
      key: "decision_memo",
      label: "Freigabevermerk",
      available: input.hasDecisionMemo || !decisionMemoRequired,
      detail: input.hasDecisionMemo
        ? "Freigabevermerk wurde erfasst."
        : decisionMemoRequired
          ? "Für den aktuellen Dokumentstatus ist ein Freigabevermerk erforderlich."
          : "Für den aktuellen Dokumentstatus noch nicht zwingend erforderlich."
    },
    {
      key: "audit_trail",
      label: "Aktivitäten & Verlauf",
      available: input.hasAuditTrail,
      detail: input.hasAuditTrail ? "Audit-naher Verlauf ist vorhanden." : "Noch kein belastbarer Verlauf vorhanden."
    }
  ]

  const completedCount = items.filter((item) => item.available).length
  const totalCount = items.length

  let caseStatus: DossierCaseStatus
  if (completedCount <= 2) {
    caseStatus = "UNVOLLSTAENDIG"
  } else if (completedCount <= 4) {
    caseStatus = "IN_BEARBEITUNG"
  } else if (items.find((item) => item.key === "audit_trail")?.available && items.find((item) => item.key === "review_notes_or_findings")?.available) {
    caseStatus = "INTERNER_REVIEW"
  } else {
    caseStatus = "IN_BEARBEITUNG"
  }

  if (completedCount === totalCount) {
    caseStatus = "NACHWEIS_VORBEREITET"
  }

  const exportReadinessHint =
    caseStatus === "NACHWEIS_VORBEREITET"
      ? "Die Nachweisbausteine sind vollständig genug für eine kontrollierte Evidence-Package-Vorbereitung."
      : "Das Dossier ist derzeit nicht vollständig. Einzelne Nachweisbausteine fehlen noch."

  return {
    caseStatus,
    caseStatusLabel: getCaseStatusLabel(caseStatus),
    items,
    completedCount,
    totalCount,
    exportReadinessHint
  } satisfies DocumentEvidenceSummary
}

export function getDocumentEvidenceSummary(input: {
  hasDocument: boolean
  hasReviewOwner: boolean
  hasDueDate: boolean
  hasNotesOrFindings: boolean
  hasDecisionMemo: boolean
  reviewStatus: DocumentIntakeStatus
  hasAuditTrail: boolean
}): DocumentEvidenceSummary {
  return deriveEvidenceSummary(input)
}

export function getDocumentDecisionSummary(input: {
  openFindingsCount: number
  hasDecisionMemo: boolean
  hasPrivilegedApproval: boolean
  readinessLabel: string
  hasPolicyContext: boolean
  evidenceSummary: DocumentEvidenceSummary
}): DocumentDecisionSummary {
  const facts = [
    `${input.openFindingsCount} offene Prüfhinweise`,
    input.hasDecisionMemo ? "Freigabevermerk liegt vor" : "Freigabevermerk fehlt oder ist noch nicht erforderlich",
    input.hasPrivilegedApproval ? "Privilegierter Freigabeschritt im Verlauf protokolliert" : "Kein privilegierter Freigabeschritt protokolliert",
    `Entscheidungsreife: ${input.readinessLabel}`,
    input.hasPolicyContext ? "Richtlinienbezug konnte abgeleitet werden" : "Richtlinienbezug derzeit nicht eindeutig"
  ]

  const missingElements: string[] = []
  if (input.openFindingsCount > 0) missingElements.push("Offene Prüfhinweise sollten vor finaler Freigabe eingeordnet werden.")
  if (!input.hasDecisionMemo) missingElements.push("Für belastbare Nachweisdokumentation fehlt derzeit ein Freigabevermerk.")
  if (!input.hasPolicyContext) missingElements.push("Für diesen Fall konnte kein eindeutiger Governance-Kontext abgeleitet werden.")

  return {
    headline: `Nachweisstand: ${input.evidenceSummary.caseStatusLabel}`,
    facts,
    missingElements,
    recommendation:
      input.evidenceSummary.caseStatus === "NACHWEIS_VORBEREITET"
        ? "Der Fall ist für interne Entscheidungs- und Nachweisweitergabe vorbereitet."
        : "Empfohlen ist eine weitere Konsolidierung der Nachweisbausteine vor externer Weitergabe."
  }
}

function derivePolicyCategoryIds(documentType: string, status: DocumentIntakeStatus, readiness: string): string[] {
  const normalizedType = documentType.toLowerCase()
  const categories = new Set<string>(["nachweise-audit", "rollen-freigaben"])

  if (normalizedType.includes("datenschutz") || normalizedType.includes("avv") || normalizedType.includes("dsgvo")) {
    categories.add("datenschutz-aufbewahrung")
  }

  if (normalizedType.includes("ki") || readiness === "Entscheidungsvorbereitung") {
    categories.add("ki-oversight")
  }

  if (status === "FREIGEGEBEN" || status === "ARCHIVIERT") {
    categories.add("zugriff-session")
  }

  return Array.from(categories)
}

export function getDocumentPolicyContext(input: {
  documentType: string
  status: DocumentIntakeStatus
  readinessLabel: string
}): DocumentPolicyContext {
  const relevantIds = derivePolicyCategoryIds(input.documentType, input.status, input.readinessLabel)
  const categories = TENANT_POLICY_CATEGORIES.filter((category) => relevantIds.includes(category.id))

  return {
    relevantCategories: categories.map((category) => ({
      id: category.id,
      title: category.title,
      owner: category.owner,
      maturity: category.maturity,
      maturityLabel: TENANT_POLICY_MATURITY_LABELS[category.maturity],
      relevanceReason:
        category.id === "datenschutz-aufbewahrung"
          ? "Dokumenttyp und Aufbewahrungskontext deuten auf Datenschutzbezug hin."
          : category.id === "ki-oversight"
            ? "Prüf- und Entscheidungsphase mit möglichem KI-Bezug erfordert Human Oversight-Kontext."
            : category.id === "rollen-freigaben"
              ? "Review-Verantwortung und Freigabepfad benötigen Rollen- und Freigabekontext."
              : category.id === "zugriff-session"
                ? "Freigabe- und Zugriffsstatus legt Zugriffs- und Session-Kontext nahe."
                : "Nachweisorientierter Verlauf benötigt Audit- und Governance-Kontext."
    })),
    governanceSignals: [
      "Der Governance-Kontext ist ein strukturierter Hinweis und keine automatische Regulierungsprüfung.",
      "Richtlinienbezüge werden konservativ aus Dokumenttyp, Status und Entscheidungsreife abgeleitet."
    ]
  }
}

export async function getDocumentDossierData(tenantId: string, actorId: string, documentId: string): Promise<DocumentDossierData | null> {
  return withTenant(tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: actorId } },
      select: { id: true }
    })

    if (!membership) {
      return null
    }

    const document = await tx.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        tenantId: true,
        title: true,
        documentType: true,
        organizationName: true,
        status: true,
        processingStatus: true,
        description: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        extractedTextPreview: true,
        textExtractedAt: true,
        createdAt: true,
        processedAt: true,
        processingError: true,
        reviewDueAt: true,
        reviewOwnerId: true,
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        },
        reviewOwner: {
          select: {
            name: true,
            email: true
          }
        },
        reviewNotes: {
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            sectionKey: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        findings: {
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            description: true,
            severity: true,
            status: true,
            sectionKey: true,
            createdAt: true,
            updatedAt: true,
            resolvedAt: true,
            createdBy: {
              select: {
                name: true,
                email: true
              }
            },
            resolvedBy: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!document) {
      return null
    }

    if (document.tenantId !== tenantId) {
      return null
    }

    const notes: DocumentReviewNoteListItem[] = document.reviewNotes
      .filter((note) => note.type === "NOTE")
      .map((note) => ({
        ...note,
        authorLabel: note.author.name ?? note.author.email ?? "Unbekannter Nutzer"
      }))

    const findings: DocumentFindingListItem[] = document.findings.map((finding) => ({
      ...finding,
      createdByLabel: finding.createdBy.name ?? finding.createdBy.email ?? "Unbekannter Nutzer",
      resolvedByLabel: finding.resolvedBy?.name ?? finding.resolvedBy?.email ?? null
    }))

    const latestDecisionMemo = document.reviewNotes.find((note) => note.type === "DECISION_MEMO")
    const decisionMemo = latestDecisionMemo
      ? {
          id: latestDecisionMemo.id,
          title: latestDecisionMemo.title,
          body: latestDecisionMemo.body,
          createdAt: latestDecisionMemo.createdAt,
          authorLabel: latestDecisionMemo.author.name ?? latestDecisionMemo.author.email ?? "Unbekannter Nutzer"
        }
      : null

    const openFindingsCount = findings.filter((item) => item.status === "OFFEN").length
    const closedFindingsCount = findings.length - openFindingsCount

    const readinessState = deriveReviewReadinessState({
      status: document.status,
      openFindingsCount,
      hasReviewOwner: Boolean(document.reviewOwnerId),
      hasDecisionMemo: Boolean(decisionMemo)
    })
    const readinessLabel = getReviewReadinessLabel(readinessState)

    const activities = await listDocumentActivities({
      tenantId,
      documentId: document.id,
      documentCreatedAt: document.createdAt,
      uploadedByLabel: document.uploadedBy?.name ?? document.uploadedBy?.email ?? "System"
    })

    const evidenceSummary = getDocumentEvidenceSummary({
      hasDocument: Boolean(document.id && document.title),
      hasReviewOwner: Boolean(document.reviewOwnerId),
      hasDueDate: Boolean(document.reviewDueAt),
      hasNotesOrFindings: notes.length > 0 || findings.length > 0,
      hasDecisionMemo: Boolean(decisionMemo),
      reviewStatus: document.status,
      hasAuditTrail: activities.length > 0
    })

    const policyContext = getDocumentPolicyContext({
      documentType: document.documentType,
      status: document.status,
      readinessLabel
    })

    const decisionSummary = getDocumentDecisionSummary({
      openFindingsCount,
      hasDecisionMemo: Boolean(decisionMemo),
      hasPrivilegedApproval: activities.some((activity) => activity.action === "document.review.approved" || activity.action === "document.review.archived"),
      readinessLabel,
      hasPolicyContext: policyContext.relevantCategories.length > 0,
      evidenceSummary
    })

    const references = extractReferences(document.extractedTextPreview)

    return {
      document: {
        id: document.id,
        title: document.title,
        documentType: document.documentType,
        organizationName: document.organizationName,
        status: document.status,
        processingStatus: document.processingStatus,
        description: document.description,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        extractedTextPreview: document.extractedTextPreview,
        textExtractedAt: document.textExtractedAt,
        createdAt: document.createdAt,
        processedAt: document.processedAt,
        processingError: document.processingError,
        reviewOwnerLabel: document.reviewOwner ? document.reviewOwner.name ?? document.reviewOwner.email ?? "Unbekannter Nutzer" : null,
        reviewDueAt: document.reviewDueAt,
        updatedReferenceAt: activities[0]?.timestamp ?? document.createdAt
      },
      notes,
      findings,
      decisionMemo,
      activities,
      references,
      reviewReadiness: {
        state: readinessState,
        label: readinessLabel,
        openFindingsCount,
        closedFindingsCount
      },
      decisionSummary,
      evidenceSummary,
      policyContext
    }
  })
}
