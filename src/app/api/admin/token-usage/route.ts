export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })
  }
  const tenantId = ctx.tenantId

  const platformRole = (session.user as { role?: string }).role
  const isPlatformAdmin = platformRole === "ADMIN" || platformRole === "OWNER"
  if (!isPlatformAdmin) {
    const membership = await prisma.tenantMember.findFirst({
      where: { tenantId, userId: session.user.id },
      select: { role: true }
    })
    if (membership?.role !== "ADMIN") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const [totalAll, totalRecent, totalPrevious, bySource, byProvider, topUsers, dailyRecent] = await Promise.all([
    // Overall totals
    prisma.tenantTokenUsage.aggregate({
      where: { tenantId },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    // Last 30 days
    prisma.tenantTokenUsage.aggregate({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    // 30–60 days ago
    prisma.tenantTokenUsage.aggregate({
      where: { tenantId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    // By source
    prisma.tenantTokenUsage.groupBy({
      by: ["source"],
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    // By provider
    prisma.tenantTokenUsage.groupBy({
      by: ["provider"],
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    // Top users (last 30 days)
    prisma.tenantTokenUsage.groupBy({
      by: ["userId"],
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true },
      orderBy: { _sum: { costCentsUsd: "desc" } },
      take: 10
    }),
    // Daily totals last 30 days
    prisma.$queryRaw<Array<{ day: Date; tokens: bigint; cost: bigint }>>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        SUM("inputTokens" + "outputTokens") AS tokens,
        SUM("costCentsUsd") AS cost
      FROM "TenantTokenUsage"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY day
      ORDER BY day ASC
    `
  ])

  // Enrich top users with names
  const userIds = topUsers.map((u) => u.userId)
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  const recentTokens = (totalRecent._sum.inputTokens ?? 0) + (totalRecent._sum.outputTokens ?? 0)
  const previousTokens = (totalPrevious._sum.inputTokens ?? 0) + (totalPrevious._sum.outputTokens ?? 0)
  const tokenTrend = previousTokens > 0
    ? Math.round(((recentTokens - previousTokens) / previousTokens) * 1000) / 10
    : null

  return NextResponse.json({
    totals: {
      requests: totalAll._count.id,
      inputTokens: totalAll._sum.inputTokens ?? 0,
      outputTokens: totalAll._sum.outputTokens ?? 0,
      totalTokens: (totalAll._sum.inputTokens ?? 0) + (totalAll._sum.outputTokens ?? 0),
      costCentsUsd: totalAll._sum.costCentsUsd ?? 0
    },
    recent30d: {
      requests: totalRecent._count.id,
      totalTokens: recentTokens,
      costCentsUsd: totalRecent._sum.costCentsUsd ?? 0,
      tokenTrend
    },
    bySource: bySource.map((s) => ({
      source: s.source,
      requests: s._count.id,
      totalTokens: (s._sum.inputTokens ?? 0) + (s._sum.outputTokens ?? 0),
      costCentsUsd: s._sum.costCentsUsd ?? 0
    })),
    byProvider: byProvider.map((p) => ({
      provider: p.provider,
      requests: p._count.id,
      totalTokens: (p._sum.inputTokens ?? 0) + (p._sum.outputTokens ?? 0),
      costCentsUsd: p._sum.costCentsUsd ?? 0
    })),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      name: userMap.get(u.userId)?.name ?? null,
      email: userMap.get(u.userId)?.email ?? u.userId,
      requests: u._count.id,
      totalTokens: (u._sum.inputTokens ?? 0) + (u._sum.outputTokens ?? 0),
      costCentsUsd: u._sum.costCentsUsd ?? 0
    })),
    daily: dailyRecent.map((d) => ({
      day: d.day instanceof Date ? d.day.toISOString().slice(0, 10) : String(d.day).slice(0, 10),
      tokens: Number(d.tokens),
      costCentsUsd: Number(d.cost)
    }))
  })
}
