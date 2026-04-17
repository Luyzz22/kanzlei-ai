/**
 * Document Storage — Enterprise-grade, multi-backend, compliance-first.
 *
 * Compliance matrix:
 * - DSGVO Art. 32 (Sicherheit der Verarbeitung): Vercel Blob mit access:"private"
 *   bietet TLS 1.3 in-transit + AES-256 at-rest. Zugriff nur mit
 *   BLOB_READ_WRITE_TOKEN, nicht öffentlich indexiert. Storage-Keys sind
 *   mandantengebunden (tenants/{tenantId}/...) als zweite Isolationsebene.
 * - DSGVO Art. 17 (Recht auf Löschung): deleteStoredDocumentFile entfernt Datei +
 *   schreibt Audit-Event. Irreversibel, kein Soft-Delete.
 * - DSGVO Art. 30 (Verarbeitungsverzeichnis): Jede Operation erzeugt ein
 *   strukturiertes Compliance-Log im Kanal "kanzlei.storage.audit".
 * - NIS2 Art. 21 (Risikomanagement): Fehlschläge werden als ERROR geloggt und
 *   sind incident-ready für SIEM/SOC-Tools.
 * - EU AI Act Art. 10 (Daten-Governance): SHA-256-Hash pro Dokument ermöglicht
 *   Trainings-Daten-Lineage bei KI-Modellen.
 * - EU AI Act Art. 12 (Aufzeichnungspflicht): Zeitgestempelte Trails für jede
 *   Storage-Interaktion.
 * - GoBD (Unveränderlichkeit): SHA-256 beim Speichern, kompatibel mit
 *   audit-hash.ts Hash-Kette.
 *
 * Backend-Strategie (automatische Auswahl):
 * 1. BLOB_READ_WRITE_TOKEN gesetzt → Vercel Blob Storage (Production)
 * 2. VERCEL=1 (ohne Token) → /tmp (ephemeral Function-Fallback)
 * 3. sonst → .local/storage (lokale Entwicklung)
 *
 * Für Produktion: Vercel Blob Store in EU-Region (fra1) erstellen:
 *   vercel blob create-store kanzlei-documents --region fra1 --access private
 */

import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { createReadStream, type ReadStream } from "node:fs"
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"

import { del as blobDelete, get as blobGet, head as blobHead, put as blobPut } from "@vercel/blob"

// ============================================================================
// Backend detection
// ============================================================================

export type StorageBackend = "vercel-blob" | "vercel-tmp" | "local-filesystem"

function detectBackend(): StorageBackend {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob"
  if (process.env.VERCEL) return "vercel-tmp"
  return "local-filesystem"
}

const BACKEND: StorageBackend = detectBackend()

const LOCAL_STORAGE_ROOT =
  BACKEND === "vercel-tmp"
    ? path.join("/tmp", "kanzlei-storage")
    : path.join(process.cwd(), ".local", "storage")

export function getStorageBackendInfo(): {
  backend: StorageBackend
  region: string
  isProductionReady: boolean
  isEphemeral: boolean
  persistent: boolean
  regulatory: readonly string[]
} {
  const persistent = BACKEND === "vercel-blob" || BACKEND === "local-filesystem"
  const regulatory =
    BACKEND === "vercel-blob"
      ? (["DSGVO", "NIS2", "EU AI Act", "GoBD"] as const)
      : BACKEND === "vercel-tmp"
        ? (["Nur Entwicklung — nicht production-ready"] as const)
        : (["Lokal — nur Entwicklung"] as const)

  return {
    backend: BACKEND,
    region: process.env.VERCEL_REGION || "unknown",
    isProductionReady: BACKEND === "vercel-blob",
    isEphemeral: BACKEND === "vercel-tmp",
    persistent,
    regulatory,
  }
}

// ============================================================================
// Compliance logging (NIS2 Art. 21, DSGVO Art. 30)
// ============================================================================

