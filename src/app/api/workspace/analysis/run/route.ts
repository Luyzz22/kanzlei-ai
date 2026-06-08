import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"

import { prisma } from "@/lib/prisma"
import { runNextStageForRun } from "@/lib/documents/analysis-run-stages"

export const runtime = "nodejs"
// 300s reicht für eine einzelne Stage komfortabel.
// Tiefenanalyse läuft jetzt als 3 separate Lambda-Aufrufe.
export const maxDuration = 300

/**
 * KanzleiAI v5.0 Stage-Chunked Worker.
 *
 * Verarbeitet GENAU EINE Pipeline-Stage pro Aufruf:
 *   1. Liest currentStage aus DB
 *   2. Führt die passende Stage-Funktion aus (Classification / Extraction / Risk)
 *   3. Persistiert Zwischenstate in stageStateJson + currentStage/progress
 *   4. Wenn weitere Stage folgt: self-dispatch via waitUntil → neuer Lambda
 *   5. Wenn risk fertig: status=COMPLETED, kein weiterer Dispatch
 *
 * Vorteile gegenüber v4.x (alles-in-einem-Lambda):
 *   - Keine Lambda-Hard-Kills bei langen Pipelines (jede Stage ≤ 300s)
 *   - Recovery: bei Crash in Stage 2 sind Stage 1-Daten bereits persistiert
 *   - Audit-Trail pro Stage (sichtbar in stageStateJson)
 *   - Schnellanalyse (sync) bleibt unverändert über runContractAnalysisPipeline-Shim
 */
export async function POST(req: NextRequest) {
  // Internal-only: Token-Schutz
  const token = req.headers.get("X-Worker-Token")
  if (!token || token !== process.env.WORKER_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { runId } = body as { runId?: unknown }

  if (!runId || typeof runId !== "string") {
    return NextResponse.json({ error: "missing_run_id" }, { status: 400 })
  }

  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      tenantId: true,
      documentId: true,
      userId: true,
      status: true,
      currentStage: true
    }
  })

  if (!run) {
    return NextResponse.json({ error: "run_not_found" }, { status: 404 })
  }

  // State-Guard
  if (run.status === "COMPLETED" || run.status === "FAILED") {
    return NextResponse.json(
      { error: "invalid_state", current: run.status },
      { status: 409 }
    )
  }

  // Erste Stage: Transition QUEUED → RUNNING (falls nicht schon geschehen)
  if (run.status === "QUEUED") {
    await prisma.analysisRun.update({
      where: { id: runId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        progress: 5,
        currentStage: "classification"
      }
    })
    console.log("[analysis.run.v5] queued run started", { runId, stage: "classification" })
  } else {
    console.log("[analysis.run.v5] continuing run", {
      runId,
      stage: run.currentStage ?? "classification"
    })
  }

  // Stage ausführen
  const currentStage = run.status === "QUEUED" ? "classification" : run.currentStage

  let outcome
  try {
    outcome = await runNextStageForRun(
      {
        runId,
        tenantId: run.tenantId,
        documentId: run.documentId,
        actorId: run.userId
      },
      currentStage
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_stage_runtime_error"
    console.error("[analysis.run.v5] uncaught exception", { runId, message })

    await prisma.analysisRun
      .update({
        where: { id: runId },
        data: {
          status: "FAILED",
          error: message.slice(0, 1000),
          errorCode: "STAGE_UNCAUGHT_EXCEPTION",
          completedAt: new Date()
        }
      })
      .catch(() => {
        /* best-effort */
      })

    return NextResponse.json({ error: "stage_uncaught", message }, { status: 500 })
  }

  if (!outcome.ok) {
    // Stage-Funktion hat den Run schon auf FAILED gesetzt
    return NextResponse.json(
      {
        ok: false,
        code: outcome.code,
        message: outcome.message
      },
      { status: 500 }
    )
  }

  // Wenn weitere Stage folgt: self-dispatch
  if (outcome.nextStage !== null) {
    const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? req.nextUrl.origin
    const workerUrl = `${baseUrl}/api/workspace/analysis/run`

    console.log("[analysis.run.v5] dispatching next stage", {
      runId,
      nextStage: outcome.nextStage,
      workerUrl
    })

    const dispatch = fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Token": process.env.WORKER_TOKEN ?? ""
      },
      body: JSON.stringify({ runId })
    }).then(
      (res) => {
        console.log("[analysis.run.v5] next-stage dispatched ok", {
          runId,
          status: res.status
        })
      },
      (err) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[analysis.run.v5] next-stage dispatch failed", { runId, message: msg })
      }
    )

    waitUntil(dispatch)

    return NextResponse.json({
      ok: true,
      stage: currentStage,
      nextStage: outcome.nextStage,
      progress: outcome.progress
    })
  }

  // nextStage === null → COMPLETED
  console.log("[analysis.run.v5] pipeline completed", { runId })
  return NextResponse.json({
    ok: true,
    stage: currentStage,
    nextStage: null,
    progress: 100,
    completed: true
  })
}
