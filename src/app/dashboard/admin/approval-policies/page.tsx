import Link from "next/link"

import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { requireAdminAccess } from "@/lib/admin/guards"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { getTenantApprovalPolicy } from "@/lib/tenant-settings/approval-policy-core"

import { ApprovalPoliciesForm } from "./approval-policies-form"

export default async function ApprovalPoliciesPage() {
  const guard = await requireAdminAccess()

  if (!guard.ok) {
    return (
      <AdminEmptyState
        title="Freigaberichtlinien"
        description={
          guard.status === 401
            ? "Bitte melden Sie sich an, um tenantbezogene Freigaberichtlinien zu verwalten."
            : "Diese Richtlinien sind nur für Tenant-Administratoren verfügbar."
        }
        backHref={guard.status === 401 ? "/login" : "/dashboard/admin"}
        backLabel={guard.status === 401 ? "Zur Anmeldung" : "Zurück zum Admin Center"}
      />
    )
  }

  const tenantContext = await resolveTenantContextForUser(guard.user.id)

  if (tenantContext.status !== "single") {
    return (
      <AdminEmptyState
        title="Freigaberichtlinien"
        description={
          tenantContext.status === "none"
            ? "Für dieses Konto ist aktuell kein eindeutiger Mandantenkontext hinterlegt."
            : "Für diesen Bereich ist ein eindeutiger Mandantenkontext erforderlich."
        }
        backHref="/dashboard/admin"
        backLabel="Zurück zum Admin Center"
      />
    )
  }

  const policy = await getTenantApprovalPolicy(tenantContext.tenantId)

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · Freigaberichtlinien"
        title="Tenantbezogene Freigaberichtlinien"
        description="Diese Seite steuert die aktuell technisch durchgesetzten Kernregeln für Start der Prüfung, Freigabe und Archivierung. Erweiterte Governance-Workflows folgen in separaten Ausbauschritten."
      />

      <InfoPanel title="Aktuelle technische Wirkung" tone="muted">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={policy.hasPersistedSettings ? "Richtlinie gespeichert" : "Default-Richtlinie aktiv"} tone={policy.hasPersistedSettings ? "success" : "warning"} />
          <StatusBadge label="Review-Core technisch angebunden" tone="info" />
          <StatusBadge label="Kein BPM-Workflow in diesem Schritt" tone="neutral" />
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Gespeicherte Werte werden tenantbezogen im Review-Core ausgewertet. Sie steuern heute Statusübergänge,
          Rollenbeschränkungen, Begründungspflichten und das Vier-Augen-Prinzip.
        </p>
      </InfoPanel>

      <ApprovalPoliciesForm initialValues={policy} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-950">Aktive Freigaberichtlinien dieses Tenants</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Vier-Augen-Prinzip für Freigaben</dt>
            <dd className="mt-1 font-medium text-slate-900">{policy.requireFourEyesForApproval ? "Aktiv" : "Inaktiv"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Freigabe-Begründungspflicht</dt>
            <dd className="mt-1 font-medium text-slate-900">{policy.requireReasonForApproval ? "Aktiv" : "Inaktiv"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Archivierungs-Begründungspflicht</dt>
            <dd className="mt-1 font-medium text-slate-900">{policy.requireReasonForArchiving ? "Aktiv" : "Inaktiv"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Freigabe nur privilegierte Rollen</dt>
            <dd className="mt-1 font-medium text-slate-900">{policy.approvalRestrictedToPrivilegedRoles ? "Aktiv" : "Inaktiv"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Archivierung nur privilegierte Rollen</dt>
            <dd className="mt-1 font-medium text-slate-900">{policy.archivingRestrictedToPrivilegedRoles ? "Aktiv" : "Inaktiv"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Start der Prüfung nur privilegierte Rollen</dt>
            <dd className="mt-1 font-medium text-slate-900">{policy.reviewStartRestrictedToPrivilegedRoles ? "Aktiv" : "Inaktiv"}</dd>
          </div>
        </dl>
      </section>

      <div>
        <Link
          href="/dashboard/admin/policies"
          className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Zur Tenant Policy Registry
        </Link>
      </div>
    </main>
  )
}