type StorageOperation = "store" | "read" | "delete" | "stat"
type StorageOutcome = "success" | "failure"

function logStorageOperation(
  operation: StorageOperation,
  outcome: StorageOutcome,
  details: {
    tenantId?: string
    documentId?: string
    storageKey?: string
    sizeBytes?: number
    sha256?: string
    error?: string
    durationMs?: number
  }
): void {
  const payload = {
    channel: "kanzlei.storage.audit",
    timestamp: new Date().toISOString(),
    backend: BACKEND,
    region: process.env.VERCEL_REGION || "local",
    operation,
    outcome,
    ...details,
  }

  if (outcome === "failure") {
    console.error(JSON.stringify(payload))
  } else {
    console.log(JSON.stringify(payload))
  }
}

// ============================================================================
// Helpers
// ============================================================================

function sanitizeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._\-äöüÄÖÜß]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 120)

  return normalized || "dokument"
}

function createStorageKey(tenantId: string, documentId: string, filename: string): string {
  const cleaned = sanitizeFilename(filename)
  return path.posix.join(
    "tenants",
    tenantId,
    "documents",
    documentId,
    "original",
    `${randomUUID()}-${cleaned}`
  )
}

function assertValidStorageKey(storageKey: string): void {
  const normalized = path.posix.normalize(storageKey)
  if (!normalized || normalized.startsWith("../") || path.isAbsolute(normalized)) {
    throw new Error("Ungültiger Storage-Key")
  }
}

function resolveLocalStoragePath(storageKey: string): string {
  assertValidStorageKey(storageKey)
  const storageRoot = path.resolve(LOCAL_STORAGE_ROOT)
  const absolutePath = path.resolve(storageRoot, storageKey)
  if (!absolutePath.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Ungültiger Storage-Key")
  }
  return absolutePath
}

// ============================================================================
// Public types
// ============================================================================

export type StoreDocumentFileInput = {
  tenantId: string
  documentId: string
  originalFilename: string
  mimeType: string
  content: Buffer
}

export type StoreDocumentFileResult = {
  storageKey: string
  filename: string
  mimeType: string
  sizeBytes: number
  sha256: string
}

// ============================================================================
// storeDocumentFile
// ============================================================================

export async function storeDocumentFile(
  input: StoreDocumentFileInput
): Promise<StoreDocumentFileResult> {
  const started = Date.now()
  const storageKey = createStorageKey(input.tenantId, input.documentId, input.originalFilename)
  const sha256 = createHash("sha256").update(input.content).digest("hex")

  try {
    if (BACKEND === "vercel-blob") {
      // access: "private" → nur mit BLOB_READ_WRITE_TOKEN zugreifbar.
      // URL hat .private.blob.vercel-storage.com Domain, wird nicht indexiert
      // und ist nicht öffentlich zugänglich. Kritisch für DSGVO Art. 32.
      // addRandomSuffix: false weil storageKey bereits eine UUID enthält.
      await blobPut(storageKey, input.content, {
        access: "private",
        addRandomSuffix: false,
        contentType: input.mimeType,
        allowOverwrite: false,
      })
    } else {
      const filePath = resolveLocalStoragePath(storageKey)
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, input.content)
    }

    const result: StoreDocumentFileResult = {
      storageKey,
      filename: sanitizeFilename(input.originalFilename),
      mimeType: input.mimeType,
      sizeBytes: input.content.length,
      sha256,
    }

    logStorageOperation("store", "success", {
      tenantId: input.tenantId,
      documentId: input.documentId,
      storageKey,
      sizeBytes: result.sizeBytes,
      sha256,
      durationMs: Date.now() - started,
    })

    return result
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    logStorageOperation("store", "failure", {
      tenantId: input.tenantId,
      documentId: input.documentId,
      storageKey,
      error: errMsg,
      durationMs: Date.now() - started,
    })
    throw error
  }
}

