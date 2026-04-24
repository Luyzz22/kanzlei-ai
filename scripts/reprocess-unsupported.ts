/**
 * reprocess-unsupported.ts
 *
 * Fuehrt Text-Extraktion erneut fuer alle Dokumente mit
 * processingStatus = NICHT_UNTERSTUETZT oder FEHLGESCHLAGEN durch.
 *
 * Verwendung:
 *   1) Lokal (gegen Prod-DB):
 *      DATABASE_URL="..." BLOB_READ_WRITE_TOKEN="..." \
 *        pnpm tsx scripts/reprocess-unsupported.ts
 *
 *   2) Vercel CLI (sicherer, mit Prod-Env):
 *      vercel env pull .env.production.local
 *      pnpm tsx scripts/reprocess-unsupported.ts
 *
 *   3) Nur Simulation ohne DB-Update:
 *      REPROCESS_DRY_RUN=1 pnpm tsx scripts/reprocess-unsupported.ts
 *
 *   4) Nur bestimmte Tenants:
 *      REPROCESS_TENANTS="tenant-id-1,tenant-id-2" pnpm tsx scripts/reprocess-unsupported.ts
 *
 * Sicherheit:
 *   - Laeuft ausschliesslich gegen Docs mit bekannten "nicht erfolg-
 *     reichen" Zustaenden. VERARBEITET-Docs bleiben unberuehrt.
 *   - Keine Tenant-Isolation-Verletzung: jeder Reprocess-Call geht durch
 *     processDocumentExtraction(), das die bestehenden Berechtigungs-
 *     und Tenant-Checks enthaelt.
 *   - AuditEvent wird pro Call geschrieben (document.processing.started
 *     / completed), damit die Aktion revisionsnah bleibt.
 */

import { prisma } from "@/lib/prisma"
import { processDocumentExtraction } from "@/lib/documents/processing-core"

type ReprocessTarget = {
  id: string
  tenantId: string
  title: string
  filename: string
  processingStatus: string
  uploadedById: string | null
}

async function main(): Promise<void> {
  const dryRun = process.env.REPROCESS_DRY_RUN === "1" || process.env.REPROCESS_DRY_RUN === "true"
  const tenantFilter = process.env.REPROCESS_TENANTS?.trim()
    ? process.env.REPROCESS_TENANTS.split(",").map((t: string) => t.trim()).filter(Boolean)
    : null

  console.log("=".repeat(70))
  console.log("KanzleiAI — Reprocess Unsupported/Failed Documents")
  console.log("=".repeat(70))
  console.log(`Mode:           ${dryRun ? "DRY RUN (no DB writes)" : "LIVE (DB updates)"}`)
  console.log(`Tenant filter:  ${tenantFilter ? tenantFilter.join(", ") : "(all tenants)"}`)
  console.log()

  // Kandidaten laden: alle Docs mit NICHT_UNTERSTUETZT oder FEHLGESCHLAGEN,
  // optional gefiltert auf bestimmte Tenants.
  const targets: ReprocessTarget[] = await prisma.document.findMany({
    where: {
      processingStatus: { in: ["NICHT_UNTERSTUETZT", "FEHLGESCHLAGEN"] },
      ...(tenantFilter ? { tenantId: { in: tenantFilter } } : {})
    },
    select: {
      id: true,
      tenantId: true,
      title: true,
      filename: true,
      processingStatus: true,
      uploadedById: true
    },
    orderBy: { createdAt: "desc" }
  })

  if (targets.length === 0) {
    console.log("Keine Kandidaten gefunden. Nichts zu tun.")
    await prisma.$disconnect()
    return
  }

  console.log(`${targets.length} Kandidaten gefunden:`)
  for (const t of targets) {
    console.log(`  - [${t.processingStatus.padEnd(18)}] ${t.tenantId.slice(0, 8)}… — ${t.title} (${t.filename})`)
  }
  console.log()

  if (dryRun) {
    console.log("DRY RUN: keine Aenderungen geschrieben.")
    await prisma.$disconnect()
    return
  }

  let successCount = 0
  let failedCount = 0
  let unsupportedCount = 0
  let skippedCount = 0
  const errors: Array<{ documentId: string; title: string; error: string }> = []

  for (const target of targets) {
    process.stdout.write(`  Reprocessing ${target.id.slice(0, 10)}… (${target.title.slice(0, 40)})... `)

    // AuditEvent verlangt einen actorId. Wenn uploadedById null ist (selten:
    // z. B. System-Imports, geseedete Docs), muessen wir das Doc ueberspringen
    // oder einen Admin als Actor erzwingen. Wir ueberspringen hier bewusst,
    // damit der Audit-Trail korrekt bleibt und nie ein fremder User als
    // Reprocess-Actor auftaucht.
    if (!target.uploadedById) {
      console.log("⏭️  uebersprungen (kein uploadedById — wahrscheinlich Seed-Doc)")
      skippedCount++
      continue
    }

    try {
      const result = await processDocumentExtraction({
        tenantId: target.tenantId,
        documentId: target.id,
        // Wir nutzen den uploadedById als actorId, damit AuditEvents sauber
        // auf den urspruenglichen Eigentuemer des Dokuments verweisen.
        actorId: target.uploadedById
      })

      if (!result) {
        console.log("❌ Dokument nicht mehr verfuegbar (evtl. geloescht)")
        errors.push({
          documentId: target.id,
          title: target.title,
          error: "processDocumentExtraction lieferte null"
        })
        failedCount++
        continue
      }

      if (result.processingStatus === "VERARBEITET") {
        console.log("✅ VERARBEITET")
        successCount++
      } else if (result.processingStatus === "NICHT_UNTERSTUETZT") {
        console.log(`⚠️  weiterhin NICHT_UNTERSTUETZT (${result.processingError ?? "kein Grund"})`)
        unsupportedCount++
      } else {
        console.log(`❌ FEHLGESCHLAGEN (${result.processingError ?? "unbekannter Fehler"})`)
        errors.push({
          documentId: target.id,
          title: target.title,
          error: result.processingError ?? "unbekannt"
        })
        failedCount++
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log(`❌ EXCEPTION: ${msg}`)
      errors.push({
        documentId: target.id,
        title: target.title,
        error: msg
      })
      failedCount++
    }
  }

  console.log()
  console.log("=".repeat(70))
  console.log("Zusammenfassung")
  console.log("=".repeat(70))
  console.log(`✅ Erfolgreich verarbeitet:      ${successCount}`)
  console.log(`⚠️  Weiterhin nicht unterstuetzt: ${unsupportedCount}`)
  console.log(`❌ Fehlgeschlagen:              ${failedCount}`)
  console.log(`⏭️  Uebersprungen (kein actor):  ${skippedCount}`)
  console.log(`   Gesamt:                      ${targets.length}`)

  if (errors.length > 0) {
    console.log()
    console.log("Fehler-Details:")
    for (const err of errors) {
      console.log(`  [${err.documentId.slice(0, 10)}…] ${err.title}`)
      console.log(`     → ${err.error}`)
    }
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("Script fehlgeschlagen:", e)
  // Best-effort disconnect
  prisma.$disconnect().finally(() => {
    process.exit(1)
  })
})
