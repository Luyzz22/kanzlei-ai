import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { exportAuditEventsAsCsv } from "@/lib/audit/audit-console-core"
import { writeAuditEvent } from "@/lib/audit-core"

export const dynamic = "force-dynamic"

/**
 * GET /api/audit/export
 *
 * CSV-Export aller Audit-Events des aktuellen Tenants.
 * - Semicolon-separated (Excel-DE-Default)
 * - Inkludiert Hash-Felder für Integritaetsprüfung
 * - Selbst-auditiert (Export selbst erzeugt audit.export-Event)
 * - Nur für eingeloggte Tenant-Member
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json(
      { error: "No single tenant context" },
      { status: 400 }
    )
  }

  try {
    const csv = await exportAuditEventsAsCsv(ctx.tenantId)

    // Self-audit: jeder Export wird protokolliert
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorId: session.user.id,
      action: "audit.export.csv",
      resourceType: "audit_log",
      metadata: {
        rowCount: csv.split("\r\n").length - 1
      }
    })

    const today = new Date().toISOString().slice(0, 10)
    const filename = `kanzlei-ai-audit-${today}.csv`

    // BOM für Excel-DE-Encoding
    const BOM = "\ufeff"
    return new NextResponse(BOM + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    })
  } catch (e) {
    console.error("[audit.export.failed]", {
      tenantId: ctx.tenantId,
      error: e instanceof Error ? e.message : String(e)
    })
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    )
  }
}
