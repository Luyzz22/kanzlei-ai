"use server"

import { revalidatePath } from "next/cache"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { createDocumentComment } from "@/lib/documents/comments-core"
import { processDocumentExtraction } from "@/lib/documents/processing-core"
import {
  assignDocumentReviewOwner,
  createDocumentFinding,
  createDocumentReviewNote,
  resolveDocumentFinding,
  setDocumentReviewDueDate
} from "@/lib/documents/review-workbench-core"

export type DocumentProcessingFormState = {
  status: "idle" | "success" | "error"
  message?: string
}

export async function processDocumentNowAction(
  _: DocumentProcessingFormState,
  formData: FormData
): Promise<DocumentProcessingFormState> {
  const documentId = String(formData.get("documentId") ?? "").trim()

  if (!documentId) {
    return {
      status: "error",
      message: "Die Dokumentverarbeitung konnte nicht gestartet werden."
    }
  }

  const session = await auth()

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Bitte melden Sie sich an, um die Dokumentverarbeitung zu starten."
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

  const result = await processDocumentExtraction({
    tenantId: tenantContext.tenantId,
    documentId,
    actorId: session.user.id
  })

  if (!result) {
    return {
      status: "error",
      message: "Das angeforderte Dokument wurde in diesem Arbeitsbereich nicht gefunden."
    }
  }

  revalidatePath(`/workspace/dokumente/${documentId}`)
  revalidatePath("/workspace/dokumente")

  if (result.processingStatus === "VERARBEITET") {
    return {
      status: "success",
      message: "Die Dokumentverarbeitung wurde erfolgreich abgeschlossen."
    }
  }

  if (result.processingStatus === "NICHT_UNTERSTUETZT") {
    return {
      status: "error",
      message: "Dieses Dateiformat ist für die aktuelle Extraktion nicht unterstützt."
    }
  }

  return {
    status: "error",
    message: result.processingError ?? "Die Dokumentverarbeitung konnte nicht abgeschlossen werden."
  }
}

export type DocumentCommentFormState = {
  status: "idle" | "success" | "error"
  message?: string
}

export async function createDocumentCommentAction(
  _: DocumentCommentFormState,
  formData: FormData
): Promise<DocumentCommentFormState> {
  const documentId = String(formData.get("documentId") ?? "").trim()
  const body = String(formData.get("body") ?? "")
  const sectionKey = String(formData.get("sectionKey") ?? "").trim() || null
  const anchorText = String(formData.get("anchorText") ?? "").trim() || null

  if (!documentId) {
    return {
      status: "error",
      message: "Der Hinweis konnte nicht gespeichert werden. Bitte prüfen Sie die Eingabe."
    }
  }

  const session = await auth()

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Bitte melden Sie sich an, um Kommentare zu erfassen."
    }
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return {
      status: "error",
      message: "Kommentare sind nur im gültigen Mandantenkontext verfügbar."
    }
  }

  if (tenantContext.status === "multiple") {
    return {
      status: "error",
      message: "Kommentare sind nur bei eindeutigem Mandantenkontext verfügbar."
    }
  }

  const result = await createDocumentComment({
    tenantId: tenantContext.tenantId,
    actorId: session.user.id,
    documentId,
    body,
    sectionKey,
    anchorText
  })

  if (!result.ok) {
    if (result.code === "INVALID_BODY_LENGTH") {
      return {
        status: "error",
        message: "Der Kommentartext muss zwischen 5 und 2000 Zeichen umfassen."
      }
    }

    if (result.code === "INVALID_SECTION_KEY") {
      return {
        status: "error",
        message: "Der gewählte Bereichsbezug ist ungültig."
      }
    }

    if (result.code === "INVALID_ANCHOR_LENGTH") {
      return {
        status: "error",
        message: "Der Referenztext darf maximal 280 Zeichen enthalten."
      }
    }

    if (result.code === "FORBIDDEN_MEMBERSHIP") {
      return {
        status: "error",
        message: "Für diese Aktion fehlt die erforderliche Berechtigung."
      }
    }

    if (result.code === "NOT_FOUND" || result.code === "TENANT_MISMATCH") {
      return {
        status: "error",
        message: "Das angeforderte Dokument wurde in diesem Arbeitsbereich nicht gefunden."
      }
    }

    return {
      status: "error",
      message: "Der Hinweis konnte nicht gespeichert werden. Bitte prüfen Sie die Eingabe."
    }
  }

  revalidatePath(`/workspace/dokumente/${documentId}`)
  revalidatePath("/workspace/dokumente")

  return {
    status: "success",
    message: "Kommentar wurde erfolgreich gespeichert."
  }
}

export type ReviewWorkbenchFormState = {
  status: "idle" | "success" | "error"
  message?: string
}

const reviewInitialError = "Die Eingabe konnte nicht gespeichert werden. Bitte prüfen Sie die Angaben."

async function getActionContext() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, message: "Bitte melden Sie sich an, um diese Aktion auszuführen." }

  const tenantContext = await resolveTenantContextForUser(session.user.id)
  if (tenantContext.status === "none") return { ok: false as const, message: "Für Ihr Konto ist kein Mandantenkontext hinterlegt." }
  if (tenantContext.status === "multiple") return { ok: false as const, message: "Es ist kein eindeutiger Mandantenkontext verfügbar." }

  return { ok: true as const, tenantId: tenantContext.tenantId, actorId: session.user.id }
}

