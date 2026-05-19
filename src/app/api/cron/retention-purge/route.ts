export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { log } from "@/lib/security/secure-logging"

/**
 * Retention Purge Cron Job (Audit R-06)
 *
 * DSGVO Art. 5 (Speicherbegrenzung), Art. 17 (Recht auf Löschung), Art. 25 (Privacy by Design)
 *
 * Aufgaben:
 * 1. Soft-deleted Documents (deletedAt gesetzt) → Hard-Delete nach 30 Tagen Grace Period
 * 2. Retention-abgelaufene Documents (retentionUntil in der Vergangenheit) → Soft-Delete, dann Hard-Delete
 * 3. Verwaiste AnalysisRuns ohne Document → Hard-Delete
 *
 * Aufruf: Vercel Cron (täglich) oder manuell via CRON_SECRET Header.
 */
export async function GET(req: NextRequest) {
  // Auth: Nur mit CRON_SECRET oder Vercel Cron Header
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  const vercelCron = req.headers.get("x-vercel-cron")

  if (!vercelCron && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const now = new Date()
  const gracePeriodMs = 30 * 24 * 60 * 60 * 1000 // 30 Tage
  const hardDeleteBefore = new Date(now.getTime() - gracePeriodMs)

  const results = {
    retentionExpired: 0,
    softDeletedPurged: 0,
    analysisRunsPurged: 0,
    findingsPurged: 0,
    errors: [] as string[]
  }

  try {
    // ── 1. Retention-abgelaufene Dokumente → Soft-Delete ──
    const expiredDocs = await prisma.document.findMany({
      where: {
        retentionUntil: { lte: now },
        deletedAt: null // Noch nicht soft-deleted
      },
      select: { id: true, tenantId: true }
    })

    if (expiredDocs.length > 0) {
      await prisma.document.updateMany({
        where: { id: { in: expiredDocs.map(d => d.id) } },
        data: { deletedAt: now }
      })
      results.retentionExpired = expiredDocs.length
      log.audit("retention_expired_soft_delete", "system", {
        count: expiredDocs.length,
        tenants: [...new Set(expiredDocs.map(d => d.tenantId))]
      })
    }

    // ── 2. Soft-deleted Dokumente nach Grace Period → Hard-Delete ──
    const purgeDocs = await prisma.document.findMany({
      where: {
        deletedAt: { lte: hardDeleteBefore }
      },
      select: { id: true, tenantId: true }
    })

    if (purgeDocs.length > 0) {
      const docIds = purgeDocs.map(d => d.id)

      // Cascade: erst abhängige Daten löschen
      // FindingReviews → Findings → AnalysisRuns → AnalysisLogs → Document
      await prisma.$transaction(async (tx) => {
        // Delete FindingReviews for these documents' findings
        const findingIds = await tx.analysisFinding.findMany({
          where: { documentId: { in: docIds } },
          select: { id: true }
        })
        if (findingIds.length > 0) {
          await tx.analysisFindingReview.deleteMany({
            where: { analysisFindingId: { in: findingIds.map(f => f.id) } }
          })
          await tx.analysisFinding.deleteMany({
            where: { documentId: { in: docIds } }
          })
          results.findingsPurged += findingIds.length
        }

        // Delete AnalysisRuns
        const runs = await tx.analysisRun.deleteMany({
          where: { documentId: { in: docIds } }
        })
        results.analysisRunsPurged += runs.count

        // Delete AnalysisLogs
        await tx.analysisLog.deleteMany({
          where: { documentId: { in: docIds } }
        })

        // Delete DocumentExtractions
        await tx.documentExtraction.deleteMany({
          where: { documentId: { in: docIds } }
        })

        // Delete AuditEvents referencing these documents
        await tx.auditEvent.deleteMany({
          where: { documentId: { in: docIds } }
        })

        // Finally: Hard-Delete Documents
        await tx.document.deleteMany({
          where: { id: { in: docIds } }
        })
      })

      results.softDeletedPurged = purgeDocs.length
      log.audit("retention_hard_delete", "system", {
        documents: purgeDocs.length,
        findings: results.findingsPurged,
        analysisRuns: results.analysisRunsPurged,
        tenants: [...new Set(purgeDocs.map(d => d.tenantId))]
      })
    }

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
    results.errors.push(msg)
    log.error("retention_purge_error", { error: msg })
  }

  log.info("retention_purge_complete", {
    retentionExpired: results.retentionExpired,
    softDeletedPurged: results.softDeletedPurged,
    analysisRunsPurged: results.analysisRunsPurged,
    findingsPurged: results.findingsPurged,
    errors: results.errors.length
  })

  return NextResponse.json({
    ok: results.errors.length === 0,
    timestamp: now.toISOString(),
    ...results
  })
}
