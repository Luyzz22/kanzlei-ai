"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  type PrivacyRetentionFormState,
  updatePrivacyRetentionAction
} from "@/app/dashboard/admin/privacy-retention/actions"
import type { TenantRetentionSettingsView } from "@/lib/tenant-settings/security-retention-settings-core"

const initialState: PrivacyRetentionFormState = {
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
      {pending ? "Retention-Vorgaben werden gespeichert …" : "Retention-Vorgaben speichern"}
    </button>
  )
}

type PrivacyRetentionFormProps = {
  initialValues: TenantRetentionSettingsView
}

export function PrivacyRetentionForm({ initialValues }: PrivacyRetentionFormProps) {
  const [state, formAction] = useFormState(updatePrivacyRetentionAction, initialState)

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Aufbewahrung</h2>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Default-Aufbewahrungsdauer für Dokumente (Tage)</span>
          <input
            name="defaultDocumentRetentionDays"
            type="number"
            min={30}
            max={3650}
            required
            defaultValue={initialValues.defaultDocumentRetentionDays}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.defaultDocumentRetentionDays ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.defaultDocumentRetentionDays}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Aufbewahrungsdauer für Audit-nahe Nachweise (Tage)</span>
          <input
            name="auditEvidenceRetentionDays"
            type="number"
            min={365}
            max={3650}
            required
            defaultValue={initialValues.auditEvidenceRetentionDays}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.auditEvidenceRetentionDays ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.auditEvidenceRetentionDays}</span>
          ) : null}
        </label>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Review & Archivierung</h2>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Review-Frist / Eskalationsfenster (Tage)</span>
          <input
            name="reviewDueDays"
            type="number"
            min={1}
            max={180}
            required
            defaultValue={initialValues.reviewDueDays}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.reviewDueDays ? <span className="text-xs text-rose-700">{state.fieldErrors.reviewDueDays}</span> : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Archivierungsfenster nach Freigabe (Tage)</span>
          <input
            name="archiveAfterApprovalDays"
            type="number"
            min={0}
            max={365}
            required
            defaultValue={initialValues.archiveAfterApprovalDays}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.archiveAfterApprovalDays ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.archiveAfterApprovalDays}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Soft-Delete / Löschvormerkung organisatorisch aktiv</span>
          <select
            name="softDeletePolicyEnabled"
            defaultValue={String(initialValues.softDeletePolicyEnabled)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          >
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </select>
        </label>
      </section>

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
