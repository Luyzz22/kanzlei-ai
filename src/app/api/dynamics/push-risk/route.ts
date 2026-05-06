export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { pushRiskToVendor, pushAllPendingRisks } from "@/lib/dynamics/risk-push"

/**
 * POST /api/dynamics/push-risk
 *
 * Body:
 *   { analysisRunId: string }                    — Push einzelner Run
 *   { mode: "all" }                              — Push alle ausstehenden
 *   { analysisRunId: string, dryRun: true }      — Dry-Run (kein BC-Write)
 *
 * Optional: { blockThreshold: number }  — Ab welchem Score Vendor geblockt wird (Default 0.85)
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant zugeordnet" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { analysisRunId, mode, blockThreshold, dryRun } = body as {
      analysisRunId?: string
      mode?: string
      blockThreshold?: number
      dryRun?: boolean
    }

    const options = {
      blockThreshold: blockThreshold ?? 0.85,
      dryRun: dryRun ?? false
    }

    // Batch-Push aller ausstehenden Risiken
    if (mode === "all") {
      const results = await pushAllPendingRisks(ctx.tenantId, session.user.id, options)
      return NextResponse.json({
        success: true,
        mode: "all",
        pushed: results.filter(r => r.pushed).length,
        blocked: results.filter(r => r.blockedUpdated).length,
        total: results.length,
        results
      })
    }

    // Einzel-Push
    if (!analysisRunId) {
      return NextResponse.json(
        { error: "analysisRunId oder mode='all' erforderlich" },
        { status: 400 }
      )
    }

    const result = await pushRiskToVendor(ctx.tenantId, analysisRunId, session.user.id, options)

    if (!result) {
      return NextResponse.json(
        { error: "Kein gematchter Vendor gefunden oder AnalysisRun nicht vorhanden/abgeschlossen" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
