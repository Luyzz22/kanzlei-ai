import "server-only"

import { type Prisma } from "@prisma/client"

import { withTenant } from "@/lib/tenant-context.server"

export type DocumentActivityCategory = "Intake" | "Review" | "Freigabe" | "Archivierung" | "Audit"

export type DocumentActivityItem = {
  id: string
  timestamp: Date
  title: string
  context: string
  actorLabel: string
  category: DocumentActivityCategory
  action: string
}

type ListDocumentActivitiesInput = {
  tenantId: string
  documentId: string
  documentCreatedAt: Date
  uploadedByLabel: string
}

const intakeActions = new Set(["document.intake.created"])

function readPrivilegedStep(metadata: Prisma.JsonValue | null): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false
  return (metadata as Record<string, unknown>).privilegedStep === true
}

function readReviewReason(metadata: Prisma.JsonValue | null): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>).reason
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export function mapAuditEventToDocumentActivity(event: {
  id: string
  createdAt: Date
  action: string
  actorId: string | null
  metadata: Prisma.JsonValue | null
  actor: { name: string | null; email: string | null } | null
}): DocumentActivityItem {
  const actorLabel = event.actor?.name ?? event.actor?.email ?? event.actorId ?? "System"
  const reason = readReviewReason(event.metadata)
  const privilegedStep = readPrivilegedStep(event.metadata)

  if (event.action === "document.intake.created") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dokumenteingang angelegt",
      context: "Der Dokumenteneingang wurde im tenant-gebundenen Intake-Prozess erfasst.",
      actorLabel,
      category: "Intake",
      action: event.action
    }
  }

  if (event.action === "document.review.started") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Prüfung gestartet",
      context: reason
        ? `Die juristische Prüfung wurde gestartet. Begründung: ${reason}`
        : "Die juristische Prüfung wurde im Review-Kontext gestartet.",
      actorLabel,
      category: "Review",
      action: event.action
    }
  }

  if (event.action === "document.file.stored") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dateiablage abgeschlossen",
      context: "Die hochgeladene Datei wurde tenant-gebunden abgelegt und dem Dokument per Storage-Key zugeordnet.",
      actorLabel,
      category: "Intake",
      action: event.action
    }
  }


  if (event.action === "document.file.downloaded") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dokument heruntergeladen",
      context: "Der tenant-gebundene Dokumentzugriff wurde als Download protokolliert.",
      actorLabel,
      category: "Audit",
      action: event.action
    }
  }


  if (event.action === "document.processing.started") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dokumentverarbeitung gestartet",
      context: "Die tenant-gebundene Extraktion wurde für dieses Dokument angestoßen.",
      actorLabel,
      category: "Audit",
      action: event.action
    }
  }

  if (event.action === "document.processing.completed") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dokumentverarbeitung abgeschlossen",
      context: "Ein extrahierbarer Textkontext wurde gespeichert und für nachgelagerte Schritte vorbereitet.",
      actorLabel,
      category: "Audit",
      action: event.action
    }
  }

  if (event.action === "document.processing.unsupported") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Format nicht unterstützt",
      context: "Das Dateiformat wurde erkannt, die Extraktion ist in dieser Ausbaustufe jedoch noch nicht verfügbar.",
      actorLabel,
      category: "Audit",
      action: event.action
    }
  }

  if (event.action === "document.processing.failed") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dokumentverarbeitung fehlgeschlagen",
      context: "Die Verarbeitung konnte nicht abgeschlossen werden. Das Ergebnis wurde als fehlgeschlagen markiert.",
      actorLabel,
      category: "Audit",
      action: event.action
    }
  }

  if (event.action === "document.comment.created") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Kommentar hinzugefügt",
      context: "Ein dokumentbezogener Hinweis wurde im tenant-gebundenen Kommentarkontext erfasst.",
      actorLabel,
      category: "Review",
      action: event.action
    }
  }

  if (event.action === "document.review.note.created") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Review-Notiz erstellt",
      context: "Eine strukturierte Review-Notiz wurde erfasst.",
      actorLabel,
      category: "Review",
      action: event.action
    }
  }

  if (event.action === "document.review.memo.created") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Freigabevermerk erstellt",
      context: "Ein formaler Entscheidungs- bzw. Freigabevermerk wurde hinterlegt.",
      actorLabel,
      category: "Freigabe",
      action: event.action
    }
  }

  if (event.action === "document.finding.created") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Prüfhinweis erstellt",
      context: "Ein neuer Finding-Eintrag wurde im Prüfregister angelegt.",
      actorLabel,
      category: "Review",
      action: event.action
    }
  }

  if (event.action === "document.finding.resolved") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Prüfhinweis aktualisiert",
      context: "Ein Finding wurde als geklärt oder akzeptiert markiert.",
      actorLabel,
      category: "Review",
      action: event.action
    }
  }

  if (event.action === "document.review.owner.assigned") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Review-Verantwortung angepasst",
      context: "Die Verantwortlichkeit für die Dokumentprüfung wurde aktualisiert.",
      actorLabel,
      category: "Review",
      action: event.action
    }
  }

  if (event.action === "document.review.due_date.updated") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Review-Fälligkeit geändert",
      context: "Der Zieltermin für die Prüfung wurde angepasst.",
      actorLabel,
      category: "Review",
      action: event.action
    }
  }

  if (event.action === "document.review.approved") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dokument freigegeben",
      context: reason
        ? `${privilegedStep ? "Privilegierter Schritt. " : ""}Das Dokument wurde nach abgeschlossener Prüfung freigegeben. Begründung: ${reason}`
        : `${privilegedStep ? "Privilegierter Schritt. " : ""}Das Dokument wurde nach abgeschlossener Prüfung zur Nutzung freigegeben.`,
      actorLabel,
      category: "Freigabe",
      action: event.action
    }
  }

  if (event.action === "document.review.archived") {
    return {
      id: `audit-${event.id}`,
      timestamp: event.createdAt,
      title: "Dokument archiviert",
      context: reason
        ? `${privilegedStep ? "Privilegierter Schritt. " : ""}Das Dokument wurde aus dem aktiven Review-Prozess in die Archivierung überführt. Begründung: ${reason}`
        : `${privilegedStep ? "Privilegierter Schritt. " : ""}Das Dokument wurde aus dem aktiven Review-Prozess in die Archivierung überführt.`,
      actorLabel,
      category: "Archivierung",
      action: event.action
    }
  }

  return {
    id: `audit-${event.id}`,
    timestamp: event.createdAt,
    title: "Dokumentenaktivität protokolliert",
    context: `Audit-nahe Aktivität „${event.action}“ wurde dem Dokument zugeordnet.`,
    actorLabel,
    category: "Audit",
    action: event.action
  }
}

export async function listDocumentActivities(input: ListDocumentActivitiesInput): Promise<DocumentActivityItem[]> {
  const events = await withTenant(input.tenantId, async (tx) => {
    return tx.auditEvent.findMany({
      where: {
        OR: [
          { documentId: input.documentId },
          {
            resourceType: "document",
            resourceId: input.documentId
          }
        ]
      },
      orderBy: [{ createdAt: "desc" }],
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
    })
  })

  const activities = events.map((event) => mapAuditEventToDocumentActivity(event))
  const hasIntakeAudit = events.some((event) => intakeActions.has(event.action))

  if (!hasIntakeAudit) {
    activities.push({
      id: `document-baseline-${input.documentId}`,
      timestamp: input.documentCreatedAt,
      title: "Dokumenteingang erfasst",
      context: "Basiseintrag aus den Dokumentstammdaten, da kein separater Intake-Audit-Eintrag vorliegt.",
      actorLabel: input.uploadedByLabel,
      category: "Intake",
      action: "document.baseline.createdAt"
    })
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
