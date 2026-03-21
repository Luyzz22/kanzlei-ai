import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { requireAdminAccess } from "@/lib/admin/guards"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { getTenantRetentionSettings } from "@/lib/tenant-settings/security-retention-settings-core"

import { PrivacyRetentionForm } from "./privacy-retention-form"

export default async function PrivacyRetentionPage() {
  const guard = await requireAdminAccess()

  if (!guard.ok) {
    return (
      <AdminEmptyState
        title="Datenschutz & Aufbewahrung"
        description={
          guard.status === 401
            ? "Bitte melden Sie sich an, um tenantbezogene Retention-Vorgaben zu verwalten."
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
        title="Datenschutz & Aufbewahrung"
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

  const settings = await getTenantRetentionSettings(tenantContext.tenantId)

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · Datenschutz"
        title="Datenschutz & Aufbewahrung"
        description="Tenantbezogene Retention- und Review-Vorgaben für den operativen Governance-Rahmen. Werte werden revisionsnah gespeichert; die technische Durchsetzung wird schrittweise ausgebaut."
      />

      <InfoPanel title="Governance-Hinweis" tone="muted">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={settings.hasPersistedSettings ? "Richtlinie gespeichert" : "Default-Werte aktiv"} tone={settings.hasPersistedSettings ? "success" : "warning"} />
          <StatusBadge label="Gespeicherte Richtlinie" tone="info" />
          <StatusBadge label="Technische Automatisierung folgt" tone="warning" />
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Diese Seite dokumentiert tenantbezogene Aufbewahrungs- und Review-Standards. Sie ersetzt keine vollständige,
          bereits automatisierte Lösch- oder Archivierungslogik, sondern schafft eine belastbare Konfigurationsbasis für
          die nächsten Enforcement-Schritte.
        </p>
      </InfoPanel>

      <PrivacyRetentionForm initialValues={settings} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-950">Aktuell hinterlegte Aufbewahrungsvorgaben</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Dokumenten-Retention</dt>
            <dd className="mt-1 font-medium text-slate-900">{settings.defaultDocumentRetentionDays} Tage</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Audit-nahe Retention</dt>
            <dd className="mt-1 font-medium text-slate-900">{settings.auditEvidenceRetentionDays} Tage</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Review-Frist</dt>
            <dd className="mt-1 font-medium text-slate-900">{settings.reviewDueDays} Tage</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-slate-500">Archivierungsfenster</dt>
            <dd className="mt-1 font-medium text-slate-900">{settings.archiveAfterApprovalDays} Tage</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
