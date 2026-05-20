import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const tenantId = await getTenantId(session);
  if (!tenantId) {
    return NextResponse.json({ error: "no_tenant" }, { status: 403 });
  }

  const userId = session.user.id;

  const result = await prisma.notification.updateMany({
    where: {
      tenantId,
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
