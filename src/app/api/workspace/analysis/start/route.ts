import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"

export const runtime = "nodejs"
export const maxDuration = 10

/**
 * KanzleiAI v5.0 Stage-Chunked Pipeline — /start Endpoint.
 *
 * Erstellt einen neuen AnalysisRun in status=QUEUED und dispatched den ersten
 * Worker-Aufruf. Der Worker führt jede Stage als separaten Lambda-Aufruf aus
 * (siehe /api/workspace/analysis/run + analysis-run-stages.ts).
 *
 * Idempotenz: laufende Runs werden zurückgegeben STATT ein Duplikat zu starten.
 * Stale-Detection: Zombie-Runs (RUNNING > 30 min ohne Update) zählen NICHT als
 * "in-flight" — damit der User nach einem Lambda-Crash neu starten kann ohne
 * auf den nächsten Cron-Sweep warten zu müssen.
 */

const STALE_RUN_THRESHOLD_MS = 30 * 60 * 1000 // 30 min

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const tenantCtx = await resolveTenantContextForUser(session.user.id)
  const tenantId = tenantCtx.status === "single" ? tenantCtx.tenantId : null
  if (!tenantId) {
    return NextResponse.json({ error: "no_tenant" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { documentId } = body as { documentId?: unknown }

  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ error: "missing_document_id" }, { status: 400 })
  }

  // Tenant-Isolation: Dokument muss zum Tenant gehören
  const doc = await prisma.document.findFirst({
    where: { id: documentId, tenantId, deletedAt: null },
    select: { id: true }
  })
  if (!doc) {
    return NextResponse.json({ error: "document_not_found" }, { status: 404 })
  }

  // Idempotenz: nur FRISCH laufende Runs zurückgeben.
  // Zombies (RUNNING > 30 min, kein updatedAt-Update) werden ignoriert,
  // damit der User nicht durch hängende Lambda-Hard-Kills blockiert wird.
  const freshCutoff = new Date(Date.now() - STALE_RUN_THRESHOLD_MS)
  const inFlight = await prisma.analysisRun.findFirst({
    where: {
      documentId,
      tenantId,
      status: { in: ["QUEUED", "RUNNING"] },
      updatedAt: { gt: freshCutoff }
    },
    select: { id: true, status: true, progress: true, currentStage: true },
    orderBy: { createdAt: "desc" }
  })
  if (inFlight) {
    return NextResponse.json({
      runId: inFlight.id,
      status: inFlight.status,
      progress: inFlight.progress,
      currentStage: inFlight.currentStage,
      resumed: true
    })
  }

  // Stale RUNNING Runs proaktiv auf FAILED setzen, damit sie nicht später
  // den nächsten Sweep-Cron beanspruchen oder Statistiken verzerren.
  await prisma.analysisRun
    .updateMany({
      where: {
        documentId,
        tenantId,
        status: { in: ["QUEUED", "RUNNING"] },
        updatedAt: { lte: freshCutoff }
      },
      data: {
        status: "FAILED",
        errorCode: "STALE_RUN_AUTO_CLOSED",
        error: "Run wurde durch /start auto-geschlossen (>30 min ohne Update).",
        completedAt: new Date()
      }
    })
    .catch((err) => {
      console.warn(
        "[analysis.start.v5] stale auto-close fehlgeschlagen:",
        err instanceof Error ? err.message : String(err)
      )
    })

  // Neuen Run erstellen
  const run = await prisma.analysisRun.create({
    data: {
      tenantId,
      documentId,
      userId: session.user.id,
      status: "QUEUED",
      progress: 0,
      // GoBD-nahe Aufbewahrungsfrist: 6 Jahre
      retentionUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 6)
    },
    select: { id: true, status: true }
  })

  // Worker async triggern via Vercel waitUntil().
  // NEXTAUTH_URL = Production-Domain (www.kanzlei-ai.com), NICHT die
  // deployment-spezifische URL hinter Vercel SSO.
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? req.nextUrl.origin
  const workerUrl = `${baseUrl}/api/workspace/analysis/run`

  console.log("[analysis.start.v5] dispatching worker:", {
    workerUrl,
    runId: run.id
  })

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
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => "")
          console.error("[analysis.start.v5] worker non-ok response:", {
            status: res.status,
            runId: run.id,
            workerUrl,
            body: body.slice(0, 500)
          })
        } else {
          console.log("[analysis.start.v5] worker dispatched ok:", {
            status: res.status,
            runId: run.id
          })
        }
      })
      .catch((err) => {
        console.error("[analysis.start.v5] worker dispatch failed:", {
          runId: run.id,
          workerUrl,
          message: err?.message ?? String(err)
        })
      })
  )

  return NextResponse.json({
    runId: run.id,
    status: run.status,
    progress: 0,
    currentStage: null,
    resumed: false
  })
}
