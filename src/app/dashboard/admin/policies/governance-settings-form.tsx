"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  type GovernanceSettingsFormState,
  updateGovernanceSettingsAction
} from "@/app/dashboard/admin/policies/actions"
import type { TenantGovernanceSettingsView } from "@/lib/tenant-settings/governance-settings-core"

const initialState: GovernanceSettingsFormState = {
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
      {pending ? "Einstellungen werden gespeichert …" : "Einstellungen speichern"}
    </button>
  )
}

type GovernanceSettingsFormProps = {
  initialValues: TenantGovernanceSettingsView
}

export function GovernanceSettingsForm({ initialValues }: GovernanceSettingsFormProps) {
  const [state, formAction] = useFormState(updateGovernanceSettingsAction, initialState)

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Editierbare Security- und Retention-Settings
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Dieser Bereich ist tenant-gebunden. Änderungen werden mit Rollenbezug und Feldhistorie im Audit-Protokoll
          erfasst.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Zugriff & Session</h3>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Session-Timeout (Minuten)</span>
          <input
            name="sessionTimeoutMinutes"
            type="number"
            min={5}
            max={1440}
            required
            defaultValue={initialValues.sessionTimeoutMinutes}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.sessionTimeoutMinutes ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.sessionTimeoutMinutes}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">MFA für privilegierte Rollen verpflichtend</span>
          <select
            name="requireMfaForPrivilegedRoles"
            defaultValue={String(initialValues.requireMfaForPrivilegedRoles)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          >
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </select>
        </label>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Datenschutz & Aufbewahrung</h3>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Standard-Aufbewahrungstage für Dokumente</span>
          <input
            name="documentRetentionDays"
            type="number"
            min={30}
            max={3650}
            required
            defaultValue={initialValues.documentRetentionDays}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          {state.fieldErrors?.documentRetentionDays ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.documentRetentionDays}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Auto-Archivierung nach Freigabe</span>
          <select
            name="autoArchiveApprovedDocuments"
            defaultValue={String(initialValues.autoArchiveApprovedDocuments)}
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
