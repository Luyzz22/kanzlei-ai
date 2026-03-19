import Link from "next/link"

import { DocumentActivityTimeline } from "@/components/documents/document-activity-timeline"
import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { ProcessingTriggerForm } from "@/app/workspace/dokumente/[id]/processing-trigger-form"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { listDocumentActivities } from "@/lib/documents/document-activity-core"
import { getDocumentFileAccessContext } from "@/lib/documents/file-access-core"
import { buildDocumentAnalysisView, type AnalysisFieldStatus } from "@/lib/documents/analysis-core"
import {
  getDocumentProcessingStatusLabel,
  getDocumentProcessingStatusTone,
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

function getDisplayFilename(filename: string, hasStorageReference: boolean): string {
  if (!hasStorageReference && filename === "kein-dateiupload") {
    return "Keine Eingangsdatei hinterlegt"
  }

  return filename
}

function getAnalysisStatusTone(status: AnalysisFieldStatus): "success" | "info" | "neutral" {
  if (status === "erkannt") return "success"
  if (status === "teilweise erkannt") return "info"
  return "neutral"
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

    const documentAnalysis = buildDocumentAnalysisView({
      title: document.title,
      documentType: document.documentType,
      organizationName: document.organizationName,
      description: document.description,
      processingStatus: document.processingStatus,
      extractedTextPreview: document.extractedTextPreview
    })


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
            meta={`Dateiname: ${getDisplayFilename(document.filename, Boolean(fileAccessContext?.hasStorageReference))}`}
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
              <p className="font-medium text-slate-900">
                {getDisplayFilename(document.filename, Boolean(fileAccessContext?.hasStorageReference))}
              </p>
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
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Dokumentverarbeitung</h2>
          <p className="mt-1 text-sm text-slate-600">
            Die Verarbeitung bleibt tenant-gebunden. In dieser Ausbaustufe wird ein ehrlicher Verarbeitungsstand mit
            optionaler Textgrundlage dokumentiert.
          </p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Verarbeitungsstatus</p>
              <div className="mt-1">
                <StatusBadge
                  label={getDocumentProcessingStatusLabel(document.processingStatus)}
                  tone={getDocumentProcessingStatusTone(document.processingStatus)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Zuletzt verarbeitet</p>
              <p className="font-medium text-slate-900">
                {document.processedAt ? new Date(document.processedAt).toLocaleString("de-DE") : "Noch keine Verarbeitung durchgeführt"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateiablage-Referenz</p>
              <p className="font-medium text-slate-900">
                {document.storageKey ? "Vorhanden (tenant-gebunden)" : "Nicht hinterlegt"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Nächste Stufe</p>
              <p className="font-medium text-slate-900">Parsing, OCR und KI-Analyse folgen in späteren PRs</p>
            </div>
          </div>

          {document.processingStatus === "NICHT_UNTERSTUETZT" ? (
            <InfoPanel title="Format aktuell nicht unterstützt" tone="muted">
              Für dieses Dateiformat ist die automatische Textextraktion in der aktuellen Ausbaustufe noch nicht verfügbar.
            </InfoPanel>
          ) : null}

          {document.processingStatus === "FEHLGESCHLAGEN" ? (
            <InfoPanel title="Verarbeitung fehlgeschlagen" tone="muted">
              {document.processingError ?? "Die Verarbeitung konnte nicht abgeschlossen werden. Bitte prüfen Sie die Datei und versuchen Sie es erneut."}
            </InfoPanel>
          ) : null}

          <p className="mt-4 text-sm text-slate-600">
            Die aktuelle Verarbeitung liefert eine read-only Textgrundlage für unterstützte Formate. OCR und
            weitergehende Analysen folgen in späteren Ausbaustufen.
          </p>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Extraktion & Textgrundlage</h3>
            <p className="mt-1 text-sm text-slate-600">
              In dieser Ausbaustufe wird die tenant-gebundene Textextraktion für TXT-Dateien unterstützt.
            </p>

            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Extrahiert am</p>
                <p className="font-medium text-slate-900">
                  {document.textExtractedAt ? new Date(document.textExtractedAt).toLocaleString("de-DE") : "Noch keine Extraktion durchgeführt"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Textgrundlage</p>
                <p className="font-medium text-slate-900">
                  {document.extractedTextPreview ? "Verfügbar (Read-only Vorschau)" : "Nicht verfügbar"}
                </p>
              </div>
            </div>

            {document.extractedTextPreview ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Extrahierter Textauszug</p>
                <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-800">
                  {document.extractedTextPreview}
                </pre>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Es liegt aktuell keine extrahierbare Textgrundlage vor. Für nicht unterstützte Formate bleibt der
                Status nachvollziehbar im Verarbeitungsstand dokumentiert.
              </p>
            )}

            <div className="mt-4">
              <ProcessingTriggerForm documentId={document.id} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Strukturierte Analyse</h2>
          <p className="mt-1 text-sm text-slate-600">
            Diese read-only Analysebasis wird tenant-gebunden aus der vorhandenen Textgrundlage und Dokumentmetadaten
            abgeleitet.
          </p>

          <div className="mt-4">
            <StatusBadge
              label={`Analyse-Stand: ${documentAnalysis.analysisStatus}`}
              tone={getAnalysisStatusTone(documentAnalysis.analysisStatus)}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600">{documentAnalysis.statusHint}</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <FeatureCard
              title="Erkannte Metadaten"
              description={[
                `Dokumenteinordnung: ${documentAnalysis.inferredDocumentType.value} (${documentAnalysis.inferredDocumentType.status})`,
                `Referenz: ${documentAnalysis.reference.value ?? "nicht eindeutig erkannt"} (${documentAnalysis.reference.status})`,
                `Parteien: ${
                  documentAnalysis.parties.values.length
                    ? documentAnalysis.parties.values.join(" · ")
                    : "nicht eindeutig erkannt"
                } (${documentAnalysis.parties.status})`,
                `Datumsangaben: ${
                  documentAnalysis.dateSignals.values.length
                    ? documentAnalysis.dateSignals.values.map((entry) => `${entry.label}: ${entry.value}`).join(" · ")
                    : "nicht eindeutig erkannt"
                } (${documentAnalysis.dateSignals.status})`
              ].join("\n")}
              meta={`Dokumentkontext: ${document.organizationName}`}
            />
            <FeatureCard
              title="Erkannte Prüfbereiche"
              description={documentAnalysis.clauseAreas
                .map((entry) => `${entry.label}: ${entry.status}`)
                .join("\n")}
              meta="Die Kennzeichnung basiert auf konservativen Signalmustern aus dem Textauszug."
            />
          </div>

          <InfoPanel title="Analysehinweise" tone="muted">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {documentAnalysis.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </InfoPanel>
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
