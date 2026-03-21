import "server-only"

import { DocumentIntakeStatus } from "@prisma/client"

import { type DossierCaseStatus, getDocumentDossierData } from "./document-dossier-core"

export type DocumentEvidenceReadinessState = "UNVOLLSTAENDIG" | "IN_BEARBEITUNG" | "INTERN_PRUEFFAEHIG" | "NACHWEIS_VORBEREITET"

export type DocumentEvidenceReadiness = {
  state: DocumentEvidenceReadinessState
  label: string
  hint: string
  missingItems: string[]
  presentItems: string[]
}

export type DocumentEvidenceSection = {
  key: string
  title: string
  available: boolean
  detail: string
}

export type DocumentEvidencePackageData = {
  generatedAt: Date
  readOnlyNotice: string
  dossier: NonNullable<Awaited<ReturnType<typeof getDocumentDossierData>>>
  readiness: DocumentEvidenceReadiness
  sections: DocumentEvidenceSection[]
  compactActivities: NonNullable<Awaited<ReturnType<typeof getDocumentDossierData>>>["activities"]
}

function mapLegacyCaseStatus(status: DossierCaseStatus): DocumentEvidenceReadinessState {
  if (status === "NACHWEIS_VORBEREITET") return "NACHWEIS_VORBEREITET"
  if (status === "INTERNER_REVIEW") return "INTERN_PRUEFFAEHIG"
  if (status === "IN_BEARBEITUNG") return "IN_BEARBEITUNG"
  return "UNVOLLSTAENDIG"
}

function getReadinessLabel(state: DocumentEvidenceReadinessState): string {
  if (state === "UNVOLLSTAENDIG") return "Unvollständig"
  if (state === "IN_BEARBEITUNG") return "In Bearbeitung"
  if (state === "INTERN_PRUEFFAEHIG") return "Intern prüffähig"
  return "Für Nachweisdokumentation vorbereitet"
}

export function getDocumentEvidenceReadiness(input: {
  hasDocument: boolean
  hasDocumentStatus: boolean
  hasContextBasis: boolean
  hasAuditTrail: boolean
  hasReviewOwner: boolean
  hasNotesOrFindings: boolean
  hasDecisionMemo: boolean
  decisionMemoRequired: boolean
  openHighRiskFindingsCount: number
  hasConsistentReleaseState: boolean
  legacyCaseStatus: DossierCaseStatus
}): DocumentEvidenceReadiness {
  const missingItems: string[] = []
  const presentItems: string[] = []

  const pushState = (isPresent: boolean, presentText: string, missingText: string) => {
    if (isPresent) {
      presentItems.push(presentText)
      return
    }

    missingItems.push(missingText)
  }

  pushState(input.hasDocument, "Dokumentstammdaten sind vorhanden.", "Dokumentstammdaten fehlen.")
  pushState(input.hasDocumentStatus, "Dokumentstatus ist dokumentiert.", "Dokumentstatus ist nicht belastbar ableitbar.")
  pushState(input.hasContextBasis, "Dokument- und Kontextbasis ist vorhanden.", "Dokumentkontext ist nicht vollständig hinterlegt.")
  pushState(input.hasAuditTrail, "Audit-naher Verlauf ist vorhanden.", "Audit-naher Verlauf fehlt.")
  pushState(input.hasReviewOwner, "Review-Verantwortung ist zugewiesen.", "Review-Verantwortung ist nicht gesetzt.")
  pushState(input.hasNotesOrFindings, "Review-Notizen oder Findings sind vorhanden.", "Review-Notizen oder Findings fehlen.")

  const memoFulfilled = input.hasDecisionMemo || !input.decisionMemoRequired
  pushState(
    memoFulfilled,
    input.hasDecisionMemo ? "Freigabevermerk ist erfasst." : "Freigabevermerk ist in diesem Status nicht erforderlich.",
    "Freigabevermerk fehlt für den aktuellen Dokumentstatus."
  )

  pushState(
    input.openHighRiskFindingsCount === 0,
    "Keine offenen High-Risk Findings.",
    "Offene High-Risk Findings blockieren die Nachweisvorbereitung."
  )

  pushState(
    input.hasConsistentReleaseState,
    "Freigabestatus ist mit den Nachweisen konsistent.",
    "Freigabestatus und Nachweislage sind nicht konsistent."
  )

  let state = mapLegacyCaseStatus(input.legacyCaseStatus)

  if (!input.hasDocument || !input.hasDocumentStatus || !input.hasContextBasis) {
    state = "UNVOLLSTAENDIG"
  } else if (!input.hasAuditTrail || !input.hasReviewOwner || !input.hasNotesOrFindings || !memoFulfilled) {
    state = "IN_BEARBEITUNG"
  } else if (input.openHighRiskFindingsCount > 0 || !input.hasConsistentReleaseState) {
    state = "INTERN_PRUEFFAEHIG"
  } else {
    state = "NACHWEIS_VORBEREITET"
  }

  const hint =
    state === "NACHWEIS_VORBEREITET"
      ? "Das Nachweispaket ist für interne Freigabe- und Nachweisdokumentation vorbereitet."
      : state === "INTERN_PRUEFFAEHIG"
        ? "Das Nachweispaket ist intern prüffähig, vor finaler Nachweisdokumentation sind noch fachliche Klärungen erforderlich."
        : state === "IN_BEARBEITUNG"
          ? "Das Nachweispaket ist in Bearbeitung. Die Ansicht enthält nur aktuell belastbar vorhandene Nachweisbausteine."
          : "Für dieses Dokument ist derzeit noch kein vollständiges Nachweispaket verfügbar."

  return {
    state,
    label: getReadinessLabel(state),
    hint,
    missingItems,
    presentItems
  }
}

