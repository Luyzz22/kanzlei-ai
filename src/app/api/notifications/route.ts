import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [], unread: 0 });
  }

  const tenantCtx = await resolveTenantContextForUser(session.user.id);
  const tenantId = tenantCtx.status === "single" ? tenantCtx.tenantId : null;
  if (!tenantId) {
    return NextResponse.json({ items: [], unread: 0 });
  }

  const userId = session.user.id;

  // Atomarer Read: Items + Unread-Count in einer Transaktion
  const [items, unread] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { tenantId, userId, readAt: null },
    }),
  ]);

  return NextResponse.json(
    { items, unread },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
