import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAnalysisPipeline } from "@/lib/analysis/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Internal-only: Token-Schutz
  const token = req.headers.get("X-Worker-Token");
  if (!token || token !== process.env.WORKER_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { runId } = body;

  if (!runId || typeof runId !== "string") {
    return NextResponse.json({ error: "missing_run_id" }, { status: 400 });
  }

  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    select: { id: true, tenantId: true, documentId: true, status: true },
  });

  if (!run) {
    return NextResponse.json({ error: "run_not_found" }, { status: 404 });
  }

  // State-Guard: nur QUEUED darf starten
  if (run.status !== "QUEUED") {
    return NextResponse.json(
      { error: "invalid_state", current: run.status },
      { status: 409 }
    );
  }

  // Transition: QUEUED → RUNNING
  await prisma.analysisRun.update({
    where: { id: runId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      progress: 5,
      currentStage: "classification",
    },
  });

  try {
    const result = await runAnalysisPipeline({
      runId,
      tenantId: run.tenantId,
      documentId: run.documentId,
      onProgress: async (progress: number, stage: string) => {
        await prisma.analysisRun.update({
          where: { id: runId },
          data: { progress, currentStage: stage },
        });
      },
    });

    // Transition: RUNNING → COMPLETED
    await prisma.analysisRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        progress: 100,
        currentStage: null,
        result: result ?? undefined,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "unknown_pipeline_error";

    console.error("[analysis.run] pipeline failed:", {
      runId,
      tenantId: run.tenantId,
      error: message,
    });

    // Transition: RUNNING → FAILED
    await prisma.analysisRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        error: message,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ error: "pipeline_failed" }, { status: 500 });
  }
}
