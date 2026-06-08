import "server-only"

import { Role, TenantRole, type Prisma } from "@prisma/client"

export type NormPilotActor = {
  actorId: string
  platformRole: Role
  tenantRole: TenantRole
}

export type NormPilotAccessDecision =
  | { ok: true; actor: NormPilotActor }
  | { ok: false; code: "MISSING_MEMBERSHIP" | "FORBIDDEN" }

export type NormPilotPermission = "read" | "draft" | "manage" | "review" | "export"

type MembershipTx = Prisma.TransactionClient

export function canReadNormPilot(): boolean {
  return true
}

export function canCreateNormPilotDraft(actor: Pick<NormPilotActor, "tenantRole">): boolean {
  return actor.tenantRole === TenantRole.OWNER || actor.tenantRole === TenantRole.ADMIN || actor.tenantRole === TenantRole.MEMBER
}

export function canManageNormPilot(actor: Pick<NormPilotActor, "platformRole" | "tenantRole">): boolean {
  return actor.tenantRole === TenantRole.OWNER || actor.tenantRole === TenantRole.ADMIN
}

export function canReviewNormPilot(actor: Pick<NormPilotActor, "platformRole" | "tenantRole">): boolean {
  return canManageNormPilot(actor)
}

export function canExportNormPilot(actor: Pick<NormPilotActor, "platformRole" | "tenantRole">): boolean {
  return canManageNormPilot(actor)
}

export function canTransitionNormPilotReviewState(input: {
  actor: NormPilotActor
  nextState: "UNGEPRUEFT" | "IN_PRUEFUNG" | "FREIGEGEBEN" | "ZURUECKGEWIESEN"
}): boolean {
  if (input.nextState === "IN_PRUEFUNG") return canCreateNormPilotDraft(input.actor)
  return canReviewNormPilot(input.actor)
}

export function canPerformNormPilotPermission(actor: NormPilotActor, permission: NormPilotPermission): boolean {
  if (permission === "read") return canReadNormPilot()
  if (permission === "draft") return canCreateNormPilotDraft(actor)
  if (permission === "manage") return canManageNormPilot(actor)
  if (permission === "review") return canReviewNormPilot(actor)
  return canExportNormPilot(actor)
}

export async function resolveNormPilotActor(
  tx: MembershipTx,
  input: {
    tenantId: string
    actorId: string
    permission?: NormPilotPermission
  }
): Promise<NormPilotAccessDecision> {
  const membership = await tx.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId: input.tenantId,
        userId: input.actorId
      }
    },
    select: {
      role: true,
      user: {
        select: {
          role: true
        }
      }
    }
  })

  if (!membership) return { ok: false, code: "MISSING_MEMBERSHIP" }

  const actor: NormPilotActor = {
    actorId: input.actorId,
    platformRole: membership.user.role,
    tenantRole: membership.role
  }

  if (input.permission && !canPerformNormPilotPermission(actor, input.permission)) {
    return { ok: false, code: "FORBIDDEN" }
  }

  return { ok: true, actor }
}

export function normPilotAccessDeniedMessage(code: "MISSING_MEMBERSHIP" | "FORBIDDEN"): string {
  if (code === "MISSING_MEMBERSHIP") return "Fuer dieses Konto liegt keine gueltige Mandantenmitgliedschaft vor."
  return "Fuer diese NormPilot-Aktion fehlt die Berechtigung."
}
