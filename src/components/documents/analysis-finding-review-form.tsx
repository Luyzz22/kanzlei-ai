"use client"

import { useState } from "react"
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

const labelClass = "block text-xs font-medium text-slate-700"

/* ================================================================ */
/* RADIO OPTION CONFIG                                              */
/* ================================================================ */

type DecisionOption = {
  value: string
  label: string
  description: string
  icon: string
  color: {
    ring: string
    bg: string
    dot: string
    border: string
    text: string
  }
}

const decisionOptions: DecisionOption[] = [
  {
    value: "AKZEPTIERT",
    label: "Akzeptiert",
    description: "Finding ist fachlich korrekt und wird \u00fcbernommen",
    icon: "\u2713",
    color: {
      ring: "ring-emerald-500",
      bg: "bg-emerald-50",
      dot: "bg-emerald-500",
      border: "border-emerald-200",
      text: "text-emerald-700",
    },
  },
  {
    value: "KENNTNISGENOMMEN",
    label: "Kenntnisgenommen",
    description: "Zur Kenntnis genommen \u2014 keine Aktion erforderlich",
    icon: "\u25CB",
    color: {
      ring: "ring-blue-500",
      bg: "bg-blue-50",
      dot: "bg-blue-500",
      border: "border-blue-200",
      text: "text-blue-700",
    },
  },
  {
    value: "ABGELEHNT",
    label: "Abgelehnt",
    description: "Fachlich nicht zutreffend (Begr\u00fcndung erforderlich)",
    icon: "\u2715",
    color: {
      ring: "ring-rose-500",
      bg: "bg-rose-50",
      dot: "bg-rose-500",
      border: "border-rose-200",
      text: "text-rose-700",
    },
  },
  {
    value: "ANGEPASST",
    label: "Angepasst",
    description: "Finding wird mit \u00c4nderungen \u00fcbernommen",
    icon: "\u270E",
    color: {
      ring: "ring-amber-500",
      bg: "bg-amber-50",
      dot: "bg-amber-500",
      border: "border-amber-200",
      text: "text-amber-700",
    },
  },
]

/* ================================================================ */
/* SUBMIT BUTTON                                                    */
/* ================================================================ */

function SubmitReviewButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-[#003856] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#002a42] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Speichern \u2026
        </>
      ) : (
        "Bewertung speichern"
      )}
    </button>
  )
}

/* ================================================================ */
/* FORM                                                             */
/* ================================================================ */

export type ReviewFormProps = {
  documentId: string
  findingId: string
  currentSuggestedRevision?: string | null
}

export function AnalysisFindingReviewForm({ documentId, findingId, currentSuggestedRevision }: ReviewFormProps) {
  const [state, action] = useFormState(submitAnalysisFindingReviewAction, initial)
  const [decision, setDecision] = useState<string>("")

  const showComment = decision === "ABGELEHNT" || decision === "ANGEPASST" || decision === "KENNTNISGENOMMEN"
  const commentRequired = decision === "ABGELEHNT"
  const showModificationFields = decision === "ANGEPASST"

  return (
    <form
      action={action}
      className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="findingId" value={findingId} />

      {/* Decision \u2014 Radio Buttons */}
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Entscheidung
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {decisionOptions.map((opt) => {
            const selected = decision === opt.value
            return (
              <label
                key={opt.value}
                className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                  selected
                    ? `${opt.color.border} ${opt.color.bg} ring-1 ${opt.color.ring}`
                    : "border-slate-150 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={opt.value}
                  checked={selected}
                  onChange={() => setDecision(opt.value)}
                  required
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                    selected ? opt.color.dot : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {opt.icon}
                </span>
                <span className="min-w-0">
                  <span
                    className={`text-[13px] font-medium ${
                      selected ? opt.color.text : "text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">
                    {opt.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* Comment \u2014 conditional visibility */}
      {showComment && (
        <div>
          <label className={labelClass}>
            Kommentar{commentRequired && <span className="ml-1 text-rose-500">*</span>}
            {commentRequired && (
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">(bei Ablehnung erforderlich)</span>
            )}
            <textarea
              name="comment"
              rows={2}
              required={commentRequired}
              className={inputClass}
              placeholder="Kurze fachliche Begr\u00fcndung \u2026"
            />
          </label>
        </div>
      )}

      {/* Modification fields \u2014 only for ANGEPASST */}
      {showModificationFields && (
        <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/30 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Anpassungen
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Neuer Titel
              <input
                name="modifiedTitle"
                className={inputClass}
                placeholder="z.B. Vertragsstrafe \u2014 \u00fcberarbeitet"
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Neue Beschreibung
              <textarea
                name="modifiedDescription"
                rows={2}
                className={inputClass}
                placeholder="Alternative Formulierung des Findings \u2026"
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Angepasster Formulierungsvorschlag
              <textarea
                name="modifiedSuggestedRevision"
                rows={4}
                className={inputClass}
                defaultValue={currentSuggestedRevision ?? ""}
                placeholder="\u00dcberarbeitete Vertragsklausel \u2014 direkt einsatzbereit \u2026"
              />
            </label>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <p className="text-[10px] text-slate-400">
          Nur f\u00fcr berechtigte Rollen sichtbar \u00b7 wird protokolliert
        </p>
        <SubmitReviewButton disabled={!decision} />
      </div>

      {/* Feedback message */}
      {state.message ? (
        <p
          className={`rounded-lg px-3 py-2 text-[12px] font-medium ${
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
