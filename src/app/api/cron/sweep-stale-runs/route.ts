import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"

import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * KanzleiAI v5.0 Stage-Chunked Pipeline — Cron Sweep.
 *
 * Schedule: alle 15 Min (vercel.json: "0,15,30,45 * * * *").
 *
 * Bei v5 unterscheiden wir drei Fälle:
 *
 * (1) QUEUED > 2 min → Worker-Dispatch hat gefehlt
 *     Lösung: erneut dispatchen (Resume).
 *
 * (2) RUNNING + Stage-Update älter als 8 min + Gesamtdauer < 45 min
 *     → Wahrscheinlich Lambda-Hard-Kill in einer Stage, Pipeline ist nicht zombie.
 *     Lösung: erneut dispatchen — der Worker liest currentStage aus DB und führt sie aus.
 *
 * (3) RUNNING + Gesamtdauer > 45 min
 *     → Pipeline ist tot, hat zu lange gebraucht oder hängt in einer Schleife.
 *     Lösung: status = FAILED (kein Resume mehr).
 */

const RESUME_QUEUED_AFTER_MS = 2 * 60 * 1000 // 2 min
const RESUME_RUNNING_STAGE_STALE_MS = 8 * 60 * 1000 // 8 min ohne Stage-Update
const FAIL_RUNNING_AFTER_MS = 45 * 60 * 1000 // 45 min Gesamtdauer

async function dispatchWorker(runId: string, reason: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "")
  if (!baseUrl) {
    console.warn("[cron.sweep.v5] NEXTAUTH_URL fehlt, kann nicht dispatchen", { runId })
    return
  }
  const workerUrl = `${baseUrl}/api/workspace/analysis/run`
  try {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Token": process.env.WORKER_TOKEN ?? ""
      },
      body: JSON.stringify({ runId }),
      cache: "no-store"
    })
    console.log(`[cron.sweep.v5] resume dispatched runId=${runId} reason=${reason} status=${res.status}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[cron.sweep.v5] resume dispatch failed runId=${runId}: ${msg}`)
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // (3) RUNNING > 45 min → hart FAILED
  const hardFailed = await prisma.analysisRun.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: new Date(now.getTime() - FAIL_RUNNING_AFTER_MS) }
    },
    data: {
      status: "FAILED",
      errorCode: "STALE_RUNNING_TIMEOUT_45MIN",
      error: "Run lief länger als 45 Minuten — Auto-Abbruch durch Cron.",
      completedAt: now
    }
  })

  // (1) QUEUED > 2 min → Resume-Dispatch
  const staleQueued = await prisma.analysisRun.findMany({
    where: {
      status: "QUEUED",
      createdAt: { lt: new Date(now.getTime() - RESUME_QUEUED_AFTER_MS) }
    },
    select: { id: true },
    take: 20 // Schutz: max 20 Resume-Dispatches pro Cron-Lauf
  })

  // (2) RUNNING + Stage-Update älter als 8 min (aber noch < 45 min total) → Resume-Dispatch
  const staleRunning = await prisma.analysisRun.findMany({
    where: {
      status: "RUNNING",
      updatedAt: { lt: new Date(now.getTime() - RESUME_RUNNING_STAGE_STALE_MS) },
      startedAt: { gte: new Date(now.getTime() - FAIL_RUNNING_AFTER_MS) }
    },
    select: { id: true, currentStage: true },
    take: 20
  })

  // Dispatch parallel via waitUntil (Response wird sofort flushed)
  const dispatches: Promise<void>[] = []
  for (const r of staleQueued) {
    dispatches.push(dispatchWorker(r.id, "stale_queued_resume"))
  }
  for (const r of staleRunning) {
    dispatches.push(dispatchWorker(r.id, `stale_stage_resume_${r.currentStage ?? "unknown"}`))
  }

  if (dispatches.length > 0) {
    // waitUntil hält die Lambda am Leben bis alle Dispatches durch sind
    waitUntil(Promise.allSettled(dispatches).then(() => {}))
  }

  console.log("[cron.sweep.v5]", {
    hardFailed: hardFailed.count,
    queuedResumed: staleQueued.length,
    runningResumed: staleRunning.length
  })

  return NextResponse.json({
    ok: true,
    hardFailed: hardFailed.count,
    queuedResumed: staleQueued.length,
    runningResumed: staleRunning.length,
    timestamp: now.toISOString()
  })
}
