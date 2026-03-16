"use client"

import { useFormState, useFormStatus } from "react-dom"

import { createIntakeAction, type IntakeFormState } from "@/app/workspace/upload/actions"

const initialState: IntakeFormState = {
  status: "idle"
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Dokumenteingang wird angelegt …" : "Dokumenteingang anlegen"}
    </button>
  )
}

export function UploadIntakeForm() {
  const [state, formAction] = useFormState(createIntakeAction, initialState)

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">Dokumenteingang erfassen</h2>
        <p className="mt-2 text-sm text-slate-600">
          Der Eingang wird tenant-gebunden gespeichert. Dateiinhalt wird in diesem Schritt noch nicht
          persistiert; optional werden Dateimetadaten erfasst.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Dokumenttitel</span>
          <input
            name="title"
            type="text"
            required
            maxLength={160}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.title ? <span className="text-xs text-rose-700">{state.fieldErrors.title}</span> : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Dokumenttyp</span>
          <input
            name="documentType"
            type="text"
            required
            maxLength={80}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.documentType ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.documentType}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Organisation / Mandant</span>
          <input
            name="organizationName"
            type="text"
            required
            maxLength={120}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.organizationName ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.organizationName}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Datei (optional)</span>
          <input
            name="file"
            type="file"
            className="h-10 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1"
          />
          {state.fieldErrors?.file ? <span className="text-xs text-rose-700">{state.fieldErrors.file}</span> : null}
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-800">Kurzbeschreibung / Kontext (optional)</span>
        <textarea
          name="description"
          rows={4}
          maxLength={1200}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
        />
        {state.fieldErrors?.description ? (
          <span className="text-xs text-rose-700">{state.fieldErrors.description}</span>
        ) : null}
      </label>

      {state.message ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  )
}
