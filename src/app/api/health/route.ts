export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(): Promise<NextResponse> {
  const checks: Record<string, { status: string; latency?: number }> = {}
  const start = Date.now()

  // Database
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: "operational", latency: Date.now() - dbStart }
  } catch {
    checks.database = { status: "degraded" }
  }

  // Claude API
  try {
    const aiStart = Date.now()
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "HEAD" }).catch(() => null)
    checks.claude = { status: res ? "operational" : "degraded", latency: Date.now() - aiStart }
  } catch {
    checks.claude = { status: "unknown" }
  }

  // OpenAI API
  try {
    const oaiStart = Date.now()
    const res = await fetch("https://api.openai.com/v1/models", { method: "HEAD" }).catch(() => null)
    checks.openai = { status: res ? "operational" : "degraded", latency: Date.now() - oaiStart }
  } catch {
    checks.openai = { status: "unknown" }
  }

  const allOp = Object.values(checks).every(c => c.status === "operational")

  return NextResponse.json({
    status: allOp ? "operational" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
    totalLatency: Date.now() - start,
    version: "1.3.0",
  }, {
    headers: { "Cache-Control": "no-store" }
  })
}
