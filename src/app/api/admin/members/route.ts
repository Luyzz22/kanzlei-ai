import { NextResponse } from "next/server"

<<<<<<< codex/review-and-improve-admin-center-foundation-ar4sby
import { requireAdminAccess } from "@/lib/admin/guards"
import { listTenantMembers } from "@/lib/admin/members-core"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
=======
import { listTenantMembers } from "@/lib/admin/members-core"
import { resolveSingleTenantIdForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
>>>>>>> main

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

<<<<<<< codex/review-and-improve-admin-center-foundation-ar4sby
  if (tenantContext.status === "multiple") {
    return NextResponse.json(
      { error: "Mehrdeutiger Mandantenkontext. Tenant-Auswahl erforderlich" },
      { status: 409 }
=======
  const tenantId = await resolveSingleTenantIdForUser(session.user.id)
  if (!tenantId) {
    return NextResponse.json(
      { error: "Kein eindeutiger Mandantenkontext gefunden" },
      { status: 403 }
>>>>>>> main
    )
  }

  try {
<<<<<<< codex/review-and-improve-admin-center-foundation-ar4sby
    const members = await listTenantMembers(tenantContext.tenantId)

    return NextResponse.json({
      tenantId: tenantContext.tenantId,
=======
    const members = await listTenantMembers(tenantId)

    return NextResponse.json({
      tenantId,
>>>>>>> main
      total: members.length,
      members
    })
  } catch {
    return NextResponse.json({ error: "Mitglieder konnten nicht geladen werden" }, { status: 500 })
  }
}
