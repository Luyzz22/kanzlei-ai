import { Role } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { listTenantMembers } from "@/lib/admin/members-core"
import { prisma } from "@/lib/prisma"

async function resolveTenantIdForUser(userId: string): Promise<string | null> {
  const membership = await prisma.tenantMember.findFirst({
    where: { userId },
    select: { tenantId: true }
  })

  return membership?.tenantId ?? null
}

export async function GET(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Zugriff nur für Administratoren" }, { status: 403 })
  }

  const tenantId = await resolveTenantIdForUser(session.user.id)
  if (!tenantId) {
    return NextResponse.json({ error: "Kein Mandant gefunden" }, { status: 403 })
  }

  const members = await listTenantMembers(tenantId)

  return NextResponse.json({
    tenantId,
    total: members.length,
    members
  })
}
