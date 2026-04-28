import "server-only"

import { Prisma } from "@prisma/client"

import { withTenant } from "@/lib/tenant-context-core"
import { describeAction, type AuditCategory, type AuditSeverity } from "@/lib/audit/registry"

export type AuditEventListItem = {
  id: string
  createdAt: Date
  action: string
  resourceType: string
  resourceId: string | null
  documentId: string | null
  ip: string | null
  userAgent: string | null
  requestId: string | null
  prevHash: string | null
  eventHash: string | null
  metadata: unknown
  actor: { id: string; email: string | null; name: string | null } | null
  // Derived from registry
  category: AuditCategory
  severity: AuditSeverity
  label: string
  emoji: string
}

export type AuditKpis = {
  eventsToday: number
  eventsLast7d: number
  totalAnalyses: number
  highRiskEvents: number
  integrityPercent: number
  totalEvents: number
}

/**
 * Compute KPIs across all events of the current tenant.
 * Uses raw groupBy + aggregate for performance.
 */
export async function loadAuditKpis(tenantId: string): Promise<AuditKpis> {
  return withTenant(tenantId, async (tx) => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [totalEvents, eventsToday, eventsLast7d, analysesCompleted, allHashes] = await Promise.all([
      tx.auditEvent.count(),
      tx.auditEvent.count({ where: { createdAt: { gte: startOfDay } } }),
      tx.auditEvent.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      tx.auditEvent.count({ where: { action: "analysis.completed" } }),
      // Pull only what we need to count high-risk events without scanning metadata
      tx.auditEvent.findMany({
        select: { action: true, eventHash: true, prevHash: true },
        orderBy: { createdAt: "asc" }
      })
    ])

    let highRiskEvents = 0
    let integrityOk = 0
    let integrityChecked = 0
    let lastHash: string | null = null

    for (const e of allHashes) {
      const meta = describeAction(e.action)
      if (meta.severity === "critical" || meta.severity === "warning") highRiskEvents++

      // Hash-chain integrity: each event's prevHash should match previous event's eventHash
      if (e.prevHash !== null) {
        integrityChecked++
        if (e.prevHash === lastHash) integrityOk++
      }
      lastHash = e.eventHash
    }

    const integrityPercent = integrityChecked === 0 ? 100 : Math.round((integrityOk / integrityChecked) * 100)

    return {
      eventsToday,
      eventsLast7d,
      totalAnalyses: analysesCompleted,
      highRiskEvents,
      integrityPercent,
      totalEvents
    }
  })
}

export type ListAuditEventsInput = {
  tenantId: string
  category?: AuditCategory | "alle"
  query?: string
  limit?: number
  cursor?: string | null
}

export type ListAuditEventsResult = {
  events: AuditEventListItem[]
  nextCursor: string | null
  hasMore: boolean
}

export async function listAuditEvents(input: ListAuditEventsInput): Promise<ListAuditEventsResult> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200)

  return withTenant(input.tenantId, async (tx) => {
    // Build where-clause using Prisma's official type
    const where: Prisma.AuditEventWhereInput = {}

    if (input.query && input.query.trim()) {
      const q = input.query.trim()
      where.OR = [
        { action: { contains: q, mode: "insensitive" } },
        { resourceType: { contains: q, mode: "insensitive" } },
        { resourceId: { contains: q, mode: "insensitive" } },
        { actor: { email: { contains: q, mode: "insensitive" } } }
      ]
    }

    const rows = await tx.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      include: {
        actor: { select: { id: true, email: true, name: true } }
      }
    })

    // Filter category in app layer (Prisma can't filter on registry-derived field)
    type RowType = (typeof rows)[number]
    const enriched: AuditEventListItem[] = rows.map((r: RowType) => {
      const meta = describeAction(r.action)
      return {
        id: r.id,
        createdAt: r.createdAt,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        documentId: r.documentId,
        ip: r.ip,
        userAgent: r.userAgent,
        requestId: r.requestId,
        prevHash: r.prevHash,
        eventHash: r.eventHash,
        metadata: r.metadata,
        actor: r.actor,
        category: meta.category,
        severity: meta.severity,
        label: meta.label,
        emoji: meta.emoji
      }
    })

    const filtered =
      input.category && input.category !== "alle"
        ? enriched.filter((e) => e.category === input.category)
        : enriched

    const hasMore = filtered.length > limit
    const slice = hasMore ? filtered.slice(0, limit) : filtered
    const nextCursor = hasMore ? slice[slice.length - 1]?.id ?? null : null

    return {
      events: slice,
      nextCursor,
      hasMore
    }
  })
}

/**
 * Streaming-friendly export: returns a CSV string for the entire tenant's audit log.
 * Used by /api/audit/export.
 *
 * Format: RFC-4180-compliant CSV, semicolon-separated for German Excel default.
 */
export async function exportAuditEventsAsCsv(tenantId: string): Promise<string> {
  const all = await withTenant(tenantId, async (tx) => {
    return tx.auditEvent.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        actor: { select: { email: true, name: true } }
      }
    })
  })

  const headers = [
    "id",
    "createdAt",
    "action",
    "category",
    "severity",
    "actor",
    "resourceType",
    "resourceId",
    "documentId",
    "ip",
    "requestId",
    "prevHash",
    "eventHash",
    "metadataJson"
  ]

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return ""
    const s = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v)
    if (s.includes(";") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines: string[] = [headers.join(";")]

  for (const e of all) {
    const meta = describeAction(e.action)
    const actorLabel = e.actor?.email ?? e.actor?.name ?? ""
    lines.push(
      [
        e.id,
        e.createdAt.toISOString(),
        e.action,
        meta.category,
        meta.severity,
        actorLabel,
        e.resourceType,
        e.resourceId ?? "",
        e.documentId ?? "",
        e.ip ?? "",
        e.requestId ?? "",
        e.prevHash ?? "",
        e.eventHash ?? "",
        e.metadata ?? ""
      ]
        .map(escape)
        .join(";")
    )
  }

  return lines.join("\r\n")
}
