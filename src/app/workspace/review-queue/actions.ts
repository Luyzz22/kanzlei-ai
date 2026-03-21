"use server"

import { DocumentIntakeStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { transitionDocumentReviewStatus } from "@/lib/documents/review-core"

export type ReviewActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

const schema = z.object({
  documentId: z.string().min(1),
  nextStatus: z.nativeEnum(DocumentIntakeStatus),
  reason: z.string().trim().max(500, "Bitte maximal 500 Zeichen für die Begründung verwenden.").optional()
})

const allowedActionStatuses = new Set<DocumentIntakeStatus>([
  DocumentIntakeStatus.IN_PRUEFUNG,
  DocumentIntakeStatus.FREIGEGEBEN,
  DocumentIntakeStatus.ARCHIVIERT
])

function statusLabel(status: DocumentIntakeStatus): string {
  if (status === DocumentIntakeStatus.IN_PRUEFUNG) return "In Prüfung"
  if (status === DocumentIntakeStatus.FREIGEGEBEN) return "Freigegeben"
  if (status === DocumentIntakeStatus.ARCHIVIERT) return "Archiviert"
  return "Aktualisiert"
}

export async function reviewTransitionAction(_: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const session = await auth()

  if (!session?.user?.id || !session.user.role) {
    return {
      status: "error",
      message: "Bitte melden Sie sich an, um Review-Aktionen auszuführen."
    }
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return {
      status: "error",
      message: "Für Ihr Konto ist kein Mandantenkontext hinterlegt."
    }
  }

  if (tenantContext.status === "multiple") {
    return {
      status: "error",
      message: "Es ist kein eindeutiger Mandantenkontext verfügbar."
    }
  }

  const parsed = schema.safeParse({
    documentId: formData.get("documentId"),
    nextStatus: formData.get("nextStatus"),
    reason: formData.get("reason") || undefined
  })

  if (!parsed.success) {
    const reasonError = parsed.error.flatten().fieldErrors.reason?.[0]
    return {
      status: "error",
      message: reasonError ?? "Die Aktion konnte nicht verarbeitet werden. Bitte Eingaben prüfen."
    }
  }

  if (!allowedActionStatuses.has(parsed.data.nextStatus)) {
    return {
      status: "error",
      message: "Der angeforderte Statuswechsel ist nicht zulässig."
    }
  }

  const reason = parsed.data.reason?.trim() || undefined

  const result = await transitionDocumentReviewStatus({
    tenantId: tenantContext.tenantId,
    actorId: session.user.id,
    documentId: parsed.data.documentId,
    nextStatus: parsed.data.nextStatus,
    reason
  })

  if (!result.ok) {
    if (result.code === "FORBIDDEN_START_REVIEW_BY_POLICY") {
      return {
        status: "error",
        message: "Die Freigabe ist gemäß der aktiven Tenant-Richtlinie nicht zulässig."
      }
    }

    if (result.code === "FORBIDDEN_APPROVAL_BY_POLICY" || result.code === "FORBIDDEN_ARCHIVE_BY_POLICY") {
      return {
        status: "error",
        message: "Dieser Schritt ist gemäß der aktiven Tenant-Richtlinie nicht zulässig."
      }
    }

    if (result.code === "FOUR_EYES_REQUIRED_BY_POLICY") {
      return {
        status: "error",
        message: "Freigabe im Vier-Augen-Prinzip: Die hochladende Person kann dieses Dokument nicht selbst freigeben."
      }
    }

    if (result.code === "MISSING_APPROVAL_REASON" || result.code === "MISSING_ARCHIVE_REASON") {
      return {
        status: "error",
        message: "Für diesen Schritt ist eine Begründung erforderlich."
      }
    }

    if (result.code === "INVALID_TRANSITION") {
      return {
        status: "error",
        message: "Der Statuswechsel ist aus dem aktuellen Prüfstatus nicht möglich."
      }
    }

    if (result.code === "NOT_FOUND") {
      return {
        status: "error",
        message: "Das Dokument wurde nicht gefunden."
      }
    }

    return {
      status: "error",
      message: "Die Review-Aktion konnte nicht gespeichert werden."
    }
  }

  revalidatePath("/workspace/review-queue")
  revalidatePath("/workspace/dokumente")
  revalidatePath(`/workspace/dokumente/${parsed.data.documentId}`)

  return {
    status: "success",
    message: `Status erfolgreich auf „${statusLabel(result.status)}“ gesetzt.`
  }
}
