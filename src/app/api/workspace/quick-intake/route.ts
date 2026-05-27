export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { UPLOAD_LIMIT, checkRateLimit, retryAfterSeconds } from "@/lib/security/rate-limit"
import { validateUploadedFile } from "@/lib/security/file-validation"
import { log } from "@/lib/security/secure-logging"
import {
  attachStoredFileToDocument,
  createDocumentIntake,
  markDocumentStorageFailure
} from "@/lib/documents/intake-core"
import { processDocumentExtraction } from "@/lib/documents/processing-core"
import { deleteStoredDocumentFile, storeDocumentFile } from "@/lib/storage/document-storage"

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024
const MAX_TEXT_CHARS = 120_000

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]

function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_MIME_TYPES.includes(file.type)) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith(".pdf")) return "application/pdf"
  if (name.endsWith(".doc")) return "application/msword"
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (name.endsWith(".txt")) return "text/plain"
  return ""
}

function titleFromFilename(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-]+/g, " ")
    .trim()
  if (base.length < 3) {
    return `Schnellanalyse ${new Date().toLocaleDateString("de-DE")}`
  }
  return base.slice(0, 160)
}

/**
 * POST /api/workspace/quick-intake
 *
 * Enterprise Quick Upload: creates a workspace document + stores the file +
 * triggers text extraction. The caller is responsible for starting analysis
 * via POST /api/workspace/analysis/start after this returns.
 *
 * Returns: { documentId: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const rl = checkRateLimit(`upload:${session.user.id}`, UPLOAD_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Upload-Limit erreicht. Bitte in einer Stunde erneut versuchen." },
      { status: 429, headers: { "Retry-After": retryAfterSeconds(rl.retryAfterMs) } }
    )
  }

  const tenantCtx = await resolveTenantContextForUser(session.user.id)
  if (tenantCtx.status !== "single") {
    return NextResponse.json({ error: "Kein eindeutiger Mandantenkontext." }, { status: 403 })
  }
  const tenantId = tenantCtx.tenantId

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 })
  }

  const rawFile = formData.get("file")
  const rawText = formData.get("text")
  const contractTypeRaw = formData.get("contractType")
  const contractTypeHint = typeof contractTypeRaw === "string" && contractTypeRaw.trim() ? contractTypeRaw.trim().slice(0, 80) : undefined

  let file: File
  let mimeType: string

  if (rawFile instanceof File && rawFile.size > 0 && rawFile.name.trim().length > 0) {
    if (rawFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Datei zu groß (max. 4 MB)." }, { status: 400 })
    }
    mimeType = resolveMimeType(rawFile)
    if (!mimeType) {
      return NextResponse.json({ error: "Dateityp nicht unterstützt. Bitte PDF, DOC, DOCX oder TXT verwenden." }, { status: 400 })
    }
    const validation = await validateUploadedFile(rawFile, MAX_FILE_SIZE_BYTES)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error ?? "Dateivalidierung fehlgeschlagen." }, { status: 422 })
    }
    file = rawFile
  } else if (typeof rawText === "string" && rawText.trim().length >= 10) {
    const textContent = rawText.trim().slice(0, MAX_TEXT_CHARS)
    const blob = new Blob([textContent], { type: "text/plain" })
    const date = new Date().toLocaleDateString("de-DE").replace(/\./g, "-")
    file = new File([blob], `schnellanalyse-${date}.txt`, { type: "text/plain" })
    mimeType = "text/plain"
  } else {
    return NextResponse.json(
      { error: "Bitte eine Datei hochladen oder mindestens 10 Zeichen Text eingeben." },
      { status: 400 }
    )
  }

  const docTitle = titleFromFilename(file.name)
  const docType = contractTypeHint ?? "Vertragsdokument"

  try {
    const document = await createDocumentIntake({
      tenantId,
      actorId: session.user.id,
      title: docTitle,
      documentType: docType,
      organizationName: "Unbekannt",
      filename: file.name,
      mimeType,
      sizeBytes: file.size
    })

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const storedFile = await storeDocumentFile({
      tenantId,
      documentId: document.id,
      originalFilename: file.name,
      mimeType,
      content: fileBuffer
    })

    try {
      await attachStoredFileToDocument({
        tenantId,
        actorId: session.user.id,
        documentId: document.id,
        filename: storedFile.filename,
        mimeType: storedFile.mimeType,
        sizeBytes: storedFile.sizeBytes,
        storageKey: storedFile.storageKey,
        sha256: storedFile.sha256
      })
      await processDocumentExtraction({
        tenantId,
        documentId: document.id,
        actorId: session.user.id
      })
    } catch {
      log.error("quick_intake.attach_failed", { documentId: document.id, code: "ATTACH_FAILED" })
      await deleteStoredDocumentFile(storedFile.storageKey)
      await markDocumentStorageFailure({
        tenantId,
        actorId: session.user.id,
        documentId: document.id,
        errorMessage: "Dateiablage fehlgeschlagen."
      })
      return NextResponse.json({ error: "Dateiverarbeitung fehlgeschlagen. Bitte erneut versuchen." }, { status: 500 })
    }

    log.debug("quick_intake.success", { documentId: document.id })
    return NextResponse.json({ documentId: document.id })
  } catch {
    log.error("quick_intake.failed", { code: "INTAKE_ERROR" })
    return NextResponse.json({ error: "Dokument konnte nicht angelegt werden. Bitte erneut versuchen." }, { status: 500 })
  }
}
