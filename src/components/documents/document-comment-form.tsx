"use client"

import { useFormState, useFormStatus } from "react-dom"

import { createDocumentCommentAction, type DocumentCommentFormState } from "@/app/workspace/dokumente/[id]/actions"
import { type DocumentCommentSectionKey, documentCommentSectionOptions } from "@/config/document-comments"

type DocumentCommentFormProps = {
  documentId: string
  minBodyLength: number
  maxBodyLength: number
  maxAnchorLength: number
}

const initialState: DocumentCommentFormState = {
  status: "idle"
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Hinweis wird gespeichert …" : "Kommentar speichern"}
    </button>
  )
}

export function DocumentCommentForm({ documentId, minBodyLength, maxBodyLength, maxAnchorLength }: DocumentCommentFormProps) {
  const [state, formAction] = useFormState(createDocumentCommentAction, initialState)

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="documentId" value={documentId} />

      <div className="space-y-1">
        <label htmlFor="comment-body" className="text-sm font-medium text-slate-900">
          Kommentartext
        </label>
        <textarea
          id="comment-body"
          name="body"
          required
          minLength={minBodyLength}
          maxLength={maxBodyLength}
          rows={5}
          placeholder="Sachlichen Hinweis zum Dokument erfassen"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition placeholder:text-slate-400 focus:ring"
        />
        <p className="text-xs text-slate-500">Mindestens {minBodyLength}, maximal {maxBodyLength} Zeichen.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="comment-section" className="text-sm font-medium text-slate-900">
            Bereichsbezug
          </label>
          <select
            id="comment-section"
            name="sectionKey"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
            defaultValue=""
          >
            <option value="">Ohne Bereichsbezug</option>
            {documentCommentSectionOptions.map((option: { value: DocumentCommentSectionKey; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="comment-anchor" className="text-sm font-medium text-slate-900">
            Referenztext (optional)
          </label>
          <input
            id="comment-anchor"
            name="anchorText"
            maxLength={maxAnchorLength}
            placeholder="Kurzer Ausschnitt oder Kontext"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition placeholder:text-slate-400 focus:ring"
          />
          <p className="text-xs text-slate-500">Maximal {maxAnchorLength} Zeichen.</p>
        </div>
      </div>

      <SubmitButton />

      {state.message ? <p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p> : null}
    </form>
  )
}
