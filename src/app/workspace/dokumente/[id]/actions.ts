"use server"

import { revalidatePath } from "next/cache"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
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
