import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const tenantId = await getTenantId(session);
  if (!tenantId) {
    return NextResponse.json({ error: "no_tenant" }, { status: 403 });
  }

  const run = await prisma.analysisRun.findFirst({
    where: { id: params.runId, tenantId },
    select: {
      id: true,
      status: true,
      progress: true,
      currentStage: true,
      error: true,
      startedAt: true,
      completedAt: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(run, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
