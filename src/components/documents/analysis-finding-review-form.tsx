"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  submitAnalysisFindingReviewAction,
  type AnalysisFindingReviewFormState
} from "@/app/workspace/dokumente/[id]/actions"

const initial: AnalysisFindingReviewFormState = { status: "idle" }

function SubmitReviewButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? "Speichern …" : "Speichern"}
    </button>
  )
}

type Props = {
  documentId: string
  findingId: string
}

export function AnalysisFindingReviewForm({ documentId, findingId }: Props) {
  const [state, action] = useFormState(submitAnalysisFindingReviewAction, initial)

  return (
    <form action={action} className="mt-2 space-y-2 rounded-md border border-dashed border-slate-200 bg-white/80 p-2">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="findingId" value={findingId} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-600">
          Entscheidung
          <select
            name="decision"
            required
            className="ml-1 mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            <option value="AKZEPTIERT">Akzeptiert</option>
            <option value="ABGELEHNT">Abgelehnt</option>
            <option value="ANGEPASST">Angepasst (Text ändern)</option>
          </select>
        </label>
        <SubmitReviewButton />
      </div>
      <label className="block text-xs text-slate-600">
        Kommentar (bei Ablehnung erforderlich)
        <textarea
          name="comment"
          rows={2}
          className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          placeholder="Kurze fachliche Begründung …"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs text-slate-600">
          Neuer Titel (nur bei „Angepasst“)
          <input name="modifiedTitle" className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
        </label>
        <label className="block text-xs text-slate-600 sm:col-span-2">
          Neue Beschreibung (nur bei „Angepasst“)
          <textarea name="modifiedDescription" rows={2} className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
        </label>
      </div>
      <p className="text-[11px] text-slate-500">Nur für berechtigte Rollen sichtbar; wird protokolliert.</p>
      {state.message ? (
        <p className={`text-xs ${state.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
      ) : null}
    </form>
  )
}
