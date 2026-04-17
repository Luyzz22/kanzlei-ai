"use client"

import { useFormState, useFormStatus } from "react-dom"

import { createIntakeAction, type IntakeFormState } from "@/app/workspace/upload/actions"

const initialState: IntakeFormState = {
  status: "idle"
}

const inputClass = "h-10 rounded-md border border-gold-400 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003856] focus:outline-none focus:ring-1 focus:ring-[#003856]"
const textareaClass = "rounded-md border border-gold-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003856] focus:outline-none focus:ring-1 focus:ring-[#003856]"
const fileInputClass = "h-10 rounded-md border border-gold-400 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-[#003856] file:px-3 file:py-1 file:text-white file:text-xs file:font-medium hover:file:bg-[#002a42]"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#002a42] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Dokumenteingang wird angelegt…
        </>
      ) : (
        <>📤 Dokumenteingang anlegen</>
      )}
    </button>
  )
}

export function UploadIntakeForm() {
  const [state, formAction] = useFormState(createIntakeAction, initialState)

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-950">Dokumenteingang erfassen</h2>
        <p className="mt-2 text-sm text-gray-500">
          Der Eingang wird tenant-gebunden gespeichert. Eine optionale Eingangsdatei wird sicher abgelegt und über
          einen internen Storage-Key dem Dokument zugeordnet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Dokumenttitel</span>
          <input name="title" type="text" required maxLength={160} placeholder="z. B. Rahmenvertrag TechVendor GmbH" className={inputClass} />
          {state.fieldErrors?.title ? <span className="text-xs text-rose-700">{state.fieldErrors.title}</span> : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Dokumenttyp</span>
          <input name="documentType" type="text" required maxLength={80} placeholder="z. B. Lieferantenvertrag, NDA, SaaS, AVV" className={inputClass} />
          {state.fieldErrors?.documentType ? <span className="text-xs text-rose-700">{state.fieldErrors.documentType}</span> : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Organisation / Mandant</span>
          <input name="organizationName" type="text" required maxLength={120} placeholder="z. B. SBS Deutschland GmbH" className={inputClass} />
          {state.fieldErrors?.organizationName ? <span className="text-xs text-rose-700">{state.fieldErrors.organizationName}</span> : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Datei</span>
          <input
            name="file"
            type="file"
            accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className={fileInputClass}
          />
          <span className="text-xs text-gray-500">Optional. Erlaubte Formate: PDF, DOC, DOCX, TXT · maximal 25 MB</span>
          {state.fieldErrors?.file ? <span className="text-xs text-rose-700">{state.fieldErrors.file}</span> : null}
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Kurzbeschreibung / Kontext (optional)</span>
        <textarea name="description" rows={4} maxLength={1200} placeholder="Optionale Notizen zum Vertrag: Gegenseite, Verhandlungsstand, besondere Aufmerksamkeitspunkte…" className={textareaClass} />
        {state.fieldErrors?.description ? <span className="text-xs text-rose-700">{state.fieldErrors.description}</span> : null}
      </label>

      {state.message ? (
        <div className={`rounded-md border px-3 py-2 text-sm ${state.status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  )
}
