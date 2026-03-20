import Link from "next/link"
import { DocumentIntakeStatus } from "@prisma/client"

import { PageShell } from "@/components/marketing/page-shell"
import { SectionIntro } from "@/components/marketing/section-intro"
import { TableShell } from "@/components/marketing/table-shell"
import { StatusBadge } from "@/components/marketing/status-badge"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { listReviewQueueDocuments } from "@/lib/documents/review-core"
import { getReviewReadinessTone } from "@/lib/documents/review-workbench-core"

import { ReviewRowActions } from "@/app/workspace/review-queue/review-row-actions"

const statusTone: Record<DocumentIntakeStatus, "warning" | "info" | "success" | "neutral"> = {
  EINGEGANGEN: "warning",
  IN_PRUEFUNG: "info",
  FREIGEGEBEN: "success",
  ARCHIVIERT: "neutral"
}

const statusLabel: Record<DocumentIntakeStatus, string> = {
  EINGEGANGEN: "Eingegangen",
  IN_PRUEFUNG: "In Prüfung",
  FREIGEGEBEN: "Freigegeben",
  ARCHIVIERT: "Archiviert"
}

export default async function WorkspaceReviewQueuePage() {
  const session = await auth()

  if (!session?.user?.id || !session.user.role) {
    return (
      <PageShell width="default" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Review Queue"
          title="Review-Queue nicht verfügbar"
          description="Bitte melden Sie sich an, um den mandantengebundenen Prüf- und Freigabekontext zu öffnen."
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
          eyebrow="Workspace · Review Queue"
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
          eyebrow="Workspace · Review Queue"
          title="Mandantenkontext nicht eindeutig"
          description="Diese Ansicht erfordert einen eindeutigen Mandantenkontext. Die gesteuerte Auswahl folgt in einem späteren Ausbau."
        />
      </PageShell>
    )
  }

  const documents = await listReviewQueueDocuments(tenantContext.tenantId)

  return (
    <PageShell className="space-y-6">
      <SectionIntro
        eyebrow="Workspace · Review Queue"
        title="Prüf- und Freigabequeue"
        description="Die Queue zeigt review-fähige Dokumente für den aktiven Mandanten. Privilegierte Schritte (Freigabe/Archivierung) erfordern eine Begründung, folgen dem Vier-Augen-Grundsatz und werden tenant-gebunden auditierbar protokolliert."
      />

      <TableShell title="Review-Queue" description="Prüf- und Freigabefähige Dokumente für den aktiven Mandantenkontext.">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Dokument</th>
                <th className="px-4 py-3 font-semibold">Typ</th>
                <th className="px-4 py-3 font-semibold">Organisation / Mandant</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Freigabereife</th>
                <th className="px-4 py-3 font-semibold">Review-Verantwortung</th>
                <th className="px-4 py-3 font-semibold">Fälligkeit</th>
                <th className="px-4 py-3 font-semibold">Offene Findings</th>
                <th className="px-4 py-3 font-semibold">Entscheidungsvermerk</th>
                <th className="px-4 py-3 font-semibold">Eingang</th>
                <th className="px-4 py-3 font-semibold">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.length ? (
                documents.map((document) => (
                  <tr key={document.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{document.title}</p>
                      <Link href={`/workspace/dokumente/${document.id}`} className="text-xs text-slate-500 underline-offset-4 hover:underline">
                        {document.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{document.documentType}</td>
                    <td className="px-4 py-3 text-slate-600">{document.organizationName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={statusLabel[document.status]} tone={statusTone[document.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={document.readinessLabel} tone={getReviewReadinessTone(document.readiness)} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{document.reviewOwnerLabel ?? "Nicht zugewiesen"}</td>
                    <td className="px-4 py-3 text-slate-600">{document.reviewDueAt ? new Date(document.reviewDueAt).toLocaleDateString("de-DE") : "Nicht gesetzt"}</td>
                    <td className="px-4 py-3 text-slate-600">{document.openFindingsCount}</td>
                    <td className="px-4 py-3 text-slate-600">{document.hasDecisionMemo ? "Vorhanden" : "Fehlt"}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(document.createdAt).toLocaleDateString("de-DE")}</td>
                    <td className="min-w-56 px-4 py-3">
                      <ReviewRowActions documentId={document.id} currentStatus={document.status} userRole={session.user.role} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-6 text-sm text-slate-600">
                    Derzeit liegen keine review-fähigen Dokumente im Status „Eingegangen“ oder „In Prüfung“ vor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>
    </PageShell>
  )
}
