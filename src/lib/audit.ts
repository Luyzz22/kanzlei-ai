import { prisma } from "@/lib/prisma"
import type { TenantContext } from "@/lib/tenant"

type AuditAction =
  | "document.uploaded"
  | "document.analyzed"
  | "document.reviewed"
  | "document.deleted"
  | "copilot.query"
  | "export.pdf"
  | "export.csv"
  | "user.login"
  | "user.logout"
  | "user.created"
  | "admin.settings_changed"
  | "admin.user_invited"
  | "billing.checkout"
  | "billing.plan_changed"

/**
 * Log an audit event with tenant context.
 * Non-blocking — errors are caught and logged, never thrown.
 */
export async function logAuditEvent(
  ctx: TenantContext,
  action: AuditAction,
  options?: {
    resourceType?: string
    resourceId?: string
    documentId?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action,
        resourceType: options?.resourceType ?? action.split(".")[0],
        resourceId: options?.resourceId,
        documentId: options?.documentId,
        metadata: options?.metadata ? JSON.parse(JSON.stringify(options.metadata)) : { actorEmail: ctx.userEmail },
      }
    })
  } catch (error) {
    console.error("[AUDIT] Failed to log event:", action, error)
  }
}
