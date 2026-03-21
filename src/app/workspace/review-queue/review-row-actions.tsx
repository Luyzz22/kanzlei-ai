"use client"

import { DocumentIntakeStatus, Role } from "@prisma/client"
import { useFormState, useFormStatus } from "react-dom"

import { reviewTransitionAction, type ReviewActionState } from "@/app/workspace/review-queue/actions"
import type { TenantApprovalPolicyValues } from "@/lib/tenant-settings/approval-policy-core"

type ReviewRowActionsProps = {
  documentId: string
  currentStatus: DocumentIntakeStatus
  userRole: Role
  policy: TenantApprovalPolicyValues
}

const initialState: ReviewActionState = {
  status: "idle"
}

function SubmitActionButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Speichern …" : label}
    </button>
  )
}

function ActionMessage({ state }: { state: ReviewActionState }) {
  if (!state.message) return null
  return <p className={`text-xs ${state.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
}

export function ReviewRowActions({ documentId, currentStatus, userRole, policy }: ReviewRowActionsProps) {
  const [stateStart, actionStart] = useFormState(reviewTransitionAction, initialState)
  const [stateApprove, actionApprove] = useFormState(reviewTransitionAction, initialState)
  const [stateArchive, actionArchive] = useFormState(reviewTransitionAction, initialState)

  if (currentStatus === DocumentIntakeStatus.EINGEGANGEN) {
    return (
      <form action={actionStart} className="space-y-2">
        <input type="hidden" name="documentId" value={documentId} />
        <input type="hidden" name="nextStatus" value={DocumentIntakeStatus.IN_PRUEFUNG} />
        <input
          name="reason"
          maxLength={500}
          placeholder="Review-Kontext (optional)"
          className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
        />
        <SubmitActionButton label="Prüfung starten" />
        <ActionMessage state={stateStart} />
      </form>
    )
  }

  if (currentStatus === DocumentIntakeStatus.IN_PRUEFUNG) {
    return (
      <div className="space-y-3">
        <form action={actionApprove} className="space-y-2 rounded-md border border-slate-200 p-2">
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="nextStatus" value={DocumentIntakeStatus.FREIGEGEBEN} />
          <p className="text-xs font-medium text-slate-700">Privilegierter Schritt: Freigabe</p>
          <input
            name="reason"
            maxLength={500}
            required={policy.requireReasonForApproval}
            placeholder={
              policy.requireReasonForApproval ? "Begründung für die Freigabe (verpflichtend)" : "Begründung für die Freigabe (optional)"
            }
            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <SubmitActionButton label="Freigabe erteilen" />
          <ActionMessage state={stateApprove} />
          {policy.approvalRestrictedToPrivilegedRoles && userRole !== Role.ADMIN ? (
            <p className="text-xs text-slate-500">Freigabe nur für privilegierte Rollen.</p>
          ) : null}
          {policy.requireFourEyesForApproval ? (
            <p className="text-xs text-slate-500">Vier-Augen-Prinzip aktiv.</p>
          ) : null}
        </form>

        <form action={actionArchive} className="space-y-2 rounded-md border border-slate-200 p-2">
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="nextStatus" value={DocumentIntakeStatus.ARCHIVIERT} />
          <p className="text-xs font-medium text-slate-700">Privilegierter Schritt: Archivierung</p>
          <input
            name="reason"
            maxLength={500}
            required={policy.requireReasonForArchiving}
            placeholder={
              policy.requireReasonForArchiving
                ? "Begründung für die Archivierung (verpflichtend)"
                : "Begründung für die Archivierung (optional)"
            }
            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <SubmitActionButton label="Archivieren" />
          <ActionMessage state={stateArchive} />
          {policy.archivingRestrictedToPrivilegedRoles && userRole !== Role.ADMIN ? (
            <p className="text-xs text-slate-500">Archivierung nur für privilegierte Rollen.</p>
          ) : null}
        </form>
      </div>
    )
  }

  return <span className="text-xs text-slate-500">Keine Aktion erforderlich</span>
}
