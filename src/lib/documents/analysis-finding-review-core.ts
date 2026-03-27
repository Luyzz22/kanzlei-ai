import "server-only"

import {
  AnalysisReviewState,
  FindingReviewDecision,
  Prisma,
  Role,
  TenantRole
} from "@prisma/client"

import { canReviewContractAnalysisFindings } from "@/lib/documents/analysis-finding-review-policy"
import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type SubmitFindingReviewResult =
  | { ok: true }
  | { ok: false; code: "FORBIDDEN" | "NOT_FOUND" | "INVALID"; message: string }

export async function submitAnalysisFindingReview(input: {
  tenantId: string
  actorId: string
  actorPlatformRole: Role
  actorTenantRole: TenantRole
  documentId: string
  analysisFindingId: string
  decision: FindingReviewDecision
  comment?: string | null
  modifiedTitle?: string | null
  modifiedDescription?: string | null
}): Promise<SubmitFindingReviewResult> {
  if (!canReviewContractAnalysisFindings(input.actorPlatformRole, input.actorTenantRole)) {
    return { ok: false, code: "FORBIDDEN", message: "Keine Berechtigung für die Finding-Prüfung." }
  }

  const comment = input.comment?.trim() || null
  const modifiedTitle = input.modifiedTitle?.trim() || null
  const modifiedDescription = input.modifiedDescription?.trim() || null

  if (input.decision === FindingReviewDecision.ABGELEHNT && !comment) {
    return {
      ok: false,
      code: "INVALID",
      message: "Bei Ablehnung ist ein kurzer Kommentar erforderlich."
    }
  }

  return withTenant(input.tenantId, async (tx) => {
    const member = await tx.tenantMember.findFirst({
      where: { tenantId: input.tenantId, userId: input.actorId },
      select: { id: true }
    })
    if (!member) {
      return { ok: false as const, code: "FORBIDDEN" as const, message: "Keine Mandantenmitgliedschaft." }
    }

    const finding = await tx.analysisFinding.findFirst({
      where: {
        id: input.analysisFindingId,
        tenantId: input.tenantId,
        documentId: input.documentId
      },
      select: { id: true, analysisRunId: true, title: true, description: true }
    })
    if (!finding) {
      return { ok: false as const, code: "NOT_FOUND" as const, message: "Finding nicht gefunden." }
    }

    const run = await tx.analysisRun.findFirst({
      where: { id: finding.analysisRunId, tenantId: input.tenantId, documentId: input.documentId },
      select: { id: true, reviewState: true }
    })
    if (!run) {
      return { ok: false as const, code: "NOT_FOUND" as const, message: "Analyselauf nicht gefunden." }
    }

    await tx.analysisFindingReview.create({
      data: {
        tenantId: input.tenantId,
        documentId: input.documentId,
        analysisRunId: finding.analysisRunId,
        analysisFindingId: finding.id,
        reviewerId: input.actorId,
        decision: input.decision,
        comment,
        modifiedTitle: input.decision === FindingReviewDecision.ANGEPASST ? modifiedTitle : null,
        modifiedDescription: input.decision === FindingReviewDecision.ANGEPASST ? modifiedDescription : null
      }
    })

    const nextReviewState =
      run.reviewState === AnalysisReviewState.FREIGEGEBEN || run.reviewState === AnalysisReviewState.ZURUECKGEWIESEN
        ? AnalysisReviewState.IN_PRUEFUNG
        : run.reviewState === AnalysisReviewState.ANALYSIERT ||
            run.reviewState === AnalysisReviewState.UNGEPRUEFT ||
            run.reviewState === AnalysisReviewState.ENTWURF
          ? AnalysisReviewState.IN_PRUEFUNG
          : run.reviewState

    await tx.analysisRun.update({
      where: { id: run.id },
      data: { reviewState: nextReviewState }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "analysis.finding.reviewed",
      resourceType: "analysisFinding",
      resourceId: finding.id,
      documentId: input.documentId,
      metadata: {
        analysisRunId: finding.analysisRunId,
        decision: input.decision,
        hasComment: Boolean(comment)
      } satisfies Prisma.InputJsonValue
    })

    return { ok: true as const }
  })
}
