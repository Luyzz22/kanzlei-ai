import { Role } from "@prisma/client"
import Link from "next/link"

import {
  ADMIN_CENTER_AVAILABILITY_LABELS,
  ADMIN_CENTER_SECTIONS,
  type AdminCenterAvailability
} from "@/config/admin-center"
import { auth } from "@/lib/auth"

const availabilityStyles: Record<AdminCenterAvailability, string> = {
  verfügbar: "border-emerald-200 bg-emerald-50 text-emerald-700",
  in_vorbereitung: "border-amber-200 bg-amber-50 text-amber-700",
  enterprise_plan: "border-slate-200 bg-slate-100 text-slate-700"
}

export default async function AdminCenterPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Administrationszentrum</h1>
        <p className="text-sm text-muted-foreground">Bitte melden Sie sich an, um diesen Bereich zu öffnen.</p>
      </div>
    )
  }

  if (session.user.role !== Role.ADMIN) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Administrationszentrum</h1>
        <p className="text-sm text-muted-foreground">
          Zugriff nur für Administratoren. Dieser Bereich bündelt sicherheits- und compliance-relevante
          Steuerungsfunktionen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Administrationszentrum</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Zentrale Steuerung für administrative Kernprozesse Ihres Tenants. Die Bereiche sind nach
          Betriebsreife gekennzeichnet, damit Verantwortliche Roadmap, Verfügbarkeit und Freigabestatus
          transparent nachvollziehen können.
        </p>
      </header>

      <section className="rounded-lg border bg-muted/20 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Statusmodell</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
            Verfügbar
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
            In Vorbereitung
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Nur Enterprise-Plan
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {ADMIN_CENTER_SECTIONS.map((section) => {
          const statusClass = availabilityStyles[section.availability]

          return (
            <article key={section.id} className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}>
                  {ADMIN_CENTER_AVAILABILITY_LABELS[section.availability]}
                </span>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">{section.summary}</p>

              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-foreground">Verantwortungsbereich</dt>
                  <dd className="text-muted-foreground">{section.owner}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Nächster Ausbauschritt</dt>
                  <dd className="text-muted-foreground">{section.nextMilestone}</dd>
                </div>
              </dl>

              {section.href ? (
                <div className="mt-4">
                  <Link
                    href={section.href}
                    className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Bereich öffnen
                  </Link>
                </div>
              ) : null}
            </article>
          )
        })}
      </section>
    </div>
  )
}
