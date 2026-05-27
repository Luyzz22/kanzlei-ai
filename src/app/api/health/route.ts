export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isProduction } from "@/lib/security/diagnostic-utils"

export async function GET(): Promise<NextResponse> {
  // Production: minimal status only — no provider pings, no version, no latency data
  if (isProduction()) {
    return NextResponse.json(
      { ok: true, timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  // Non-production: full diagnostic checks
  const checks: Record<string, { status: string; latency?: number }> = {}
  const start = Date.now()

  // Database connectivity
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: "operational", latency: Date.now() - dbStart }
  } catch {
    checks.database = { status: "degraded" }
  }

  // Anthropic reachability
  try {
    const aiStart = Date.now()
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "HEAD" }).catch(() => null)
    checks.claude = { status: res ? "operational" : "degraded", latency: Date.now() - aiStart }
  } catch {
    checks.claude = { status: "unknown" }
  }

  const allOp = Object.values(checks).every(c => c.status === "operational")

  return NextResponse.json({
    status: allOp ? "operational" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
    totalLatency: Date.now() - start,
  }, {
    headers: { "Cache-Control": "no-store" }
  })
}
