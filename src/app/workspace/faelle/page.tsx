import Link from "next/link"

import { EmptyState } from "@/components/marketing/empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageShell } from "@/components/marketing/page-shell"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { TableShell } from "@/components/marketing/table-shell"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { getCaseRegistryCounts, listCaseRegistryEntries } from "@/lib/documents/case-registry-core"

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value)
}

export default async function WorkspaceFaellePage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <PageShell width="default" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Fallregister"
          title="Fallregister nicht verfügbar"
          description="Bitte melden Sie sich an, um die tenant-gebundene Dossier- und Governance-Übersicht zu öffnen."
        />
        <Link href="/login" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
          Zur Anmeldung
        </Link>
      </PageShell>
    )
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return (
      <PageShell width="default" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Fallregister"
          title="Kein Mandantenkontext verfügbar"
          description="Für dieses Konto ist aktuell kein eindeutiger Mandantenkontext hinterlegt."
        />
      </PageShell>
    )
  }

  if (tenantContext.status === "multiple") {
    return (
      <PageShell width="default" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Fallregister"
          title="Mandantenkontext nicht eindeutig"
          description="Diese Ansicht erfordert einen eindeutigen Mandantenkontext. Die gesteuerte Auswahl folgt in einem späteren Ausbau."
        />
      </PageShell>
    )
  }

  try {
    const entries = await listCaseRegistryEntries(tenantContext.tenantId)
    const counts = getCaseRegistryCounts(entries)

    return (
      <PageShell className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Fallregister"
          title="Fallregister"
          description="Das Register konsolidiert tenant-gebundene Dokumentfälle als Dossier- und Governance-Arbeitsliste. Die operative Dokumentenliste bleibt weiterhin der Einstieg für Intake und Detailbearbeitung."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Gesamtzahl Fälle</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{counts.total}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">In Prüfung</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{counts.inReview}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Freigegeben</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{counts.approved}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Nachweis vorbereitet</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{counts.evidencePrepared}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Handlungsbedarf</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{counts.actionRequired}</p>
          </article>
        </section>

        <TableShell
          title="Dossier-Index"
          description="Tenant-gebundene Übersicht über Dokumentfälle mit Bearbeitungs-, Review- und Nachweisstand."
        >
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Fall / Dokument</th>
                <th className="px-4 py-3 font-semibold">Typ</th>
                <th className="px-4 py-3 font-semibold">Organisation / Mandant</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Review-Stand</th>
                <th className="px-4 py-3 font-semibold">Nachweisstand</th>
                <th className="px-4 py-3 font-semibold">Verantwortlich</th>
                <th className="px-4 py-3 font-semibold">Letzte Aktivität</th>
                <th className="px-4 py-3 font-semibold">Einstieg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.length ? (
                entries.map((entry) => (
                  <tr key={entry.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <Link
                        href={`/workspace/dokumente/${entry.id}`}
                        className="font-medium text-slate-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                      >
                        {entry.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{entry.id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.documentType}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.organizationName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={entry.statusLabel} tone={entry.statusTone} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={entry.reviewLabel} tone={entry.reviewTone} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={entry.evidenceLabel} tone={entry.evidenceTone} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.ownerLabel}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">{entry.lastActivityLabel}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(entry.lastActivityAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Link href={`/workspace/dokumente/${entry.id}`} className="text-xs text-slate-700 underline-offset-4 hover:underline">
                          Workbench öffnen
                        </Link>
                        <Link href={`/workspace/dokumente/${entry.id}/evidence`} className="text-xs text-slate-700 underline-offset-4 hover:underline">
                          Evidence Package
                        </Link>
                        <Link href="/workspace/review-queue" className="text-xs text-slate-700 underline-offset-4 hover:underline">
                          Review Queue
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-6">
                    <EmptyState
                      title="Keine Dokumentfälle vorhanden"
                      description="Für diesen Mandanten liegen derzeit noch keine dokumentbezogenen Fälle vor. Neue Fälle entstehen mit dem Dokumenteingang und werden anschließend im Review- und Nachweiskontext fortgeführt."
                      actionLabel="Zum Upload"
                      actionHref="/workspace/upload"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>

        <InfoPanel title="Governance-Kontext" tone="muted">
          <p className="text-sm text-slate-700">
            Der Nachweisstand wird konservativ aus belastbaren Review-Bausteinen, dokumentierten Aktivitäten und dem aktuellen Dokumentstatus abgeleitet.
            Für einzelne Fälle sind noch nicht alle Nachweisbausteine verfügbar.
          </p>
        </InfoPanel>
      </PageShell>
    )
  } catch {
    return (
      <PageShell width="default" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Fallregister"
          title="Fallübersicht derzeit nicht verfügbar"
          description="Die Fallübersicht konnte aktuell nicht geladen werden. Bitte versuchen Sie es erneut."
        />
      </PageShell>
    )
  }
}
