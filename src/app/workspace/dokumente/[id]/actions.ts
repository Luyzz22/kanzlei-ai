"use server"

import { revalidatePath } from "next/cache"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { createDocumentComment } from "@/lib/documents/comments-core"
import { processDocumentExtraction } from "@/lib/documents/processing-core"

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
