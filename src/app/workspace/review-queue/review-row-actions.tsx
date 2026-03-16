"use client"

import { DocumentIntakeStatus, Role } from "@prisma/client"
import { useFormState, useFormStatus } from "react-dom"

import { reviewTransitionAction, type ReviewActionState } from "@/app/workspace/review-queue/actions"

type ReviewRowActionsProps = {
  documentId: string
  currentStatus: DocumentIntakeStatus
  userRole: Role
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

export function ReviewRowActions({ documentId, currentStatus, userRole }: ReviewRowActionsProps) {
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
          placeholder="Begründung (optional)"
          className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
        />
        <SubmitActionButton label="In Prüfung setzen" />
        {stateStart.message ? (
          <p className={`text-xs ${stateStart.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{stateStart.message}</p>
        ) : null}
      </form>
    )
  }

  if (currentStatus === DocumentIntakeStatus.IN_PRUEFUNG) {
    return (
      <div className="space-y-3">
        <form action={actionApprove} className="space-y-2">
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="nextStatus" value={DocumentIntakeStatus.FREIGEGEBEN} />
          <input
            name="reason"
            maxLength={500}
            placeholder="Begründung (optional)"
            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <SubmitActionButton label="Freigeben" />
          {stateApprove.message ? (
            <p className={`text-xs ${stateApprove.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{stateApprove.message}</p>
          ) : null}
          {userRole !== Role.ADMIN ? (
            <p className="text-xs text-slate-500">Hinweis: Freigabe ist nur für Administratoren zulässig.</p>
          ) : null}
        </form>

        <form action={actionArchive} className="space-y-2">
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="nextStatus" value={DocumentIntakeStatus.ARCHIVIERT} />
          <input
            name="reason"
            maxLength={500}
            placeholder="Begründung (optional)"
            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <SubmitActionButton label="Archivieren" />
          {stateArchive.message ? (
            <p className={`text-xs ${stateArchive.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{stateArchive.message}</p>
          ) : null}
        </form>
      </div>
    )
  }

  return <span className="text-xs text-slate-500">Keine Aktion erforderlich</span>
}
