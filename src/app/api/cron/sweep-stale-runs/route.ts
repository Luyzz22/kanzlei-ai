import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 30;

// Vercel Cron: aufrufen via vercel.json oder Vercel Dashboard
// Schedule: "0 */6 * * *" (alle 6 Stunden)
// Sicherung: CRON_SECRET env var

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // QUEUED > 120 Sekunden → vermutlich Worker-Dispatch fehlgeschlagen
  const staleQueued = await prisma.analysisRun.updateMany({
    where: {
      status: "QUEUED",
      createdAt: { lt: new Date(now.getTime() - 120_000) },
    },
    data: {
      status: "FAILED",
      error: "stale_queued_timeout",
      completedAt: now,
    },
  });

  // RUNNING > 10 Minuten → Worker ist abgestürzt oder Vercel hat gekillt
  const staleRunning = await prisma.analysisRun.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: new Date(now.getTime() - 600_000) },
    },
    data: {
      status: "FAILED",
      error: "stale_running_timeout",
      completedAt: now,
    },
  });

  console.log("[cron.sweep-stale-runs]", {
    staleQueued: staleQueued.count,
    staleRunning: staleRunning.count,
  });

  return NextResponse.json({
    ok: true,
    staleQueued: staleQueued.count,
    staleRunning: staleRunning.count,
    timestamp: now.toISOString(),
  });
}
