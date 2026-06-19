export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 10

import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"
import { CRONUS_DEMO_CONTRACTS } from "@/lib/dynamics/demo-data"

/**
 * POST /api/workspace/bc/import
 * Importiert einen BC-Vertrag als Dokument und startet automatisch die KI-Analyse.
 * Body: { contractId: string }
 * Returns: { documentId: string; runId: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const tenantCtx = await resolveTenantContextForUser(session.user.id)
  if (tenantCtx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })
  }
  const tenantId = tenantCtx.tenantId

  const body = await req.json().catch(() => ({})) as { contractId?: unknown }
  const { contractId } = body

  if (!contractId || typeof contractId !== "string") {
    return NextResponse.json({ error: "contractId fehlt" }, { status: 400 })
  }

  const contract = CRONUS_DEMO_CONTRACTS.find(c => c.id === contractId)
  if (!contract) {
    return NextResponse.json({ error: "Vertrag nicht gefunden" }, { status: 404 })
  }

  // Check if this BC contract was already imported (avoid duplicates)
  const existing = await prisma.document.findFirst({
    where: { tenantId, filename: `bc-${contract.bcId}.txt`, deletedAt: null },
    select: { id: true, analysisRuns: { where: { status: { in: ["QUEUED", "RUNNING", "COMPLETED"] } }, select: { id: true, status: true }, take: 1 } }
  })

  if (existing) {
    const run = existing.analysisRuns[0]
    return NextResponse.json({
      documentId: existing.id,
      runId: run?.id ?? null,
      alreadyImported: true
    })
  }

  // Create the document with extracted text pre-loaded (VERARBEITET state)
  const document = await prisma.document.create({
    data: {
      tenantId,
      uploadedById: session.user.id,
      title: contract.title,
      documentType: contract.contractType,
      organizationName: contract.vendor,
      filename: `bc-${contract.bcId}.txt`,
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(contract.text, "utf8"),
      processingStatus: "VERARBEITET",
      extractedTextPreview: contract.text,
      processedAt: new Date(),
      textExtractedAt: new Date(),
      retentionUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 6),
      status: "EINGEGANGEN"
    },
    select: { id: true }
  })

  // Create analysis run in QUEUED state
  const run = await prisma.analysisRun.create({
    data: {
      tenantId,
      documentId: document.id,
      userId: session.user.id,
      status: "QUEUED",
      progress: 0,
      retentionUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 6)
    },
    select: { id: true }
  })

  // Dispatch analysis worker async
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? new URL(req.url).origin
  const workerUrl = `${baseUrl}/api/workspace/analysis/run`

  waitUntil(
    fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Token": process.env.WORKER_TOKEN ?? ""
      },
      body: JSON.stringify({ runId: run.id }),
      cache: "no-store"
    })
      .then(res => {
        if (!res.ok) console.error("[bc.import] worker dispatch non-ok:", res.status, run.id)
      })
      .catch(err => {
        console.error("[bc.import] worker dispatch failed:", (err as Error).message, run.id)
      })
  )

  return NextResponse.json({
    documentId: document.id,
    runId: run.id,
    alreadyImported: false
  })
}
