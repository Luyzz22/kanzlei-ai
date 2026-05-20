import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const tenantCtx = await resolveTenantContextForUser(session.user.id);
  const tenantId = tenantCtx.status === "single" ? tenantCtx.tenantId : null;
  if (!tenantId) {
    return NextResponse.json({ error: "no_tenant" }, { status: 403 });
  }

  const userId = session.user.id;

  // updateMany statt update: kein Throw wenn nicht gefunden (Cross-Tenant-Safe)
  const result = await prisma.notification.updateMany({
    where: {
      id: params.id,
      tenantId,     // Mandantenisolation
      userId,       // User-Scope
      readAt: null, // Nur ungelesene
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
