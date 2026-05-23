import "server-only"

import { readStoredDocumentFile } from "@/lib/storage/document-storage"

export type ExtractionMode =
  | "txt-direct"
  | "pdf-text-layer"
  | "pdf-ocr-gemini"
  | "docx-mammoth"
  | "unsupported"

export type ExtractDocumentTextInput = {
  filename: string
  mimeType: string | null
  storageKey: string | null
}

export type ExtractDocumentTextResult = {
  status: "success" | "unsupported" | "failed"
  mode: ExtractionMode
  /** Gekürzte Vorschau für UI/DB (max MAX_PREVIEW_CHARS). */
  textPreview: string | null
  /** Vollständiger extrahierter Text — nur im Prozess/RAM, nicht in DB persistiert. */
  fullText: string | null
  errorHint: string | null
}

/**
 * Maximale Zeichen, die im Document.extractedTextPreview gespeichert werden.
 * Gross genug für eine belastbare KI-Vertragsanalyse, klein genug,
 * um Speicher-/PII-Fussabdruck zu minimieren.
 */
const MAX_PREVIEW_CHARS = 16000

/**
 * Minimale Textlaenge, damit wir ueberhaupt von "erfolgreicher Extraktion"
 * sprechen. Unterhalb davon liegt meist ein defektes oder unbrauchbares
 * Dokument vor.
 */
const MIN_VIABLE_TEXT_LENGTH = 50

/**
 * Harte Obergrenze für Dateien, die wir an Gemini Vision (OCR) schicken.
 * Groesser als 20 MB wuerde den Lambda-Budget-Rahmen sprengen und die
 * Vercel-Function-Timeouts (60s Hobby / 300s Pro) reissen.
 */
const OCR_MAX_FILE_BYTES = 20 * 1024 * 1024

/**
 * Aktiviert OCR-Fallback über Gemini Vision bei PDFs ohne Text-Layer.
 * Steuerbar per ENV, damit Self-Hoster / Test-Umgebungen ohne
 * GEMINI_API_KEY nicht in Fehler laufen.
 */
function isOcrFallbackEnabled(): boolean {
  const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim())
  // Explizit opt-out möglich (Default: aktiv, wenn Key vorhanden)
  const flag = process.env.KANZLEI_PDF_OCR_ENABLED?.trim().toLowerCase()
  if (flag === "false" || flag === "0") return false
  return hasKey
}

type FileKind = "txt" | "pdf" | "docx" | "unsupported"

function classifyFile(filename: string, mimeType: string | null): FileKind {
  const normalizedMimeType = mimeType?.toLowerCase() ?? ""
  const lowerFilename = filename.toLowerCase()

  if (normalizedMimeType === "text/plain" || lowerFilename.endsWith(".txt")) {
    return "txt"
  }
  if (normalizedMimeType === "application/pdf" || lowerFilename.endsWith(".pdf")) {
    return "pdf"
  }
  if (
    normalizedMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerFilename.endsWith(".docx")
  ) {
    return "docx"
  }
  return "unsupported"
}

