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

function ActionMessage({ state }: { state: ReviewActionState }) {
  if (!state.message) return null
  return <p className={`text-xs ${state.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
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
            required
            placeholder="Begründung für die Freigabe"
            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <SubmitActionButton label="Freigabe erteilen" />
          <ActionMessage state={stateApprove} />
          {userRole !== Role.ADMIN ? <p className="text-xs text-slate-500">Nur privilegierte Rollen können freigeben.</p> : null}
        </form>

        <form action={actionArchive} className="space-y-2 rounded-md border border-slate-200 p-2">
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="nextStatus" value={DocumentIntakeStatus.ARCHIVIERT} />
          <p className="text-xs font-medium text-slate-700">Privilegierter Schritt: Archivierung</p>
          <input
            name="reason"
            maxLength={500}
            required
            placeholder="Begründung für die Archivierung"
            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <SubmitActionButton label="Archivieren" />
          <ActionMessage state={stateArchive} />
        </form>
      </div>
    )
  }

  return <span className="text-xs text-slate-500">Keine Aktion erforderlich</span>
}
