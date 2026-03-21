import "server-only"

import { type Prisma } from "@prisma/client"

import { withTenant } from "@/lib/tenant-context.server"

export const ACTIVITY_CATEGORY_OPTIONS = [
  "Alle",
  "Dokument",
  "Review",
  "Freigabe",
  "Archivierung",
  "Richtlinie",
  "Admin",
  "Sicherheit",
  "Aufbewahrung",
  "Audit",
  "Verarbeitung"
] as const

export const ACTIVITY_PERIOD_OPTIONS = ["24h", "7d", "30d", "all"] as const

export const ACTIVITY_OBJECT_TYPE_OPTIONS = ["Alle", "Dokument", "Tenant-Richtlinie", "Admin-Einstellung", "Audit / Sonstiges"] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORY_OPTIONS)[number]
export type ActivityPeriod = (typeof ACTIVITY_PERIOD_OPTIONS)[number]
export type ActivityObjectType = (typeof ACTIVITY_OBJECT_TYPE_OPTIONS)[number]

type ListTenantActivitiesInput = {
  tenantId: string
  category: ActivityCategory
  period: ActivityPeriod
  objectType: ActivityObjectType
}

export type ActivityListItem = {
  id: string
  occurredAt: Date
  action: string
  title: string
  context: string
  category: Exclude<ActivityCategory, "Alle">
  objectType: Exclude<ActivityObjectType, "Alle">
  objectLabel: string
  actorLabel: string
  linkHref: string | null
  linkLabel: string | null
}

export type TenantActivityCounts = {
  total: number
  reviewOrApproval: number
  policyOrAdminChanges: number
  documentActivities: number
  lastSevenDays: number
}

