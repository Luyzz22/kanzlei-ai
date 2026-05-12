"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  submitAnalysisFindingReviewAction,
  type AnalysisFindingReviewFormState
} from "@/app/workspace/dokumente/[id]/actions"

const initial: AnalysisFindingReviewFormState = { status: "idle" }

/**
 * Enterprise-grade form styling:
 * - Explicit bg-white + text-slate-900 to prevent browser-applied dark mode
 * - Visible borders + focus rings (gold accent matches SBS brand)
 * - Placeholder color explicitly set to mid-gray
 * - color-scheme: light hint to override OS-level dark preference
 */
const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 shadow-sm " +
  "focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 " +
  "[color-scheme:light]"

const selectClass =
  "mt-1 block rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 " +
  "shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 " +
  "[color-scheme:light]"

const labelClass = "block text-xs font-medium text-slate-700"

function SubmitReviewButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-[#003856] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#002a42] disabled:opacity-50"
    >
      {pending ? "Speichern …" : "Speichern"}
    </button>
  )
}

export type ReviewFormProps = {
  documentId: string
  findingId: string
  currentSuggestedRevision?: string | null
}

export function AnalysisFindingReviewForm({ documentId, findingId, currentSuggestedRevision }: ReviewFormProps) {
  const [state, action] = useFormState(submitAnalysisFindingReviewAction, initial)

  return (
    <form
      action={action}
      className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="findingId" value={findingId} />

      <div className="flex flex-wrap items-end gap-3">
        <label className={labelClass}>
          Entscheidung
          <select name="decision" required className={selectClass} defaultValue="">
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

      <label className={labelClass}>
        Kommentar (bei Ablehnung erforderlich)
        <textarea
          name="comment"
          rows={2}
          className={inputClass}
          placeholder="Kurze fachliche Begründung …"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Neuer Titel (nur bei &bdquo;Angepasst&ldquo;)
          <input
            name="modifiedTitle"
            className={inputClass}
            placeholder="z.B. Vertragsstrafe — überarbeitet"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Neue Beschreibung (nur bei &bdquo;Angepasst&ldquo;)
          <textarea
            name="modifiedDescription"
            rows={2}
            className={inputClass}
            placeholder="Optional: alternative Formulierung des Findings …"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Angepasster Formulierungsvorschlag (nur bei &bdquo;Angepasst&ldquo;)
          <textarea
            name="modifiedSuggestedRevision"
            rows={4}
            className={inputClass}
            defaultValue={currentSuggestedRevision ?? ""}
            placeholder="Überarbeitete Vertragsklausel — direkt einsatzbereit …"
          />
        </label>
      </div>

      <p className="text-[11px] text-slate-500">
        Nur für berechtigte Rollen sichtbar; wird protokolliert.
      </p>

      {state.message ? (
        <p
          className={`rounded-md px-3 py-2 text-xs font-medium ${
            state.status === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
