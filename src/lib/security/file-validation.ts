/**
 * File Validation — Magic-Byte + MIME + Size checks
 *
 * Defense-in-depth for file uploads:
 * 1. Size check (before any reading)
 * 2. MIME type allowlist (from Content-Type header / file extension)
 * 3. Magic byte validation (actual file content, not browser-declared MIME)
 *
 * Prevents: MIME confusion attacks, polyglot files, extension spoofing.
 *
 * DSGVO Art. 32, OWASP A05 (Security Misconfiguration), A03 (Injection)
 */

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export type FileValidationResult =
  | { valid: true; mimeType: AllowedMimeType }
  | { valid: false; error: string }

/**
 * Magic byte signatures for allowed file types.
 * Each entry: prefix bytes and the canonical MIME type they represent.
 */
const MAGIC_SIGNATURES: Array<{
  bytes: number[]
  mimeType: AllowedMimeType
  label: string
}> = [
  // PDF: %PDF-
  { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], mimeType: "application/pdf", label: "PDF" },
  // DOCX / XLSX / ZIP-based Office formats: PK\x03\x04 (ZIP local file header)
  { bytes: [0x50, 0x4b, 0x03, 0x04], mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX/ZIP" },
  // DOC / XLS / PPT (Compound Document: D0 CF 11 E0 A1 B1 1A E1)
  { bytes: [0xd0, 0xcf, 0x11, 0xe0], mimeType: "application/msword", label: "DOC/Compound" },
  // Plain text: UTF-8 BOM (optional) — validated by absence of binary signatures below
]

// Byte ranges that indicate binary content in a "text/plain" file
const BINARY_INDICATORS = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x0b, 0x0c]

/**
 * Checks file magic bytes against known signatures.
 *
 * @param header  First 16+ bytes of the file
 * @param declared  MIME type declared by the browser / Content-Type header
 */
export function validateMagicBytes(
  header: Uint8Array,
  declared: string
): { ok: boolean; detected: AllowedMimeType | null; reason?: string } {
  if (header.length < 4) {
    return { ok: false, detected: null, reason: "Datei zu kurz für Typ-Erkennung" }
  }

  // Check against known binary signatures
  for (const sig of MAGIC_SIGNATURES) {
    const matches = sig.bytes.every((b, i) => header[i] === b)
    if (matches) {
      // DOCX declared as DOC or vice versa — both are acceptable for document upload
      const isOfficeFamilyMatch =
        (declared === "application/pdf" && sig.mimeType === "application/pdf") ||
        (declared.includes("openxmlformats") && sig.mimeType.includes("openxmlformats")) ||
        (declared.includes("openxmlformats") && sig.label === "DOCX/ZIP") ||
        (declared === "application/msword" && sig.mimeType === "application/msword") ||
        (declared === "application/msword" && sig.label === "DOCX/ZIP") // newer Word may use ZIP

      if (declared === "application/pdf" && sig.mimeType !== "application/pdf") {
        return {
          ok: false,
          detected: sig.mimeType,
          reason: `Dateiinhalt ist ${sig.label}, aber Content-Type ist PDF`
        }
      }

      if (!isOfficeFamilyMatch && declared !== "text/plain") {
        return {
          ok: false,
          detected: sig.mimeType,
          reason: `Dateiinhalt (${sig.label}) stimmt nicht mit deklariertem Typ (${declared}) überein`
        }
      }

      return { ok: true, detected: sig.mimeType }
    }
  }

  // No binary signature found — acceptable for text/plain
  if (declared === "text/plain") {
    const hasBinary = BINARY_INDICATORS.some((b) => Array.from(header.slice(0, 512)).includes(b))
    if (hasBinary) {
      return { ok: false, detected: null, reason: "Textdatei enthält binäre Steuerzeichen" }
    }
    return { ok: true, detected: "text/plain" }
  }

  // PDF/DOC/DOCX declared but no matching signature found
  if (declared === "application/pdf") {
    return { ok: false, detected: null, reason: "PDF-Signatur (%PDF-) nicht gefunden" }
  }
  if (declared === "application/msword" || declared.includes("openxmlformats")) {
    return { ok: false, detected: null, reason: "Office-Dokumentsignatur nicht erkannt" }
  }

  return { ok: false, detected: null, reason: "Unbekannter Dateityp" }
}

/**
 * Full file validation: size → MIME allowlist → magic bytes.
 *
 * @param file           The uploaded File object
 * @param maxBytes       Maximum allowed file size in bytes
 */
export async function validateUploadedFile(
  file: File,
  maxBytes: number
): Promise<FileValidationResult> {
  // 1. Size check
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Datei zu groß (${Math.round(file.size / 1024 / 1024)} MB). Maximum: ${Math.round(maxBytes / 1024 / 1024)} MB.`
    }
  }

  // 2. MIME allowlist
  const declaredMime = file.type?.toLowerCase() ?? ""
  if (!ALLOWED_MIME_TYPES.includes(declaredMime as AllowedMimeType)) {
    return {
      valid: false,
      error: `Dateityp nicht erlaubt. Erlaubt: PDF, DOC, DOCX, TXT.`
    }
  }

  // 3. Magic byte check — read first 16 bytes only
  const headerSlice = file.slice(0, 16)
  const headerBuffer = await headerSlice.arrayBuffer()
  const header = new Uint8Array(headerBuffer)

  const magic = validateMagicBytes(header, declaredMime)
  if (!magic.ok) {
    return {
      valid: false,
      error: magic.reason ?? "Dateiinhalt stimmt nicht mit dem deklarierten Dateityp überein."
    }
  }

  return { valid: true, mimeType: declaredMime as AllowedMimeType }
}
