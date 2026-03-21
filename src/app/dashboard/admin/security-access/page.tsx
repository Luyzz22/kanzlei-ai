import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { requireAdminAccess } from "@/lib/admin/guards"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { getTenantSecuritySettings } from "@/lib/tenant-settings/security-retention-settings-core"

import { SecurityAccessForm } from "./security-access-form"

export default async function SecurityAccessPage() {
  const guard = await requireAdminAccess()

  if (!guard.ok) {
    return (
      <AdminEmptyState
        title="Sicherheit & Zugriff"
        description={
          guard.status === 401
            ? "Bitte melden Sie sich an, um tenantbezogene Sicherheitsvorgaben zu verwalten."
            : "Diese Einstellungen sind nur für Tenant-Administratoren verfügbar."
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
        title="Sicherheit & Zugriff"
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

  const settings = await getTenantSecuritySettings(tenantContext.tenantId)

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · Sicherheit"
        title="Sicherheit & Zugriff"
        description="Tenantbezogene Vorgaben für Session-Grenzen und privilegierte Aktionen. Dieser Schritt speichert belastbare Richtlinienwerte mit Auditspur; technische Durchsetzung wird kontrolliert erweitert."
      />

      <InfoPanel title="Ausbaustand / Enforcement" tone="muted">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={settings.hasPersistedSettings ? "Richtlinie gespeichert" : "Default-Werte aktiv"} tone={settings.hasPersistedSettings ? "success" : "warning"} />
          <StatusBadge label="Auditierbare Änderungsspur" tone="info" />
          <StatusBadge label="Technische Durchsetzung folgt" tone="warning" />
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Gespeicherte Werte sind sofort tenantbezogen dokumentiert und für Governance nutzbar. Einzelne Punkte wie
          MFA-Erwartung, Freigabepflicht und Begründungspflicht werden im nächsten Ausbau schrittweise technisch in
          Workflows verankert.
        </p>
      </InfoPanel>

      <SecurityAccessForm initialValues={settings} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-950">Aktuell hinterlegte Security-Vorgaben</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Admin-Session-Limit</dt>
            <dd className="mt-1 font-medium text-slate-900">{settings.adminSessionTimeoutMinutes} Minuten</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Standard-Session-Limit</dt>
            <dd className="mt-1 font-medium text-slate-900">{settings.standardSessionTimeoutMinutes} Minuten</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">MFA für privilegierte Rollen</dt>
            <dd className="mt-1 font-medium text-slate-900">{settings.requireMfaForPrivilegedRoles ? "Aktiv" : "Inaktiv"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Freigabepflicht Rollenänderungen</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {settings.requireApprovalForPrivilegedRoleChanges ? "Aktiv" : "Inaktiv"}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