/**
 * PDF-Text-Layer-Extraktion via unpdf.
 *
 * Ersetzt pdf-parse (v1.1.1 nutzt veraltetes pdfjs v1.10.100 das auf
 * Vercel Serverless mit "bad XRef entry" Fehlern abstuerzt).
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf")
  const uint8 = new Uint8Array(buffer)
  const result = await extractText(uint8)
  return Array.isArray(result.text) ? result.text.join("\n") : String(result.text)
}

/**
 * DOCX-Extraktion via mammoth (Microsoft-Word-XML -> reiner Text).
 *
 * Mammoth ist die Industrie-Standardwahl für DOCX-Extraktion in
 * Node-Serverless-Umgebungen: kein nativer Code, keine System-Deps,
 * robuste Fehlerbehandlung.
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  // Dynamischer Import, damit mammoth auf dem Cold-Start-Pfad
  // anderer Routes nicht im Bundle landet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammothModule: any = await import("mammoth")
  const mammoth = mammothModule.default ?? mammothModule

  // mammoth.extractRawText liefert reinen Text ohne Formatierung.
  // Exakt das, was wir für die Analyse-Pipeline brauchen.
  const result: { value: string; messages: Array<{ type: string; message: string }> } =
    await mammoth.extractRawText({ buffer })

  return result.value
}

/**
 * OCR-Fallback via Gemini Vision für gescannte PDFs ohne Text-Layer.
 *
 * Gemini 1.5 Flash/Pro akzeptiert PDFs direkt als inline-Input
 * (bis 20 MB). Kein Zwischenschritt über Bildkonvertierung noetig.
 *
 * Kostenrahmen: gemini-1.5-flash ist ~75% billiger als gemini-1.5-pro
 * bei vergleichbarer OCR-Qualitaet für deutschen Rechtstext.
 */
async function ocrPdfViaGemini(buffer: Buffer): Promise<string> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error("GEMINI_API_KEY ist nicht gesetzt — OCR-Fallback nicht verfügbar.")
  }

  if (buffer.byteLength > OCR_MAX_FILE_BYTES) {
    throw new Error(
      `PDF ist zu gross für OCR (${Math.round(buffer.byteLength / 1024 / 1024)} MB, Limit ${OCR_MAX_FILE_BYTES / 1024 / 1024} MB).`
    )
  }

  const geminiModule = await import("@google/generative-ai")
  // Runtime unterstützt inlineData und generationConfig — Typ-Decl ist
  // im Projekt bewusst minimal. Daher typed cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = new geminiModule.GoogleGenerativeAI(process.env.GEMINI_API_KEY) as any

  const modelId = process.env.KANZLEI_OCR_MODEL?.trim() || "gemini-1.5-flash"
  const model = client.getGenerativeModel({
    model: modelId,
    generationConfig: { temperature: 0.0 }
  })

  const base64 = buffer.toString("base64")

  // Gemini akzeptiert PDFs direkt als inlineData mit mimeType "application/pdf".
  // Kein OCR-Zwischenschritt über Page-Rasterisierung noetig.
  const response = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType: "application/pdf"
      }
    },
    {
      text: [
        "Extrahiere den vollstaendigen Text dieses Dokuments in Klartext.",
        "Behalte die urspruengliche Reihenfolge und Absatzstruktur bei.",
        "Fuege KEINE eigenen Kommentare, Zusammenfassungen oder Erklärungen hinzu.",
        "Gib nur den extrahierten Text zurück, keine Markdown-Formatierung."
      ].join(" ")
    }
  ])

  const text = response.response.text()
  return typeof text === "string" ? text : ""
}

