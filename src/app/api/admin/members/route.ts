import { NextResponse } from "next/server"

import { requireAdminAccess } from "@/lib/admin/guards"
import { listTenantMembers } from "@/lib/admin/members-core"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"

export async function GET(): Promise<NextResponse> {
  const guard = await requireAdminAccess()
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  const tenantContext = await resolveTenantContextForUser(guard.user.id)

  if (tenantContext.status === "none") {
    return NextResponse.json(
      { error: "Kein Mandantenkontext für dieses Konto vorhanden" },
      { status: 403 }
    )
  }

  if (tenantContext.status === "multiple") {
    return NextResponse.json(
      { error: "Mehrdeutiger Mandantenkontext. Tenant-Auswahl erforderlich" },
      { status: 409 }
    )
  }

  try {
    const members = await listTenantMembers(tenantContext.tenantId)

    return NextResponse.json({
      tenantId: tenantContext.tenantId,
      total: members.length,
      members
    })
  } catch {
    return NextResponse.json({ error: "Mitglieder konnten nicht geladen werden" }, { status: 500 })
  }
}