export async function createReviewNoteAction(_: ReviewWorkbenchFormState, formData: FormData): Promise<ReviewWorkbenchFormState> {
  const documentId = String(formData.get("documentId") ?? "").trim()
  const body = String(formData.get("body") ?? "")
  const title = String(formData.get("title") ?? "").trim() || null
  const sectionKey = String(formData.get("sectionKey") ?? "").trim() || null
  const kind = String(formData.get("noteType") ?? "NOTE")
  const type = kind === "DECISION_MEMO" ? "DECISION_MEMO" : "NOTE"

  if (!documentId) return { status: "error", message: reviewInitialError }
  const context = await getActionContext()
  if (!context.ok) return { status: "error", message: context.message }

  const result = await createDocumentReviewNote({ tenantId: context.tenantId, actorId: context.actorId, documentId, body, title, sectionKey, type })

  if (!result.ok) {
    if (result.code === "FORBIDDEN_MEMO") return { status: "error", message: "Für diese Aktion fehlt die erforderliche Berechtigung." }
    return { status: "error", message: reviewInitialError }
  }

  revalidatePath(`/workspace/dokumente/${documentId}`)
  revalidatePath("/workspace/review-queue")
  return { status: "success", message: type === "DECISION_MEMO" ? "Freigabevermerk wurde gespeichert." : "Review-Notiz wurde gespeichert." }
}

export async function createReviewFindingAction(_: ReviewWorkbenchFormState, formData: FormData): Promise<ReviewWorkbenchFormState> {
  const documentId = String(formData.get("documentId") ?? "").trim()
  const title = String(formData.get("title") ?? "")
  const description = String(formData.get("description") ?? "")
  const sectionKey = String(formData.get("sectionKey") ?? "").trim() || null
  const severityRaw = String(formData.get("severity") ?? "MITTEL")
  const severity = severityRaw === "NIEDRIG" || severityRaw === "MITTEL" || severityRaw === "HOCH" ? severityRaw : "MITTEL"

  if (!documentId) return { status: "error", message: reviewInitialError }
  const context = await getActionContext()
  if (!context.ok) return { status: "error", message: context.message }

  const result = await createDocumentFinding({ tenantId: context.tenantId, actorId: context.actorId, documentId, title, description, severity, sectionKey })
  if (!result.ok) return { status: "error", message: reviewInitialError }

  revalidatePath(`/workspace/dokumente/${documentId}`)
  revalidatePath("/workspace/review-queue")
  return { status: "success", message: "Prüfhinweis wurde gespeichert." }
}

export async function resolveReviewFindingAction(_: ReviewWorkbenchFormState, formData: FormData): Promise<ReviewWorkbenchFormState> {
  const documentId = String(formData.get("documentId") ?? "").trim()
  const findingId = String(formData.get("findingId") ?? "").trim()
  const nextStatusRaw = String(formData.get("nextStatus") ?? "")
  const nextStatus =
    nextStatusRaw === "GEKLAERT" || nextStatusRaw === "AKZEPTIERT"
      ? nextStatusRaw
      : null

  if (!documentId || !findingId || !nextStatus) return { status: "error", message: reviewInitialError }
  const context = await getActionContext()
  if (!context.ok) return { status: "error", message: context.message }

  const result = await resolveDocumentFinding({
    tenantId: context.tenantId,
    actorId: context.actorId,
    documentId,
    findingId,
    nextStatus
  })
  if (!result.ok) {
    if (result.code === "FORBIDDEN_FINDING_MANAGE") return { status: "error", message: "Für diese Aktion fehlt die erforderliche Berechtigung." }
    return { status: "error", message: reviewInitialError }
  }

  revalidatePath(`/workspace/dokumente/${documentId}`)
  revalidatePath("/workspace/review-queue")
  return { status: "success", message: "Prüfhinweis wurde aktualisiert." }
}

export async function updateReviewMetaAction(_: ReviewWorkbenchFormState, formData: FormData): Promise<ReviewWorkbenchFormState> {
  const documentId = String(formData.get("documentId") ?? "").trim()
  const ownerIdRaw = String(formData.get("reviewOwnerId") ?? "").trim()
  const reviewOwnerId = ownerIdRaw.length > 0 ? ownerIdRaw : null
  const dueDateRaw = String(formData.get("reviewDueAt") ?? "").trim()
  const reviewDueAt = dueDateRaw ? new Date(`${dueDateRaw}T00:00:00.000Z`) : null

  if (!documentId) return { status: "error", message: reviewInitialError }
  if (reviewDueAt && Number.isNaN(reviewDueAt.getTime())) return { status: "error", message: "Die Fälligkeit ist ungültig." }

  const context = await getActionContext()
  if (!context.ok) return { status: "error", message: context.message }

  const [ownerResult, dueResult] = await Promise.all([
    assignDocumentReviewOwner({ tenantId: context.tenantId, actorId: context.actorId, documentId, reviewOwnerId }),
    setDocumentReviewDueDate({ tenantId: context.tenantId, actorId: context.actorId, documentId, reviewDueAt })
  ])

  if (!ownerResult.ok || !dueResult.ok) {
    return { status: "error", message: "Review-Verantwortung oder Fälligkeit konnten nicht gespeichert werden." }
  }

  revalidatePath(`/workspace/dokumente/${documentId}`)
  revalidatePath("/workspace/review-queue")
  return { status: "success", message: "Review-Verantwortung und Fälligkeit wurden aktualisiert." }
}
