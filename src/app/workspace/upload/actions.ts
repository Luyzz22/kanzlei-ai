"use server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import {
  attachStoredFileToDocument,
  createDocumentIntake,
  markDocumentStorageFailure
} from "@/lib/documents/intake-core"
import { prepareDocumentProcessing } from "@/lib/documents/processing-core"
import { deleteStoredDocumentFile, storeDocumentFile } from "@/lib/storage/document-storage"
import { z } from "zod"

export type IntakeFormState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Partial<Record<"title" | "documentType" | "organizationName" | "description" | "file", string>>
}

const intakeSchema = z.object({
  title: z.string().trim().min(3, "Bitte einen Dokumenttitel mit mindestens 3 Zeichen angeben.").max(160, "Bitte maximal 160 Zeichen für den Dokumenttitel verwenden."),
  documentType: z.string().trim().min(2, "Bitte einen Dokumenttyp angeben.").max(80, "Bitte maximal 80 Zeichen für den Dokumenttyp verwenden."),
  organizationName: z.string().trim().min(2, "Bitte eine Organisation oder einen Mandanten angeben.").max(120, "Bitte maximal 120 Zeichen für Organisation oder Mandant verwenden."),
  description: z.string().trim().max(1200, "Bitte maximal 1200 Zeichen für den Kontext verwenden.").optional()
})

const erlaubteMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

function resolveMimeType(file: File): string {
  if (file.type && erlaubteMimeTypes.includes(file.type)) {
    return file.type
  }

  const filename = file.name.toLowerCase()
  if (filename.endsWith(".pdf")) return "application/pdf"
  if (filename.endsWith(".doc")) return "application/msword"
  if (filename.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (filename.endsWith(".txt")) return "text/plain"

  return ""
}

export async function createIntakeAction(_: IntakeFormState, formData: FormData): Promise<IntakeFormState> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Bitte melden Sie sich an, um einen Dokumenteingang anzulegen."
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

  const parsed = intakeSchema.safeParse({
    title: formData.get("title"),
    documentType: formData.get("documentType"),
    organizationName: formData.get("organizationName"),
    description: formData.get("description") || undefined
  })

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return {
      status: "error",
      message: "Bitte prüfen Sie die Eingaben und korrigieren Sie die markierten Felder.",
      fieldErrors: {
        title: fieldErrors.title?.[0],
        documentType: fieldErrors.documentType?.[0],
        organizationName: fieldErrors.organizationName?.[0],
        description: fieldErrors.description?.[0]
      }
    }
  }

  const uploadedFile = formData.get("file")
  const file = uploadedFile instanceof File ? uploadedFile : null

  if (!file || file.size === 0) {
    return {
      status: "error",
      message: "Bitte wählen Sie eine Datei für den Dokumenteingang aus.",
      fieldErrors: {
        file: "Für den produktiven Dokumenteingang ist eine Datei erforderlich."
      }
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      status: "error",
      message: "Die Datei ist zu groß.",
      fieldErrors: {
        file: "Bitte laden Sie Dateien bis maximal 25 MB hoch."
      }
    }
  }

  const resolvedMimeType = resolveMimeType(file)

  if (!resolvedMimeType) {
    return {
      status: "error",
      message: "Der Dateityp wird derzeit nicht unterstützt.",
      fieldErrors: {
        file: "Bitte laden Sie PDF-, DOC-, DOCX- oder TXT-Dateien hoch."
      }
    }
  }

  const cleanedDescription = parsed.data.description?.trim() || undefined

  try {
    const document = await createDocumentIntake({
      tenantId: tenantContext.tenantId,
      actorId: session.user.id,
      title: parsed.data.title,
      documentType: parsed.data.documentType,
      organizationName: parsed.data.organizationName,
      description: cleanedDescription,
      filename: file.name,
      mimeType: resolvedMimeType,
      sizeBytes: file.size
    })

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const storedFile = await storeDocumentFile({
      tenantId: tenantContext.tenantId,
      documentId: document.id,
      originalFilename: file.name,
      mimeType: resolvedMimeType,
      content: fileBuffer
    })

    try {
      await attachStoredFileToDocument({
        tenantId: tenantContext.tenantId,
        actorId: session.user.id,
        documentId: document.id,
        filename: storedFile.filename,
        mimeType: storedFile.mimeType,
        sizeBytes: storedFile.sizeBytes,
        storageKey: storedFile.storageKey,
        sha256: storedFile.sha256
      })
      await prepareDocumentProcessing({
        tenantId: tenantContext.tenantId,
        documentId: document.id,
        actorId: session.user.id
      })
      return {
        status: "success",
        message:
          "Das Dokument und die Datei wurden tenant-gebunden gespeichert. Der Verarbeitungsstatus wurde auf „vorbereitet“ gesetzt."
      }
    } catch {
      await deleteStoredDocumentFile(storedFile.storageKey)
      await markDocumentStorageFailure({
        tenantId: tenantContext.tenantId,
        actorId: session.user.id,
        documentId: document.id,
        errorMessage: "Dateispeicherung konnte nicht konsistent abgeschlossen werden."
      })
      return {
        status: "error",
        message:
          "Das Dokument wurde angelegt, aber die tenant-gebundene Dateiablage konnte nicht abgeschlossen werden. Bitte laden Sie die Datei erneut hoch."
      }
    }
  } catch {
    return {
      status: "error",
      message: "Der Dokumenteingang konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
    }
  }
}
