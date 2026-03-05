export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET() {
  let dbOk = false

  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  return NextResponse.json(
    { status: dbOk ? "ok" : "degraded", checks: { db: dbOk } },
    { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  )
}
