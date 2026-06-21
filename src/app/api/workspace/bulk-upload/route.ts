export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import {
  attachStoredFileToDocument,
  createDocumentIntake,
  markDocumentStorageFailure
} from "@/lib/documents/intake-core"
import { processDocumentExtraction } from "@/lib/documents/processing-core"
import { deleteStoredDocumentFile, storeDocumentFile } from "@/lib/storage/document-storage"
import { validateUploadedFile } from "@/lib/security/file-validation"
import { UPLOAD_LIMIT, checkRateLimit, retryAfterSeconds } from "@/lib/security/rate-limit"
import { log } from "@/lib/security/secure-logging"

const erlaubteMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024

function resolveMimeType(filename: string, type: string): string {
  if (type && erlaubteMimeTypes.includes(type)) return type
  const name = filename.toLowerCase()
  if (name.endsWith(".pdf")) return "application/pdf"
  if (name.endsWith(".doc")) return "application/msword"
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (name.endsWith(".txt")) return "text/plain"
  return ""
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 })
    }

    // Upload rate limit: 20 per hour per user (consistent with quick-intake + upload action)
    const rl = checkRateLimit(`upload:${session.user.id}`, UPLOAD_LIMIT)
    if (!rl.allowed) {
      log.warn("bulk_upload.rate_limited", { code: "RATE_LIMITED" })
      return NextResponse.json(
        { error: "Upload-Limit erreicht. Bitte in einer Stunde erneut versuchen." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(rl.retryAfterMs) } }
      )
    }

    const tenantContext = await resolveTenantContextForUser(session.user.id)
    if (tenantContext.status !== "single") {
      return NextResponse.json({ error: "Kein eindeutiger Mandantenkontext." }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const organizationName = (formData.get("organizationName") as string) || ""
    const documentType = (formData.get("documentType") as string) || "Vertrag"
    const customTitle = (formData.get("title") as string) || ""

    if (!file || file.size <= 0) {
      return NextResponse.json({ error: "Keine Datei vorhanden." }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: `Datei zu gro\u00DF (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 4 MB.` }, { status: 400 })
    }

    const mimeType = resolveMimeType(file.name, file.type)
    if (!mimeType) {
      return NextResponse.json({ error: "Dateityp nicht unterst\u00FCtzt. Erlaubt: PDF, DOC, DOCX, TXT." }, { status: 400 })
    }

    // Magic-byte validation — defense-in-depth after MIME allowlist (OWASP A05).
    // Verhindert Polyglot-/Spoofing-Uploads (z. B. Binärdatei als PDF deklariert).
    const validation = await validateUploadedFile(file, MAX_FILE_SIZE_BYTES)
    if (!validation.valid) {
      log.warn("bulk_upload.file_rejected", { code: "FILE_VALIDATION_FAILED" })
      return NextResponse.json({ error: validation.error ?? "Dateivalidierung fehlgeschlagen." }, { status: 422 })
    }

    if (!organizationName || organizationName.trim().length < 2) {
      return NextResponse.json({ error: "Organisation ist erforderlich." }, { status: 400 })
    }

    const title = customTitle.trim() || titleFromFilename(file.name)

    // 1. Create document record
    const document = await createDocumentIntake({
      tenantId: tenantContext.tenantId,
      actorId: session.user.id,
      title,
      documentType: documentType.trim() || "Vertrag",
      organizationName: organizationName.trim(),
      filename: file.name,
      mimeType,
      sizeBytes: file.size
    })

    // 2. Store file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const storedFile = await storeDocumentFile({
      tenantId: tenantContext.tenantId,
      documentId: document.id,
      originalFilename: file.name,
      mimeType,
      content: fileBuffer
    })

    // 3. Attach + extract
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

      await processDocumentExtraction({
        tenantId: tenantContext.tenantId,
        documentId: document.id,
        actorId: session.user.id
      })

      return NextResponse.json({
        status: "success",
        documentId: document.id,
        title,
        message: "Dokument erfasst und Verarbeitung gestartet."
      })
    } catch {
      log.error("bulk_upload.attach_failed", { documentId: document.id, code: "ATTACH_FAILED" })
      await deleteStoredDocumentFile(storedFile.storageKey)
      await markDocumentStorageFailure({
        tenantId: tenantContext.tenantId,
        actorId: session.user.id,
        documentId: document.id,
        errorMessage: "Dateiablage fehlgeschlagen."
      })
      return NextResponse.json({
        status: "partial",
        documentId: document.id,
        title,
        message: "Dokument angelegt, aber Dateiablage fehlgeschlagen."
      })
    }
  } catch {
    log.error("bulk_upload.failed", { code: "UPLOAD_ERROR" })
    return NextResponse.json({ error: "Upload fehlgeschlagen." }, { status: 500 })
  }
}