type AuditEventWithContext = {
  id: string
  createdAt: Date
  action: string
  resourceType: string
  resourceId: string | null
  documentId: string | null
  actorId: string | null
  metadata: Prisma.JsonValue | null
  actor: { name: string | null; email: string | null } | null
  document: { id: string; title: string; documentType: string } | null
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readMetadataString(metadata: Prisma.JsonValue | null, key: string): string | null {
  const record = asRecord(metadata)
  if (!record) return null
  const value = record[key]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function resolvePeriodStart(period: ActivityPeriod): Date | null {
  const now = Date.now()
  if (period === "24h") return new Date(now - 24 * 60 * 60 * 1000)
  if (period === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000)
  if (period === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000)
  return null
}

export function buildActivityFilterWhere(input: {
  period: ActivityPeriod
  objectType: ActivityObjectType
}): Prisma.AuditEventWhereInput {
  const where: Prisma.AuditEventWhereInput = {}

  const periodStart = resolvePeriodStart(input.period)
  if (periodStart) {
    where.createdAt = { gte: periodStart }
  }

  if (input.objectType === "Dokument") {
    where.OR = [{ documentId: { not: null } }, { resourceType: { startsWith: "document" } }]
  }

  if (input.objectType === "Tenant-Richtlinie") {
    where.action = { startsWith: "tenant.approval-policies." }
  }

  if (input.objectType === "Admin-Einstellung") {
    where.OR = [
      { action: { startsWith: "tenant.security-settings." } },
      { action: { startsWith: "tenant.retention-settings." } },
      { action: { startsWith: "tenant.settings." } }
    ]
  }

  if (input.objectType === "Audit / Sonstiges") {
    where.NOT = {
      OR: [
        { documentId: { not: null } },
        { resourceType: { startsWith: "document" } },
        { action: { startsWith: "tenant.approval-policies." } },
        { action: { startsWith: "tenant.security-settings." } },
        { action: { startsWith: "tenant.retention-settings." } },
        { action: { startsWith: "tenant.settings." } }
      ]
    }
  }

  return where
}

function getObjectType(event: Pick<AuditEventWithContext, "action" | "resourceType" | "documentId">): Exclude<ActivityObjectType, "Alle"> {
  if (event.documentId || event.resourceType.startsWith("document")) return "Dokument"
  if (event.action.startsWith("tenant.approval-policies.")) return "Tenant-Richtlinie"
  if (
    event.action.startsWith("tenant.security-settings.") ||
    event.action.startsWith("tenant.retention-settings.") ||
    event.action.startsWith("tenant.settings.")
  ) {
    return "Admin-Einstellung"
  }
  return "Audit / Sonstiges"
}

function categoryForAction(action: string): Exclude<ActivityCategory, "Alle"> {
  if (action === "document.review.approved") return "Freigabe"
  if (action === "document.review.archived") return "Archivierung"
  if (action.startsWith("document.review.")) return "Review"
  if (action.startsWith("document.") || action === "document.intake.created") return "Dokument"
  if (action.startsWith("tenant.approval-policies.")) return "Richtlinie"
  if (action.startsWith("tenant.security-settings.")) return "Sicherheit"
  if (action.startsWith("tenant.retention-settings.")) return "Aufbewahrung"
  if (action.startsWith("tenant.settings.")) return "Admin"
  if (action.startsWith("analysis.") || action.startsWith("document.processing.")) return "Verarbeitung"
  return "Audit"
}

function resolveLink(event: AuditEventWithContext): { linkHref: string | null; linkLabel: string | null } {
  if (event.documentId) {
    return {
      linkHref: `/workspace/dokumente/${event.documentId}`,
      linkLabel: "Dokument öffnen"
    }
  }

  if (event.action.startsWith("tenant.approval-policies.")) {
    return {
      linkHref: "/dashboard/admin/approval-policies",
      linkLabel: "Freigaberichtlinien öffnen"
    }
  }

  if (event.action.startsWith("tenant.security-settings.")) {
    return {
      linkHref: "/dashboard/admin/security-access",
      linkLabel: "Sicherheit & Zugriff öffnen"
    }
  }

  if (event.action.startsWith("tenant.retention-settings.")) {
    return {
      linkHref: "/dashboard/admin/privacy-retention",
      linkLabel: "Datenschutz & Aufbewahrung öffnen"
    }
  }

  return { linkHref: null, linkLabel: null }
}

export function mapAuditEventToActivityListItem(event: AuditEventWithContext): ActivityListItem {
  const category = categoryForAction(event.action)
  const actorLabel = event.actor?.name ?? event.actor?.email ?? event.actorId ?? "System"
  const reason = readMetadataString(event.metadata, "reason")
  const changedFields = asRecord(event.metadata)?.changedFields
  const changedFieldCount = Array.isArray(changedFields) ? changedFields.length : 0

  if (event.action === "document.intake.created") {
    return {
      id: event.id,
      occurredAt: event.createdAt,
      action: event.action,
      title: "Dokumenteingang erfasst",
      context: "Ein Dokument wurde im tenantbezogenen Intake-Prozess angelegt.",
      category,
      objectType: getObjectType(event),
      objectLabel: event.document?.title ?? event.resourceId ?? "Dokument",
      actorLabel,
      ...resolveLink(event)
    }
  }

  if (event.action === "document.review.started") {
    return {
      id: event.id,
      occurredAt: event.createdAt,
      action: event.action,
      title: "Prüfung gestartet",
      context: reason
        ? `Die fachliche Prüfung wurde gestartet. Begründung: ${reason}`
        : "Die fachliche Prüfung wurde als protokollierter Review-Schritt gestartet.",
      category,
      objectType: getObjectType(event),
      objectLabel: event.document?.title ?? event.resourceId ?? "Dokument",
      actorLabel,
      ...resolveLink(event)
    }
  }

  if (event.action === "document.review.approved") {
    return {
      id: event.id,
      occurredAt: event.createdAt,
      action: event.action,
      title: "Dokument freigegeben",
      context: reason
        ? `Freigabe mit protokollierter Begründung: ${reason}`
        : "Der Freigabeschritt wurde tenantbezogen protokolliert.",
      category,
      objectType: getObjectType(event),
      objectLabel: event.document?.title ?? event.resourceId ?? "Dokument",
      actorLabel,
      ...resolveLink(event)
    }
  }

  if (event.action === "document.review.archived") {
    return {
      id: event.id,
      occurredAt: event.createdAt,
      action: event.action,
      title: "Dokument archiviert",
      context: reason
        ? `Archivierung mit protokollierter Begründung: ${reason}`
        : "Der Archivierungsschritt wurde tenantbezogen protokolliert.",
      category,
      objectType: getObjectType(event),
      objectLabel: event.document?.title ?? event.resourceId ?? "Dokument",
      actorLabel,
      ...resolveLink(event)
    }
  }

  if (event.action === "tenant.approval-policies.updated") {
    return {
      id: event.id,
      occurredAt: event.createdAt,
      action: event.action,
      title: "Freigaberichtlinien aktualisiert",
      context:
        changedFieldCount > 0
          ? `${changedFieldCount} Richtlinienfelder wurden geändert und auditierbar protokolliert.`
          : "Die tenantbezogene Freigaberichtlinie wurde aktualisiert.",
      category,
      objectType: getObjectType(event),
      objectLabel: "Tenant-Freigaberichtlinien",
      actorLabel,
      ...resolveLink(event)
    }
  }

  if (event.action === "tenant.security-settings.updated") {
    return {
      id: event.id,
      occurredAt: event.createdAt,
      action: event.action,
      title: "Sicherheitsvorgaben aktualisiert",
      context:
        changedFieldCount > 0
          ? `${changedFieldCount} Sicherheitsfelder wurden geändert und protokolliert.`
          : "Die tenantbezogenen Sicherheitsvorgaben wurden aktualisiert.",
      category,
      objectType: getObjectType(event),
      objectLabel: "Security & Zugriff",
      actorLabel,
      ...resolveLink(event)
    }
  }

  if (event.action === "tenant.retention-settings.updated") {
    return {
      id: event.id,
      occurredAt: event.createdAt,
      action: event.action,
      title: "Aufbewahrungsvorgaben aktualisiert",
      context:
        changedFieldCount > 0
          ? `${changedFieldCount} Retention-Felder wurden geändert und protokolliert.`
          : "Die tenantbezogenen Aufbewahrungsvorgaben wurden aktualisiert.",
      category,
      objectType: getObjectType(event),
      objectLabel: "Datenschutz & Aufbewahrung",
      actorLabel,
      ...resolveLink(event)
    }
  }

  return {
    id: event.id,
    occurredAt: event.createdAt,
    action: event.action,
    title: "Audit-nahe Aktivität protokolliert",
    context: `Die Aktivität „${event.action}“ wurde tenantbezogen protokolliert und ist für Nachvollziehbarkeit verfügbar.`,
    category,
    objectType: getObjectType(event),
    objectLabel: event.document?.title ?? event.resourceId ?? event.resourceType,
    actorLabel,
    ...resolveLink(event)
  }
}

export async function listTenantActivities(input: ListTenantActivitiesInput): Promise<ActivityListItem[]> {
  const where = buildActivityFilterWhere({ period: input.period, objectType: input.objectType })

  const events = await withTenant(input.tenantId, async (tx) => {
    return tx.auditEvent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 250,
      select: {
        id: true,
        createdAt: true,
        action: true,
        resourceType: true,
        resourceId: true,
        documentId: true,
        actorId: true,
        metadata: true,
        actor: {
          select: {
            name: true,
            email: true
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            documentType: true
          }
        }
      }
    })
  })

  const items = events.map((event) => mapAuditEventToActivityListItem(event))

  if (input.category === "Alle") return items
  return items.filter((item) => item.category === input.category)
}

export async function getTenantActivityCounts(tenantId: string): Promise<TenantActivityCounts> {
  const [total, lastSevenDays, events] = await withTenant(tenantId, async (tx) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return Promise.all([
      tx.auditEvent.count(),
      tx.auditEvent.count({
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      tx.auditEvent.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 400,
        select: {
          id: true,
          createdAt: true,
          action: true,
          resourceType: true,
          resourceId: true,
          documentId: true,
          actorId: true,
          metadata: true,
          actor: { select: { name: true, email: true } },
          document: { select: { id: true, title: true, documentType: true } }
        }
      })
    ])
  })

  const mapped = events.map((event) => mapAuditEventToActivityListItem(event))

  return {
    total,
    lastSevenDays,
    reviewOrApproval: mapped.filter((item) => item.category === "Review" || item.category === "Freigabe").length,
    policyOrAdminChanges: mapped.filter((item) => ["Richtlinie", "Admin", "Sicherheit", "Aufbewahrung"].includes(item.category)).length,
    documentActivities: mapped.filter((item) => item.objectType === "Dokument").length
  }
}
