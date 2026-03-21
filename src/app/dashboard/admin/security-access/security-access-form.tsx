"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  type SecurityAccessFormState,
  updateSecurityAccessAction
} from "@/app/dashboard/admin/security-access/actions"
import type { TenantSecuritySettingsView } from "@/lib/tenant-settings/security-retention-settings-core"

const initialState: SecurityAccessFormState = {
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
      {pending ? "Sicherheitsvorgaben werden gespeichert …" : "Sicherheitsvorgaben speichern"}
    </button>
  )
}

type SecurityAccessFormProps = {
  initialValues: TenantSecuritySettingsView
}

export function SecurityAccessForm({ initialValues }: SecurityAccessFormProps) {
  const [state, formAction] = useFormState(updateSecurityAccessAction, initialState)

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Session-Grenzen</h2>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Admin-Session-Limit (Minuten)</span>
          <input
            name="adminSessionTimeoutMinutes"
            type="number"
            min={5}
            max={240}
            required
            defaultValue={initialValues.adminSessionTimeoutMinutes}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          <span className="text-xs text-slate-500">Konfigurationswert für privilegierte Admin-Sitzungen.</span>
          {state.fieldErrors?.adminSessionTimeoutMinutes ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.adminSessionTimeoutMinutes}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Standard-Session-Limit (Minuten)</span>
          <input
            name="standardSessionTimeoutMinutes"
            type="number"
            min={15}
            max={1440}
            required
            defaultValue={initialValues.standardSessionTimeoutMinutes}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          <span className="text-xs text-slate-500">Standardwert für reguläre Tenant-Sitzungen.</span>
          {state.fieldErrors?.standardSessionTimeoutMinutes ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.standardSessionTimeoutMinutes}</span>
          ) : null}
        </label>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Privilegierte Aktionen</h2>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">MFA-Erwartung für privilegierte Rollen</span>
          <select
            name="requireMfaForPrivilegedRoles"
            defaultValue={String(initialValues.requireMfaForPrivilegedRoles)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          >
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Freigabepflicht für privilegierte Rollenänderungen</span>
          <select
            name="requireApprovalForPrivilegedRoleChanges"
            defaultValue={String(initialValues.requireApprovalForPrivilegedRoleChanges)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          >
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800">Begründungspflicht für privilegierte Review-Schritte</span>
          <select
            name="requireReasonForPrivilegedReviewActions"
            defaultValue={String(initialValues.requireReasonForPrivilegedReviewActions)}
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
