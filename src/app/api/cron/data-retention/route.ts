/**
 * Daily Data Retention Cron — enforces DSGVO Art. 5 (1) e Storage-Limitation.
 *
 * Schedule: configured in vercel.json (daily 02:00 UTC).
 * Auth: Bearer CRON_SECRET (set in Vercel env, same mechanism as radar-sync).
 *
 * Dry-run via ?dryRun=true for manual verification without deleting.
 */

import { NextResponse } from "next/server"

import { enforceDocumentRetention } from "@/lib/retention/document-retention-core"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured", channel: "kanzlei.retention.cron" },
      { status: 500 }
    )
  }

  if (authHeader !== expected) {
    return NextResponse.json(
      { error: "Unauthorized", channel: "kanzlei.retention.cron" },
      { status: 401 }
    )
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get("dryRun") === "true"

  try {
    const summary = await enforceDocumentRetention({ dryRun })

    // Structured log for SIEM/SOC (NIS2 Art. 21)
    console.log(
      JSON.stringify({
        channel: "kanzlei.retention.cron",
        event: "retention_run_completed",
        ...summary,
      })
    )

    return NextResponse.json({
      status: "success",
      channel: "kanzlei.retention.cron",
      ...summary,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(
      JSON.stringify({
        channel: "kanzlei.retention.cron",
        event: "retention_run_failed",
        error: errMsg,
      })
    )
    return NextResponse.json(
      { status: "error", error: errMsg, channel: "kanzlei.retention.cron" },
      { status: 500 }
    )
  }
}
