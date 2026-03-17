import Link from "next/link"

import { DocumentActivityTimeline } from "@/components/documents/document-activity-timeline"
import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { listDocumentActivities } from "@/lib/documents/document-activity-core"
import { getDocumentFileAccessContext, readDocumentTxtPreviewByStorageKey } from "@/lib/documents/file-access-core"
import {
  getWorkspaceDocumentById,
  getWorkspaceDocumentStatusLabel,
  getWorkspaceDocumentStatusTone
} from "@/lib/documents/workspace-core"

type DokumentDetailPageProps = {
  params: {
    id: string
  }
}

function formatSize(sizeBytes: number | null): string {
  if (!sizeBytes || sizeBytes <= 0) return "Nicht hinterlegt"

  if (sizeBytes < 1024) return `${sizeBytes} Bytes`

  const kb = sizeBytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`

  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

function getPreviewHint(mode: "txt" | "pdf" | "office" | "none"): string {
  if (mode === "txt") return "Read-only Textvorschau verfügbar"
  if (mode === "pdf") return "PDF erkannt · Browser-Vorschau folgt in einem späteren Ausbau"
  if (mode === "office") return "Office-Dokument erkannt · Vorschaufunktion folgt"
  return "Für dieses Dateiformat ist aktuell keine Vorschau verfügbar"
}

export default async function DokumentDetailPage({ params }: DokumentDetailPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Dokumentdetail nicht verfügbar"
          description="Bitte melden Sie sich an, um Dokumente im tenant-gebundenen Arbeitsbereich zu öffnen."
        />
        <Link href="/login" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
          Zur Anmeldung
        </Link>
      </main>
    )
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Kein Mandantenkontext verfügbar"
          description="Für dieses Konto ist aktuell kein eindeutiger Mandantenkontext hinterlegt."
        />
      </main>
    )
  }

  if (tenantContext.status === "multiple") {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Mandantenkontext nicht eindeutig"
          description="Diese Ansicht erfordert einen eindeutigen Mandantenkontext. Die gesteuerte Auswahl folgt in einem späteren Ausbau."
        />
      </main>
    )
  }

  try {
    const document = await getWorkspaceDocumentById(tenantContext.tenantId, params.id)

    if (!document) {
      return (
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Workspace · Dokumente"
            title="Dokument nicht gefunden"
            description="Das angeforderte Dokument ist in diesem Arbeitsbereich nicht verfügbar."
          />

          <InfoPanel title="Hinweis" tone="muted">
            Bitte prüfen Sie die Dokument-ID oder öffnen Sie die Dokumentenübersicht erneut.
            <div className="mt-4">
              <Link href="/workspace/dokumente" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                Zurück zur Dokumentenübersicht
              </Link>
            </div>
          </InfoPanel>
        </main>
      )
    }

    const [activities, fileAccessContext] = await Promise.all([
      listDocumentActivities({
        tenantId: tenantContext.tenantId,
        documentId: document.id,
        documentCreatedAt: document.createdAt,
        uploadedByLabel: document.uploadedByLabel
      }),
      getDocumentFileAccessContext(tenantContext.tenantId, document.id)
    ])

    const txtPreview = fileAccessContext?.previewMode === "txt" && fileAccessContext.fileAvailable && fileAccessContext.storageKey
      ? await readDocumentTxtPreviewByStorageKey(fileAccessContext.storageKey)
      : null

    return (
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <SectionIntro
            eyebrow="Dokumentdetail · Read-only"
            title={document.title}
            description="Einzelfallansicht mit tenant-gebundener Nachvollziehbarkeit von Status, Kontext und Review-Stand."
          />

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dokument-ID</p>
              <p className="font-medium text-slate-900">{document.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dokumenttyp</p>
              <p className="font-medium text-slate-900">{document.documentType}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Organisation / Mandant</p>
              <p className="font-medium text-slate-900">{document.organizationName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge label={getWorkspaceDocumentStatusLabel(document.status)} tone={getWorkspaceDocumentStatusTone(document.status)} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Eingegangen</p>
              <p className="font-medium text-slate-900">{new Date(document.createdAt).toLocaleDateString("de-DE")}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <FeatureCard
            title="Dokumentkontext"
            description={document.description ?? "Keine zusätzliche Beschreibung hinterlegt."}
            meta={`Dateiname: ${document.filename}`}
          />
          <FeatureCard
            title="Upload- und Bearbeitungskontext"
            description={`Bearbeitungsverantwortung: ${document.uploadedByLabel}\n\nErfasst am: ${new Date(document.createdAt).toLocaleString("de-DE")}`}
            meta={document.mimeType ? `MIME-Typ: ${document.mimeType}` : "MIME-Typ nicht hinterlegt"}
          />
          <FeatureCard
            title="Prüf- und Freigabekontext"
            description={document.reviewContext}
            meta={`Aktueller Status: ${getWorkspaceDocumentStatusLabel(document.status)}`}
          />
          <FeatureCard
            title="Technische Metadaten"
            description={`Dokument-ID: ${document.id}\nDateigröße: ${formatSize(fileAccessContext?.sizeBytes ?? document.sizeBytes ?? null)}`}
            meta={fileAccessContext?.hasStorageReference ? "Dateiablage referenziert (tenant-gebunden)" : "Dateiablage noch nicht vorhanden"}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Dateizugriff & Vorschau</h2>
          <p className="mt-1 text-sm text-slate-600">
            Der Zugriff erfolgt ausschließlich tenant-gebunden. Weitere Vorschaufunktionen folgen in einem späteren Ausbau.
          </p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateiname</p>
              <p className="font-medium text-slate-900">{document.filename}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateiformat (MIME)</p>
              <p className="font-medium text-slate-900">{document.mimeType ?? "Nicht hinterlegt"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateigröße</p>
              <p className="font-medium text-slate-900">{formatSize(fileAccessContext?.sizeBytes ?? document.sizeBytes ?? null)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateiablage</p>
              <p className="font-medium text-slate-900">
                {fileAccessContext?.fileAvailable
                  ? "Vorhanden"
                  : fileAccessContext?.hasStorageReference
                    ? "Referenz vorhanden, Datei nicht auffindbar"
                    : "Nicht vorhanden"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {fileAccessContext?.fileAvailable ? (
              <Link
                href={`/api/workspace/dokumente/${document.id}/download`}
                className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Dokument herunterladen
              </Link>
            ) : (
              <p className="text-sm text-slate-600">Download aktuell nicht verfügbar, da keine vollständige Dateiablage vorliegt.</p>
            )}
          </div>

          <InfoPanel title="Vorschauhinweis" tone="muted">
            {fileAccessContext?.fileAvailable ? getPreviewHint(fileAccessContext.previewMode) : "Keine Vorschau verfügbar, da keine vollständige Dateiablage vorliegt."}
          </InfoPanel>

          {txtPreview ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Textvorschau (read-only)</p>
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-sm text-slate-800">{txtPreview}</pre>
            </div>
          ) : null}
        </section>

        <DocumentActivityTimeline activities={activities} />

        <InfoPanel title="Nächste Schritte" tone="muted">
          <div className="flex flex-wrap gap-3">
            <Link href="/workspace/dokumente" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zur Dokumentenliste
            </Link>
            <Link href="/workspace/review-queue" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zur Review-Queue
            </Link>
          </div>
        </InfoPanel>

        <CtaPanel
          title="Arbeitskontext"
          description="Die Detailansicht bleibt bewusst read-only und fokussiert auf nachvollziehbare Dokumentdaten."
          primaryLabel="Zur Dokumentenliste"
          primaryHref="/workspace/dokumente"
          secondaryLabel="Upload öffnen"
          secondaryHref="/workspace/upload"
        />
      </main>
    )
  } catch {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Dokumentdetail derzeit nicht verfügbar"
          description="Das Dokument konnte aktuell nicht geladen werden. Bitte versuchen Sie es erneut."
        />
      </main>
    )
  }
}
