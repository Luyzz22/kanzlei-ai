import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logEvent } from "@/lib/observability"

export async function GET() {
  let db = false

  try {
    await prisma.$queryRaw`SELECT 1`
    db = true
  } catch {
    db = false
  }

  logEvent({ event: "health.check", source: "health", outcome: db ? "success" : "error", meta: { db } }, db ? "info" : "warn")

  return NextResponse.json({ status: db ? "ok" : "degraded", checks: { db } }, { status: db ? 200 : 503 })
}
