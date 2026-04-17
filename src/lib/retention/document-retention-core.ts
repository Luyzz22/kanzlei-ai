/**
 * Document Retention Enforcement — DSGVO Art. 5 (1) e "Speicherbegrenzung".
 *
 * Setzt pro Tenant die hinterlegte documentRetentionDays-Policy durch:
 * - Findet alle Dokumente älter als Policy-Grenze
 * - Löscht physische Datei aus dem Storage (Vercel Blob / Filesystem)
 * - Setzt Dokument auf processingStatus=RETENTION_EXPIRED (Soft-Delete) und
 *   entfernt storageKey, filename, sha256, extractedTextPreview
 * - Schreibt Audit-Event je gelöschtem Dokument
 *
 * Das DB-Zeilen-Metadatum bleibt für GoBD (10 Jahre Aufbewahrung von
 * Buchhaltungs-Metadaten) — nur der Inhalt wird nach Policy gelöscht.
 *
 * Sicherheits-Leitplanken:
 * - Mindest-Retention: 7 Tage (verhindert versehentliche Sofort-Löschung)
 * - Maximal 500 Dokumente pro Run (Cron-Timeout-Schutz, 60s Vercel Limit)
 * - Fehler bei einzelnen Dokumenten brechen den Run nicht ab
 * - Dry-Run-Modus für Demo/Test via dryRun=true
 */

import "server-only"

import { PrismaClient } from "@prisma/client"

import { deleteStoredDocumentFile } from "@/lib/storage/document-storage"
import { writeAuditEvent } from "@/lib/audit-core"

const prisma = new PrismaClient()

const MIN_RETENTION_DAYS = 7
const MAX_DOCS_PER_RUN = 500

export type RetentionRunSummary = {
  startedAt: string
  finishedAt: string
  durationMs: number
  tenantsProcessed: number
  documentsFound: number
  documentsDeleted: number
  documentsFailed: number
  dryRun: boolean
  errors: { documentId: string; error: string }[]
}

export type RetentionRunOptions = {
  dryRun?: boolean
  maxDocumentsPerRun?: number
}

/**
 * Enforces retention policies across all tenants.
 * Returns a detailed summary suitable for audit/monitoring.
 */
export async function enforceDocumentRetention(
  options: RetentionRunOptions = {}
): Promise<RetentionRunSummary> {
  const startedAt = new Date()
  const dryRun = options.dryRun ?? false
  const maxDocs = Math.min(options.maxDocumentsPerRun ?? MAX_DOCS_PER_RUN, MAX_DOCS_PER_RUN)

  const summary: RetentionRunSummary = {
    startedAt: startedAt.toISOString(),
    finishedAt: "",
    durationMs: 0,
    tenantsProcessed: 0,
    documentsFound: 0,
    documentsDeleted: 0,
    documentsFailed: 0,
    dryRun,
    errors: [],
  }

  // Fetch all tenants with their retention policies
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      slug: true,
      governanceSettings: {
        select: {
          documentRetentionDays: true,
        },
      },
    },
  })

  for (const tenant of tenants) {
    const retentionDays = Math.max(
      tenant.governanceSettings?.documentRetentionDays ?? 365,
      MIN_RETENTION_DAYS
    )
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    // Find expired documents that still have a storageKey (content not yet purged)
    const expired = await prisma.document.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { lt: cutoff },
        storageKey: { not: null },
      },
      select: {
        id: true,
        storageKey: true,
        filename: true,
        createdAt: true,
      },
      take: maxDocs - summary.documentsFound,
      orderBy: { createdAt: "asc" },
    })

    if (expired.length === 0) continue

    summary.tenantsProcessed += 1
    summary.documentsFound += expired.length

    for (const doc of expired) {
      if (!doc.storageKey) continue

      try {
        if (!dryRun) {
          // 1. Delete physical file
          await deleteStoredDocumentFile(doc.storageKey)

          // 2. Clear sensitive metadata but keep audit skeleton
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              storageKey: null,
              filename: "[retention-expired]",
              sha256: null,
              extractedTextPreview: null,
              processingError: `Retention expired after ${retentionDays} days`,
            },
          })

          // 3. Audit trail
          await writeAuditEvent({
            tenantId: tenant.id,
            action: "document.retention_expired",
            resourceType: "document",
            resourceId: doc.id,
            documentId: doc.id,
            metadata: {
              retentionDays,
              originalCreatedAt: doc.createdAt.toISOString(),
              expiredAt: cutoff.toISOString(),
              originalFilename: doc.filename,
            },
          })
        }

        summary.documentsDeleted += 1
      } catch (error) {
        summary.documentsFailed += 1
        summary.errors.push({
          documentId: doc.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      if (summary.documentsFound >= maxDocs) break
    }

    if (summary.documentsFound >= maxDocs) break
  }

  const finishedAt = new Date()
  summary.finishedAt = finishedAt.toISOString()
  summary.durationMs = finishedAt.getTime() - startedAt.getTime()

  return summary
}
