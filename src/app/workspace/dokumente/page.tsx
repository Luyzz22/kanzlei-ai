import Link from "next/link"

import { CtaPanel } from "@/components/marketing/cta-panel"
import { InfoPanel } from "@/components/marketing/info-panel"
import { EmptyState } from "@/components/marketing/empty-state"
import { PageShell } from "@/components/marketing/page-shell"
import { SectionIntro } from "@/components/marketing/section-intro"
import { TableShell } from "@/components/marketing/table-shell"
import { StatusBadge } from "@/components/marketing/status-badge"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import {
  getWorkspaceDocumentStatusLabel,
  getWorkspaceDocumentStatusTone,
  listWorkspaceDocuments
} from "@/lib/documents/workspace-core"

export default async function WorkspaceDokumentePage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <PageShell width="default" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Dokumentenliste nicht verfügbar"
          description="Bitte melden Sie sich an, um den tenant-gebundenen Dokumentenbereich zu öffnen."
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
          eyebrow="Workspace · Dokumente"
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
          eyebrow="Workspace · Dokumente"
          title="Mandantenkontext nicht eindeutig"
          description="Diese Ansicht erfordert einen eindeutigen Mandantenkontext. Die gesteuerte Auswahl folgt in einem späteren Ausbau."
        />
      </PageShell>
    )
  }

  try {
    const documents = await listWorkspaceDocuments(tenantContext.tenantId)

    return (
      <PageShell className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Dokumenten-Workspace"
          description="Die Übersicht zeigt den tenant-gebundenen Dokumentenbestand mit Status, Erfassungszeitpunkt und Prüfkontext."
        />

        <TableShell title="Dokumentenbestand" description="Tenant-gebundene Übersicht mit Status, Verantwortlichkeit und Prüfkontext.">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Dokument</th>
                  <th className="px-4 py-3 font-semibold">Dokumenttyp</th>
                  <th className="px-4 py-3 font-semibold">Organisation / Mandant</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Bearbeitungsverantwortung</th>
                  <th className="px-4 py-3 font-semibold">Eingegangen</th>
                  <th className="px-4 py-3 font-semibold">Prüfkontext</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {documents.length ? (
                  documents.map((document) => (
                    <tr key={document.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <Link
                          href={`/workspace/dokumente/${document.id}`}
                          className="font-medium text-slate-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                        >
                          {document.title}
                        </Link>
                        <p className="text-xs text-slate-500">{document.id}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{document.documentType}</td>
                      <td className="px-4 py-3 text-slate-600">{document.organizationName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={getWorkspaceDocumentStatusLabel(document.status)} tone={getWorkspaceDocumentStatusTone(document.status)} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{document.uploadedByLabel}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(document.createdAt).toLocaleDateString("de-DE")}</td>
                      <td className="px-4 py-3 text-slate-600">{document.reviewContext}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="px-4 py-6"><EmptyState title="Keine Dokumente vorhanden" description="Für diesen Mandanten liegen derzeit keine Dokumente vor." actionLabel="Zum Upload" actionHref="/workspace/upload" /></td></tr>
                )}
              </tbody>
            </table>
          </TableShell>

        <InfoPanel title="Orientierung" tone="muted">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Neue Dokumente können über den Upload-Workspace erfasst werden.</li>
            <li>Dokumente in Prüfung werden in der Review-Queue weiterbearbeitet.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/workspace/upload" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zum Upload
            </Link>
            <Link href="/workspace/review-queue" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zur Review-Queue
            </Link>
          </div>
        </InfoPanel>

        <CtaPanel
          title="Read-only Ausbauzustand"
          description="Die Seite fokussiert aktuell auf tenant-gebundene Lesbarkeit. Versionierung, Dateivorschau und Verlauf werden in späteren Ausbaustufen ergänzt."
          primaryLabel="Dokument erfassen"
          primaryHref="/workspace/upload"
          secondaryLabel="Review-Queue"
          secondaryHref="/workspace/review-queue"
        />
      </PageShell>
    )
  } catch {
    return (
      <PageShell width="default" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Dokumente derzeit nicht verfügbar"
          description="Die Dokumentenliste konnte aktuell nicht geladen werden. Bitte versuchen Sie es erneut."
        />
      </PageShell>
    )
  }
}
