"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  processDocumentNowAction,
  type DocumentProcessingFormState
} from "@/app/workspace/dokumente/[id]/actions"

const initialState: DocumentProcessingFormState = {
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
      {pending ? "Verarbeitung läuft …" : "Verarbeitung starten"}
    </button>
  )
}

type ProcessingTriggerFormProps = {
  documentId: string
}

export function ProcessingTriggerForm({ documentId }: ProcessingTriggerFormProps) {
  const [state, formAction] = useFormState(processDocumentNowAction, initialState)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="documentId" value={documentId} />
      <SubmitButton />

      {state.message ? (
        <p
          className={`text-sm ${
            state.status === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
