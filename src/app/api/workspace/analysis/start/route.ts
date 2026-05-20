import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const tenantId = await getTenantId(session);
  if (!tenantId) {
    return NextResponse.json({ error: "no_tenant" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { documentId } = body;

  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ error: "missing_document_id" }, { status: 400 });
  }

  // Tenant-Isolation: Dokument muss zum Tenant gehören
  const doc = await prisma.document.findFirst({
    where: { id: documentId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  }

  // Idempotenz: laufender Run vorhanden → zurückgeben statt Duplikat
  const inFlight = await prisma.analysisRun.findFirst({
    where: {
      documentId,
      tenantId,
      status: { in: ["QUEUED", "RUNNING"] },
    },
    select: { id: true, status: true, progress: true, currentStage: true },
  });
  if (inFlight) {
    return NextResponse.json({
      runId: inFlight.id,
      status: inFlight.status,
      progress: inFlight.progress,
      currentStage: inFlight.currentStage,
      resumed: true,
    });
  }

  // Neuen Run erstellen
  const run = await prisma.analysisRun.create({
    data: {
      tenantId,
      documentId,
      status: "QUEUED",
      progress: 0,
      // GoBD-nahe Aufbewahrungsfrist: 6 Jahre
      retentionUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 6),
    },
    select: { id: true, status: true },
  });

  // Worker async triggern — fire-and-forget, blockiert User-Response nicht
  const workerUrl = `${process.env.NEXTAUTH_URL}/api/workspace/analysis/run`;
  fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Worker-Token": process.env.WORKER_TOKEN!,
    },
    body: JSON.stringify({ runId: run.id }),
    cache: "no-store",
  }).catch((err) => {
    console.error("[analysis.start] worker dispatch failed:", err?.message);
  });

  return NextResponse.json({
    runId: run.id,
    status: run.status,
    progress: 0,
    currentStage: null,
    resumed: false,
  });
}
