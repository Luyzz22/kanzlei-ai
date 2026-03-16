import { Role } from "@prisma/client"
import { NextResponse } from "next/server"

import { listTenantMembers } from "@/lib/admin/members-core"
import { resolveSingleTenantIdForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"

export async function GET(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Zugriff nur für Administratoren" }, { status: 403 })
  }

  const tenantId = await resolveSingleTenantIdForUser(session.user.id)
  if (!tenantId) {
    return NextResponse.json(
      { error: "Kein eindeutiger Mandantenkontext gefunden" },
      { status: 403 }
    )
  }

  try {
    const members = await listTenantMembers(tenantId)

    return NextResponse.json({
      tenantId,
      total: members.length,
      members
    })
  } catch {
    return NextResponse.json({ error: "Mitglieder konnten nicht geladen werden" }, { status: 500 })
  }
}
