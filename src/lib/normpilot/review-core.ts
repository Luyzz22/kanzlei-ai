import "server-only"

import { Prisma, type NormPilotReviewState } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"
import {
  canTransitionNormPilotReviewState,
  resolveNormPilotActor
} from "@/lib/normpilot/access"
import { buildNormPilotAuditMetadata } from "@/lib/normpilot/audit-metadata"
import { NORMPILOT_AUDIT_ACTIONS } from "@/lib/normpilot/constants"
import type { NormPilotCoreResult } from "@/lib/normpilot/requirement-core"

export type NormPilotReviewResourceType =
  | "requirement_set"
  | "evidence_mapping"
  | "gap_finding"
  | "corrective_action"

type ReviewResourceConfig = {
  resourceType: string
  auditAction: string
}

const reviewConfig: Record<NormPilotReviewResourceType, ReviewResourceConfig> = {
  requirement_set: {
    resourceType: "normpilot_requirement_set",
    auditAction: "normpilot.requirement_set.reviewed"
  },
  evidence_mapping: {
    resourceType: "normpilot_evidence_mapping",
    auditAction: NORMPILOT_AUDIT_ACTIONS.mappingReviewed
  },
  gap_finding: {
    resourceType: "normpilot_gap_finding",
    auditAction: NORMPILOT_AUDIT_ACTIONS.gapReviewed
  },
  corrective_action: {
    resourceType: "normpilot_corrective_action",
    auditAction: NORMPILOT_AUDIT_ACTIONS.correctiveActionReviewed
  }
}

export async function transitionNormPilotReviewState(input: {
  tenantId: string
  actorId: string
  resourceType: NormPilotReviewResourceType
  resourceId: string
  nextState: NormPilotReviewState
}): Promise<NormPilotCoreResult<{ id: string; previousState: NormPilotReviewState; nextState: NormPilotReviewState }>> {
  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    if (!canTransitionNormPilotReviewState({ actor: actor.actor, nextState: input.nextState })) {
      return { ok: false, code: "FORBIDDEN" }
    }

    const now = new Date()
    const config = reviewConfig[input.resourceType]

    if (input.resourceType === "requirement_set") {
      const existing = await tx.normPilotRequirementSet.findFirst({
        where: { id: input.resourceId, tenantId: input.tenantId, deletedAt: null },
        select: { id: true, reviewState: true }
      })
      if (!existing) return { ok: false, code: "NOT_FOUND" }
      const updated = await tx.normPilotRequirementSet.update({
        where: { id: existing.id },
        data: { reviewState: input.nextState },
        select: { id: true, reviewState: true }
      })
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: config.auditAction,
        resourceType: config.resourceType,
        resourceId: updated.id,
        metadata: buildNormPilotAuditMetadata({
          previousState: existing.reviewState,
          nextState: updated.reviewState
        })
      })
      return { ok: true, data: { id: updated.id, previousState: existing.reviewState, nextState: updated.reviewState } }
    }

    if (input.resourceType === "evidence_mapping") {
      const existing = await tx.normPilotEvidenceMapping.findFirst({
        where: { id: input.resourceId, tenantId: input.tenantId, deletedAt: null },
        select: { id: true, reviewState: true, status: true }
      })
      if (!existing) return { ok: false, code: "NOT_FOUND" }
      const updated = await tx.normPilotEvidenceMapping.update({
        where: { id: existing.id },
        data: { reviewState: input.nextState, reviewedAt: now },
        select: { id: true, reviewState: true }
      })
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: config.auditAction,
        resourceType: config.resourceType,
        resourceId: updated.id,
        metadata: buildNormPilotAuditMetadata({
          previousState: existing.reviewState,
          nextState: updated.reviewState,
          status: existing.status
        })
      })
      return { ok: true, data: { id: updated.id, previousState: existing.reviewState, nextState: updated.reviewState } }
    }

    if (input.resourceType === "gap_finding") {
      const existing = await tx.normPilotGapFinding.findFirst({
        where: { id: input.resourceId, tenantId: input.tenantId, deletedAt: null },
        select: { id: true, reviewState: true, severity: true }
      })
      if (!existing) return { ok: false, code: "NOT_FOUND" }
      const updated = await tx.normPilotGapFinding.update({
        where: { id: existing.id },
        data: { reviewState: input.nextState },
        select: { id: true, reviewState: true }
      })
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: config.auditAction,
        resourceType: config.resourceType,
        resourceId: updated.id,
        metadata: buildNormPilotAuditMetadata({
          previousState: existing.reviewState,
          nextState: updated.reviewState,
          severity: existing.severity
        })
      })
      return { ok: true, data: { id: updated.id, previousState: existing.reviewState, nextState: updated.reviewState } }
    }

    const existing = await tx.normPilotCorrectiveAction.findFirst({
      where: { id: input.resourceId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true, reviewState: true, status: true }
    })
    if (!existing) return { ok: false, code: "NOT_FOUND" }
    const updated = await tx.normPilotCorrectiveAction.update({
      where: { id: existing.id },
      data: { reviewState: input.nextState },
      select: { id: true, reviewState: true }
    })
    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: config.auditAction,
      resourceType: config.resourceType,
      resourceId: updated.id,
      metadata: buildNormPilotAuditMetadata({
        previousState: existing.reviewState,
        nextState: updated.reviewState,
        status: existing.status
      })
    })
    return { ok: true, data: { id: updated.id, previousState: existing.reviewState, nextState: updated.reviewState } }
  })
}