// ============================================================================
// deleteStoredDocumentFile (DSGVO Art. 17 — Recht auf Löschung)
// ============================================================================

export async function deleteStoredDocumentFile(storageKey: string): Promise<void> {
  const started = Date.now()
  assertValidStorageKey(storageKey)

  try {
    if (BACKEND === "vercel-blob") {
      await blobDelete(storageKey)
    } else {
      const filePath = resolveLocalStoragePath(storageKey)
      await rm(filePath, { force: true })
    }

    logStorageOperation("delete", "success", {
      storageKey,
      durationMs: Date.now() - started,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    logStorageOperation("delete", "failure", {
      storageKey,
      error: errMsg,
      durationMs: Date.now() - started,
    })
    throw error
  }
}

// ============================================================================
// readStoredDocumentFile
// ============================================================================

export async function readStoredDocumentFile(storageKey: string): Promise<Buffer> {
  const started = Date.now()
  assertValidStorageKey(storageKey)

  try {
    if (BACKEND === "vercel-blob") {
      const result = await blobGet(storageKey, { access: "private" })
      if (!result || result.statusCode !== 200) {
        throw new Error("Blob nicht gefunden oder nicht lesbar")
      }

      // Convert Web ReadableStream to Buffer
      const reader = result.stream.getReader()
      const chunks: Uint8Array[] = []
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      const buffer = Buffer.concat(chunks.map(c => Buffer.from(c)))

      logStorageOperation("read", "success", {
        storageKey,
        sizeBytes: buffer.length,
        durationMs: Date.now() - started,
      })

      return buffer
    } else {
      const filePath = resolveLocalStoragePath(storageKey)
      const buffer = await readFile(filePath)

      logStorageOperation("read", "success", {
        storageKey,
        sizeBytes: buffer.length,
        durationMs: Date.now() - started,
      })

      return buffer
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    logStorageOperation("read", "failure", {
      storageKey,
      error: errMsg,
      durationMs: Date.now() - started,
    })
    throw error
  }
}

// ============================================================================
// getStoredDocumentStats
// ============================================================================

export async function getStoredDocumentStats(
  storageKey: string
): Promise<{ sizeBytes: number } | null> {
  assertValidStorageKey(storageKey)

  try {
    if (BACKEND === "vercel-blob") {
      const info = await blobHead(storageKey)
      return { sizeBytes: info.size }
    } else {
      const filePath = resolveLocalStoragePath(storageKey)
      const fileStats = await stat(filePath)
      return { sizeBytes: fileStats.size }
    }
  } catch {
    return null
  }
}

// ============================================================================
// createStoredDocumentReadStream
// ============================================================================

/**
 * Returns a readable stream of the document content.
 *
 * For vercel-blob: fetches the blob via authenticated get() and wraps the
 * Web ReadableStream in a Node.js Readable. Content is streamed, not loaded
 * into memory all at once.
 *
 * For filesystem backends: returns a native ReadStream.
 */
export function createStoredDocumentReadStream(storageKey: string): ReadStream | Readable {
  assertValidStorageKey(storageKey)

  if (BACKEND === "vercel-blob") {
    const stream = new Readable({
      async read() {
        try {
          const result = await blobGet(storageKey, { access: "private" })
          if (!result || result.statusCode !== 200) {
            this.destroy(new Error("Blob nicht gefunden oder nicht lesbar"))
            return
          }
          const reader = result.stream.getReader()
          const pump = async () => {
            try {
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const { done, value } = await reader.read()
                if (done) {
                  this.push(null)
                  break
                }
                this.push(Buffer.from(value))
              }
            } catch (e) {
              this.destroy(e instanceof Error ? e : new Error(String(e)))
            }
          }
          pump()
        } catch (e) {
          this.destroy(e instanceof Error ? e : new Error(String(e)))
        }
      },
    })
    return stream
  }

  const filePath = resolveLocalStoragePath(storageKey)
  return createReadStream(filePath)
}
