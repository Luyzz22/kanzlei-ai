import Link from "next/link"

import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import {
  ADMIN_CENTER_AVAILABILITY_LABELS,
  ADMIN_CENTER_SECTIONS,
  type AdminCenterAvailability
} from "@/config/admin-center"
import { requireAdminAccess } from "@/lib/admin/guards"

const availabilityTone: Record<AdminCenterAvailability, "success" | "warning" | "neutral"> = {
  verfügbar: "success",
  in_vorbereitung: "warning",
  enterprise_plan: "neutral"
}

export default async function AdminCenterPage() {
  const guard = await requireAdminAccess()

  if (!guard.ok && guard.status === 401) {
    return (
      <AdminEmptyState
        title="Administrationszentrum"
        description="Bitte melden Sie sich an, um den Governance- und Steuerungsbereich zu öffnen."
        backHref="/login"
        backLabel="Zur Anmeldung"
      />
    )
  }

  if (!guard.ok && guard.status === 403) {
    return (
      <AdminEmptyState
        title="Administrationszentrum"
        description="Zugriff nur für Administratoren. Dieser Bereich bündelt sicherheits- und compliance-relevante Steuerungsfunktionen im Mandantenkontext."
      />
    )
  }

  const verfuegbar = ADMIN_CENTER_SECTIONS.filter((section) => section.availability === "verfügbar")
  const roadmap = ADMIN_CENTER_SECTIONS.filter((section) => section.availability !== "verfügbar")

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · Governance"
        title="Administrationszentrum"
        description="Zentrale Steuerungsoberfläche für Rollen, Nachweise und betriebliche Governance im Tenant. Verfügbarkeit und Reifegrad sind je Modul transparent ausgewiesen."
      />

      <InfoPanel title="Statusmodell und Leselogik" tone="muted">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Verfügbar" tone="success" />
          <StatusBadge label="In Vorbereitung" tone="warning" />
          <StatusBadge label="Nur Enterprise-Plan" tone="neutral" />
        </div>
        <p className="mt-3">
          Bereiche mit aktivem Status können bereits gelesen und für Governance-Nachweise genutzt werden. Weitere
          Module folgen ohne Änderung der bestehenden Verantwortungszuordnung.
        </p>
      </InfoPanel>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Steuerung und Nachweise</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {verfuegbar.map((section) => (
            <article key={section.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-950">{section.title}</h3>
                <StatusBadge
                  label={ADMIN_CENTER_AVAILABILITY_LABELS[section.availability]}
                  tone={availabilityTone[section.availability]}
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.summary}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-slate-900">Verantwortung</dt>
                  <dd className="text-slate-600">{section.owner}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Nächster Ausbauschritt</dt>
                  <dd className="text-slate-600">{section.nextMilestone}</dd>
                </div>
              </dl>
              {section.href ? (
                <div className="mt-4">
                  <Link
                    href={section.href}
                    className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    Bereich öffnen
                  </Link>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Roadmap und vorbereitete Module</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {roadmap.map((section) => (
            <FeatureCard
              key={section.id}
              title={section.title}
              description={`${section.summary}\n\nVerantwortung: ${section.owner}\nNächster Schritt: ${section.nextMilestone}`}
              meta={ADMIN_CENTER_AVAILABILITY_LABELS[section.availability]}
              tone={section.availability === "enterprise_plan" ? "muted" : "default"}
            />
          ))}
        </div>
      </section>

      <CtaPanel
        title="Ausbaustand Administration"
        description="Dieses Center bildet den aktuellen Governance-Lesestand ab. Schreibende Konfigurationen für Richtlinien, Rollenänderungen und Freigaben folgen in getrennten Ausbaupaketen."
        primaryLabel="Mitglieder & Rollen öffnen"
        primaryHref="/dashboard/admin/members"
        secondaryLabel="Audit-Protokoll öffnen"
        secondaryHref="/dashboard/audit"
        variant="default"
      />
    </main>
  )
}
