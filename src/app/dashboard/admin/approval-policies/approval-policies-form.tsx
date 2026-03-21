"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  type ApprovalPoliciesFormState,
  updateApprovalPoliciesAction
} from "@/app/dashboard/admin/approval-policies/actions"
import type { TenantApprovalPolicyView } from "@/lib/tenant-settings/approval-policy-core"

const initialState: ApprovalPoliciesFormState = {
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
      {pending ? "Freigaberichtlinien werden gespeichert …" : "Freigaberichtlinien speichern"}
    </button>
  )
}

type ToggleFieldProps = {
  name: keyof TenantApprovalPolicyView
  label: string
  hint: string
  value: boolean
}

function ToggleField({ name, label, hint, value }: ToggleFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <select
        name={name}
        defaultValue={String(value)}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
      >
        <option value="true">Aktiv</option>
        <option value="false">Inaktiv</option>
      </select>
      <span className="text-xs text-slate-500">{hint}</span>
    </label>
  )
}

type ApprovalPoliciesFormProps = {
  initialValues: TenantApprovalPolicyView
}

export function ApprovalPoliciesForm({ initialValues }: ApprovalPoliciesFormProps) {
  const [state, formAction] = useFormState(updateApprovalPoliciesAction, initialState)

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Freigabe</h2>

        <ToggleField
          name="requireFourEyesForApproval"
          label="Vier-Augen-Prinzip für Freigaben"
          hint="Wenn aktiv, kann die hochladende Person dasselbe Dokument nicht selbst freigeben."
          value={initialValues.requireFourEyesForApproval}
        />

        <ToggleField
          name="requireReasonForApproval"
          label="Begründungspflicht für Freigaben"
          hint="Wenn aktiv, ist bei jeder Freigabe eine Begründung verpflichtend."
          value={initialValues.requireReasonForApproval}
        />

        <ToggleField
          name="approvalRestrictedToPrivilegedRoles"
          label="Freigabe nur für privilegierte Rollen"
          hint="Wenn aktiv, sind Freigaben auf Tenant OWNER/ADMIN mit Plattformrolle ADMIN begrenzt."
          value={initialValues.approvalRestrictedToPrivilegedRoles}
        />
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Archivierung & Review-Start</h2>

        <ToggleField
          name="requireReasonForArchiving"
          label="Begründungspflicht für Archivierung"
          hint="Wenn aktiv, ist bei Archivierung eine Begründung verpflichtend."
          value={initialValues.requireReasonForArchiving}
        />

        <ToggleField
          name="archivingRestrictedToPrivilegedRoles"
          label="Archivierung nur für privilegierte Rollen"
          hint="Wenn aktiv, sind Archivierungen auf privilegierte Rollen beschränkt."
          value={initialValues.archivingRestrictedToPrivilegedRoles}
        />

        <ToggleField
          name="reviewStartRestrictedToPrivilegedRoles"
          label="Start der Prüfung nur für privilegierte Rollen"
          hint="Wenn deaktiviert, gilt der bestehende konservative Startkreis (ADMIN/ANWALT oder Tenant OWNER/ADMIN)."
          value={initialValues.reviewStartRestrictedToPrivilegedRoles}
        />
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