export async function extractDocumentText(input: ExtractDocumentTextInput): Promise<ExtractDocumentTextResult> {
  if (!input.storageKey) {
    return {
      status: "failed",
      mode: "unsupported",
      textPreview: null,
      fullText: null,
      errorHint: "Keine Dateiablage vorhanden"
    }
  }

  const kind = classifyFile(input.filename, input.mimeType)

  if (kind === "unsupported") {
    return {
      status: "unsupported",
      mode: "unsupported",
      textPreview: null,
      fullText: null,
      errorHint: `Dateiformat ${input.mimeType ?? "unbekannt"} wird nicht unterstützt. Erlaubt: PDF, DOCX und TXT.`
    }
  }

  let buffer: Buffer
  try {
    buffer = await readStoredDocumentFile(input.storageKey)
  } catch (e) {
    return {
      status: "failed",
      mode: kind === "pdf" ? "pdf-text-layer" : kind === "docx" ? "docx-mammoth" : "txt-direct",
      textPreview: null,
      fullText: null,
      errorHint: `Datei konnte aus der Ablage nicht gelesen werden${e instanceof Error ? `: ${e.message}` : ""}`
    }
  }

  // TXT: direktes Decodieren
  if (kind === "txt") {
    try {
      const text = buffer.toString("utf-8").trim()
      return buildResult(text, "txt-direct")
    } catch (e) {
      return {
        status: "failed",
        mode: "txt-direct",
        textPreview: null,
      fullText: null,
        errorHint: `TXT-Datei konnte nicht dekodiert werden${e instanceof Error ? `: ${e.message}` : ""}`
      }
    }
  }

  // DOCX: Mammoth-Extraktion
  if (kind === "docx") {
    try {
      const raw = await extractDocxText(buffer)
      const normalized = raw.trim()
      if (!normalized) {
        return {
          status: "failed",
          mode: "docx-mammoth",
          textPreview: null,
      fullText: null,
          errorHint: "DOCX enthaelt keinen extrahierbaren Text (möglicherweise nur eingebettete Bilder)."
        }
      }
      return buildResult(normalized, "docx-mammoth")
    } catch (e) {
      return {
        status: "failed",
        mode: "docx-mammoth",
        textPreview: null,
      fullText: null,
        errorHint: `DOCX konnte nicht gelesen werden${e instanceof Error ? `: ${e.message}` : ""}`
      }
    }
  }

  // PDF: erst Text-Layer-Extraktion, dann OCR-Fallback
  try {
    const rawText = await extractPdfText(buffer)
    const normalized = rawText.trim()

    if (normalized) {
      return buildResult(normalized, "pdf-text-layer")
    }

    // Text-Layer leer -> OCR-Fallback, falls verfügbar und konfiguriert
    if (isOcrFallbackEnabled()) {
      try {
        const ocrText = await ocrPdfViaGemini(buffer)
        const ocrNormalized = ocrText.trim()
        if (ocrNormalized.length >= MIN_VIABLE_TEXT_LENGTH) {
          return buildResult(ocrNormalized, "pdf-ocr-gemini")
        }
        return {
          status: "failed",
          mode: "pdf-ocr-gemini",
          textPreview: null,
      fullText: null,
          errorHint: "OCR lieferte keinen verwertbaren Text. Das PDF ist möglicherweise leer, beschaedigt oder schlecht gescannt."
        }
      } catch (ocrErr) {
        return {
          status: "failed",
          mode: "pdf-ocr-gemini",
          textPreview: null,
      fullText: null,
          errorHint: `OCR-Fallback fehlgeschlagen${ocrErr instanceof Error ? `: ${ocrErr.message}` : ""}. Bitte eine OCR-Version erneut hochladen.`
        }
      }
    }

    // Kein OCR verfügbar -> klarer Hinweis für Nutzer
    return {
      status: "failed",
      mode: "pdf-text-layer",
      textPreview: null,
      fullText: null,
      errorHint: "Das PDF enthaelt keinen extrahierbaren Text-Layer (möglicherweise gescannt). Bitte eine OCR-Variante der Datei erneut hochladen."
    }
  } catch (e) {
    return {
      status: "failed",
      mode: "pdf-text-layer",
      textPreview: null,
      fullText: null,
      errorHint: `PDF konnte nicht gelesen werden${e instanceof Error ? `: ${e.message}` : ""}`
    }
  }
}

function buildResult(text: string, mode: ExtractionMode): ExtractDocumentTextResult {
  if (text.length < MIN_VIABLE_TEXT_LENGTH) {
    return {
      status: "failed",
      mode,
      textPreview: null,
      fullText: null,
      errorHint: `Extrahierter Text ist zu kurz (${text.length} Zeichen) für eine belastbare Analyse.`
    }
  }

  const textPreview = text.length > MAX_PREVIEW_CHARS ? text.slice(0, MAX_PREVIEW_CHARS) : text

  return {
    status: "success",
    mode,
    textPreview,
    fullText: text,
    errorHint: null
  }
}
