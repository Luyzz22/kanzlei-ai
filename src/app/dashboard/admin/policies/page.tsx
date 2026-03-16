import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import {
  TENANT_POLICY_CATEGORIES,
  TENANT_POLICY_MATURITY_LABELS,
  type TenantPolicyMaturity
} from "@/config/tenant-policies"
import { requireAdminAccess } from "@/lib/admin/guards"

const maturityTone: Record<TenantPolicyMaturity, "neutral" | "info" | "warning" | "success"> = {
  read_only_grundlage: "neutral",
  definiert: "info",
  in_vorbereitung: "warning",
  verfuegbar: "success"
}

export default async function AdminPoliciesPage() {
  const guard = await requireAdminAccess()

  if (!guard.ok) {
    return (
      <AdminEmptyState
        title="Tenant Policy Registry"
        description={
          guard.status === 401
            ? "Bitte melden Sie sich an, um die Richtlinienübersicht im Administrationsbereich zu öffnen."
            : "Zugriff nur für Administratoren. Dieser Bereich bündelt tenantbezogene Richtlinien und Governance-Einordnungen."
        }
        backHref={guard.status === 401 ? "/login" : "/dashboard/admin"}
        backLabel={guard.status === 401 ? "Zur Anmeldung" : "Zurück zum Admin Center"}
      />
    )
  }

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · Governance"
        title="Tenant Policy Registry"
        description="Read-only Richtlinienübersicht für Tenant-Administration, Datenschutz, Compliance und IT. Diese Seite dient der strukturierten Einordnung; aktive Konfiguration und technische Durchsetzung folgen in späteren Ausbaupaketen."
      />

      <InfoPanel title="Ausbaustand" tone="muted">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label="Read-only Registry" tone="info" />
          <StatusBadge label="Keine aktive Mutation" tone="neutral" />
          <StatusBadge label="Technische Durchsetzung folgt" tone="warning" />
        </div>
        <p className="mt-3">
          Die aktuelle Darstellung zeigt Richtlinienbereiche, Reifegrad, Verantwortungsbereiche und geplante
          Ausbaupfade pro Tenant. Konfigurierbarkeit, Versionierung und Freigabeworkflows werden bewusst getrennt in
          Folge-PRs ergänzt.
        </p>
      </InfoPanel>

      <section className="grid gap-4 md:grid-cols-2">
        {TENANT_POLICY_CATEGORIES.map((category) => (
          <article key={category.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">{category.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{category.description}</p>
              </div>
              <StatusBadge
                label={TENANT_POLICY_MATURITY_LABELS[category.maturity]}
                tone={maturityTone[category.maturity]}
              />
            </div>

            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex items-start justify-between gap-4 rounded-md bg-slate-50 p-2">
                <dt className="text-slate-500">Verantwortungsbereich</dt>
                <dd className="font-medium text-slate-800">{category.owner}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-2">
                <dt className="text-slate-500">Richtlinienpunkte</dt>
                <dd>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                    {category.policies.map((policy) => (
                      <li key={policy}>{policy}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="rounded-md bg-slate-50 p-2">
                <dt className="text-slate-500">Letzter Review-Hinweis</dt>
                <dd className="mt-1 text-slate-700">{category.reviewHint}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-2">
                <dt className="text-slate-500">Nächster Ausbaupfad</dt>
                <dd className="mt-1 text-slate-700">{category.nextMilestone}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3 font-semibold">Richtlinienbereich</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Verantwortlich</th>
                <th className="p-3 font-semibold">Review-Hinweis</th>
                <th className="p-3 font-semibold">Nächster Ausbau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {TENANT_POLICY_CATEGORIES.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-medium text-slate-900">{category.title}</td>
                  <td className="p-3">
                    <StatusBadge
                      label={TENANT_POLICY_MATURITY_LABELS[category.maturity]}
                      tone={maturityTone[category.maturity]}
                    />
                  </td>
                  <td className="p-3 text-slate-700">{category.owner}</td>
                  <td className="p-3 text-slate-600">{category.reviewHint}</td>
                  <td className="p-3 text-slate-600">{category.nextMilestone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Richtlinien als Tenant-Struktur"
          description="Die Registry schafft eine gemeinsame Sicht auf Governance-Bereiche, Zuständigkeiten und Ausbaustand."
          meta="Einordnung"
          tone="muted"
        />
        <FeatureCard
          title="Trennung von Lesen und Steuern"
          description="Read-only Übersicht und spätere technische Steuerung bleiben bewusst getrennt, um Ausbaupfade nachvollziehbar zu halten."
          meta="Governance"
          tone="muted"
        />
        <FeatureCard
          title="Vorbereitung für nächste PRs"
          description="Die Struktur ist darauf ausgelegt, spätere Freigaben, Versionierung und technische Policy-Durchsetzung kontrolliert anzubinden."
          meta="Ausbaupfad"
          tone="muted"
        />
      </section>

      <CtaPanel
        title="Nächster Schritt im Administrationsbereich"
        description="Nutzen Sie diese Registry als Abstimmungsgrundlage zwischen Administration, Datenschutz, Compliance und IT. Die aktive Richtlinienkonfiguration folgt in getrennten Ausbaupaketen."
        primaryLabel="Zurück zum Admin Center"
        primaryHref="/dashboard/admin"
        secondaryLabel="Audit-Protokoll öffnen"
        secondaryHref="/dashboard/audit"
        variant="default"
      />
    </main>
  )
}