export function buildDocumentEvidenceSections(dossier: NonNullable<Awaited<ReturnType<typeof getDocumentDossierData>>>): DocumentEvidenceSection[] {
  const extractionAvailable = Boolean(dossier.document.textExtractedAt || dossier.document.extractedTextPreview)
  const hasPolicyContext = dossier.policyContext.relevantCategories.length > 0
  const hasDecisionMemo = Boolean(dossier.decisionMemo)
  const hasAuditTrail = dossier.activities.length > 0

  const sections: DocumentEvidenceSection[] = [
    {
      key: "document_master_data",
      title: "Dokumentstammdaten",
      available: Boolean(dossier.document.id && dossier.document.title && dossier.document.documentType),
      detail: "Dokument-ID, Titel, Typ und Mandantenbezug sind in der Nachweisansicht enthalten."
    },
    {
      key: "text_basis",
      title: "Textgrundlage / Extraktionsstatus",
      available: extractionAvailable,
      detail: extractionAvailable
        ? "Eine nutzbare Textgrundlage ist für die Prüfung verfügbar."
        : "Es liegt derzeit keine belastbare Textgrundlage vor."
    },
    {
      key: "review_notes",
      title: "Review-Notizen",
      available: dossier.notes.length > 0,
      detail: dossier.notes.length > 0 ? `${dossier.notes.length} strukturierte Review-Notizen sind enthalten.` : "Es liegen keine strukturierten Review-Notizen vor."
    },
    {
      key: "findings",
      title: "Findings / Prüfhinweise",
      available: dossier.findings.length > 0,
      detail:
        dossier.findings.length > 0
          ? `${dossier.reviewReadiness.openFindingsCount} offen, ${dossier.reviewReadiness.closedFindingsCount} geschlossen/akzeptiert.`
          : "Es sind keine Findings dokumentiert."
    },
    {
      key: "decision_memo",
      title: "Decision Memo / Freigabevermerk",
      available: hasDecisionMemo,
      detail: hasDecisionMemo ? "Ein formaler Freigabevermerk ist vorhanden." : "Für dieses Dokument liegt noch kein formaler Freigabevermerk vor."
    },
    {
      key: "audit_trail",
      title: "Audit-Verlauf",
      available: hasAuditTrail,
      detail: hasAuditTrail ? "Audit-nahe Chronologie ist in kompakter Form enthalten." : "Es sind noch keine audit-nahen Aktivitäten erfasst."
    },
    {
      key: "policy_context",
      title: "Governance- und Richtlinienkontext",
      available: hasPolicyContext,
      detail: hasPolicyContext
        ? `${dossier.policyContext.relevantCategories.length} relevante Richtlinienbereiche sind zugeordnet.`
        : "Ein eindeutiger Governance-Kontext konnte aktuell nicht abgeleitet werden."
    },
    {
      key: "responsibility_context",
      title: "Verantwortlichkeitskontext",
      available: Boolean(dossier.document.reviewOwnerLabel),
      detail: dossier.document.reviewOwnerLabel
        ? `Review Owner: ${dossier.document.reviewOwnerLabel}${dossier.document.reviewDueAt ? " · Fälligkeit dokumentiert" : " · Fälligkeit offen"}.`
        : "Review-Verantwortung ist derzeit nicht hinterlegt."
    }
  ]

  return sections
}

export async function getDocumentEvidencePackageData(tenantId: string, actorId: string, documentId: string): Promise<DocumentEvidencePackageData | null> {
  const dossier = await getDocumentDossierData(tenantId, actorId, documentId)

  if (!dossier) {
    return null
  }

  const decisionMemoRequired = dossier.document.status === DocumentIntakeStatus.FREIGEGEBEN || dossier.document.status === DocumentIntakeStatus.ARCHIVIERT
  const openHighRiskFindingsCount = dossier.findings.filter((finding) => finding.status === "OFFEN" && finding.severity === "HOCH").length
  const hasConsistentReleaseState =
    dossier.document.status === DocumentIntakeStatus.FREIGEGEBEN || dossier.document.status === DocumentIntakeStatus.ARCHIVIERT
      ? Boolean(dossier.decisionMemo) && dossier.reviewReadiness.openFindingsCount === 0
      : true

  const readiness = getDocumentEvidenceReadiness({
    hasDocument: Boolean(dossier.document.id && dossier.document.title),
    hasDocumentStatus: Boolean(dossier.document.status),
    hasContextBasis: Boolean(dossier.document.filename && dossier.document.organizationName),
    hasAuditTrail: dossier.activities.length > 0,
    hasReviewOwner: Boolean(dossier.document.reviewOwnerLabel),
    hasNotesOrFindings: dossier.notes.length > 0 || dossier.findings.length > 0,
    hasDecisionMemo: Boolean(dossier.decisionMemo),
    decisionMemoRequired,
    openHighRiskFindingsCount,
    hasConsistentReleaseState,
    legacyCaseStatus: dossier.evidenceSummary.caseStatus
  })

  return {
    generatedAt: new Date(),
    readOnlyNotice: "Schreibgeschützte Nachweisansicht für interne Freigabe-, Legal- und Compliance-Abstimmungen.",
    dossier,
    readiness,
    sections: buildDocumentEvidenceSections(dossier),
    compactActivities: dossier.activities.slice(0, 12)
  }
}
