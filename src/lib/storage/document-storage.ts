import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { createReadStream } from "node:fs"
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"

const STORAGE_ROOT = path.join(process.cwd(), ".local", "storage")

function resolveStoragePath(storageKey: string): string {
  const normalizedKey = path.posix.normalize(storageKey)

  if (!normalizedKey || normalizedKey.startsWith("../") || path.isAbsolute(normalizedKey)) {
    throw new Error("Ungültiger Storage-Key")
  }

  const storageRoot = path.resolve(STORAGE_ROOT)
  const absolutePath = path.resolve(storageRoot, normalizedKey)

  if (!absolutePath.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Ungültiger Storage-Key")
  }

  return absolutePath
}

function sanitizeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-äöüÄÖÜß]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 120)

  if (!normalized) {
    return "dokument"
  }

  return normalized
}

function createStorageKey(tenantId: string, documentId: string, filename: string): string {
  const cleaned = sanitizeFilename(filename)
  return path.posix.join("tenants", tenantId, "documents", documentId, "original", `${randomUUID()}-${cleaned}`)
}

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

export async function storeDocumentFile(input: StoreDocumentFileInput): Promise<StoreDocumentFileResult> {
  const storageKey = createStorageKey(input.tenantId, input.documentId, input.originalFilename)
  const filePath = resolveStoragePath(storageKey)

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, input.content)

  const storedStats = await stat(filePath)

  return {
    storageKey,
    filename: sanitizeFilename(input.originalFilename),
    mimeType: input.mimeType,
    sizeBytes: storedStats.size,
    sha256: createHash("sha256").update(input.content).digest("hex")
  }
}

export async function deleteStoredDocumentFile(storageKey: string): Promise<void> {
  const filePath = resolveStoragePath(storageKey)
  await rm(filePath, { force: true })
}

export async function readStoredDocumentFile(storageKey: string): Promise<Buffer> {
  const filePath = resolveStoragePath(storageKey)
  return readFile(filePath)
}

export async function getStoredDocumentStats(storageKey: string): Promise<{ sizeBytes: number } | null> {
  try {
    const filePath = resolveStoragePath(storageKey)
    const fileStats = await stat(filePath)
    return { sizeBytes: fileStats.size }
  } catch {
    return null
  }
}

export function createStoredDocumentReadStream(storageKey: string) {
  const filePath = resolveStoragePath(storageKey)
  return createReadStream(filePath)
}
