import Link from "next/link"

import { DocumentCommentsPanel } from "@/components/documents/document-comments-panel"
import { DocumentActivityTimeline } from "@/components/documents/document-activity-timeline"
import { DocumentReviewPanel } from "@/components/documents/document-review-panel"
import { EmptyState } from "@/components/marketing/empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageShell } from "@/components/marketing/page-shell"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { ProcessingTriggerForm } from "@/app/workspace/dokumente/[id]/processing-trigger-form"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { listDocumentComments } from "@/lib/documents/comments-core"
import { getDocumentWorkbenchData } from "@/lib/documents/workbench-core"
import {
  listDocumentFindings,
  listDocumentReviewNotes,
  listReviewAssignableMembers
} from "@/lib/documents/review-workbench-core"
import {
  getDocumentProcessingStatusLabel,
  getDocumentProcessingStatusTone,
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

  return `${(kb / 1024).toFixed(1)} MB`
}

function getDisplayFilename(filename: string, hasStorageReference: boolean): string {
  if (!hasStorageReference && filename === "kein-dateiupload") {
    return "Keine Eingangsdatei hinterlegt"
  }

  return filename
}

function splitPreviewText(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export default async function DokumentDetailPage({ params }: DokumentDetailPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Document Workbench nicht verfügbar"
          description="Bitte melden Sie sich an, um Dokumente im tenant-gebundenen Arbeitsbereich zu öffnen."
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
      <PageShell width="wide" className="space-y-6">
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
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Mandantenkontext nicht eindeutig"
          description="Diese Ansicht erfordert einen eindeutigen Mandantenkontext. Die gesteuerte Auswahl folgt in einem späteren Ausbau."
        />
      </PageShell>
    )
  }

  try {
    const workbench = await getDocumentWorkbenchData(tenantContext.tenantId, session.user.id, params.id)

    if (!workbench) {
      return (
        <PageShell width="wide" className="space-y-6">
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
        </PageShell>
      )
    }

    const [commentsResult, notesResult, findingsResult, assignableMembersResult] = await Promise.all([
      listDocumentComments({
        tenantId: tenantContext.tenantId,
        actorId: session.user.id,
        documentId: params.id
      }),
      listDocumentReviewNotes(tenantContext.tenantId, session.user.id, params.id),
      listDocumentFindings(tenantContext.tenantId, session.user.id, params.id),
      listReviewAssignableMembers(tenantContext.tenantId, session.user.id)
    ])

    if (!commentsResult.ok || !notesResult.ok || !findingsResult.ok || !assignableMembersResult.ok) {
      const code = commentsResult.ok
        ? notesResult.ok
          ? findingsResult.ok
            ? assignableMembersResult.code
            : findingsResult.code
          : notesResult.code
        : commentsResult.code

      if (code === "FORBIDDEN_MEMBERSHIP") {
        return (
          <PageShell width="wide" className="space-y-6">
            <SectionIntro
              eyebrow="Workspace · Dokumente"
              title="Keine Berechtigung"
              description="Für diese Aktion fehlt die erforderliche Berechtigung."
            />
          </PageShell>
        )
      }

      return (
        <PageShell width="wide" className="space-y-6">
          <SectionIntro
            eyebrow="Workspace · Dokumente"
            title="Dokument nicht gefunden"
            description="Das angeforderte Dokument ist in diesem Arbeitsbereich nicht verfügbar."
          />
        </PageShell>
      )
    }

    const { document, activities, fileAccess, analysis, reviewContext, reviewSummary } = workbench
    const previewParagraphs = document.extractedTextPreview ? splitPreviewText(document.extractedTextPreview) : []

    return (
      <PageShell width="wide" className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <SectionIntro
            eyebrow="Document Workbench · Read-only"
            title={document.title}
            description="Tenant-gebundene Arbeitsoberfläche für Dokumentkontext, Textgrundlage, strukturierte Analyse, Freigabekontext und Verlauf."
          />

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-6">
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
              <p className="text-xs uppercase tracking-wide text-slate-500">Bearbeitungsstand</p>
              <div className="mt-1">
                <StatusBadge label={getWorkspaceDocumentStatusLabel(document.status)} tone={getWorkspaceDocumentStatusTone(document.status)} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Verarbeitungsstand</p>
              <div className="mt-1">
                <StatusBadge
                  label={getDocumentProcessingStatusLabel(document.processingStatus)}
                  tone={getDocumentProcessingStatusTone(document.processingStatus)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Eingegangen</p>
              <p className="font-medium text-slate-900">{new Date(document.createdAt).toLocaleDateString("de-DE")}</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-600">{document.reviewContext} Diese Arbeitsoberfläche bleibt bewusst read-only und nachvollziehbar.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/workspace/dokumente/${document.id}/dossier`} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Dossier öffnen
            </Link>
            <Link href={`/workspace/dokumente/${document.id}/evidence`} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Nachweispaket öffnen
            </Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
          <InfoPanel title="Textgrundlage" tone="default">
            <p className="text-sm text-slate-600">
              Extrahierter Dokumenttext als Arbeitsgrundlage. Die Vorschau basiert auf verfügbarer Extraktion und wird tenant-gebunden bereitgestellt.
            </p>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Dateiname</p>
                <p className="font-medium text-slate-900">{getDisplayFilename(document.filename, Boolean(fileAccess?.hasStorageReference))}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Dateigröße</p>
                <p className="font-medium text-slate-900">{formatSize(fileAccess?.sizeBytes ?? document.sizeBytes ?? null)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Extrahiert am</p>
                <p className="font-medium text-slate-900">
                  {document.textExtractedAt ? new Date(document.textExtractedAt).toLocaleString("de-DE") : "Noch keine Extraktion durchgeführt"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Dateizugriff</p>
                <p className="font-medium text-slate-900">
                  {fileAccess?.fileAvailable
                    ? "Dateiablage verfügbar"
                    : fileAccess?.hasStorageReference
                      ? "Referenz vorhanden, Datei derzeit nicht auffindbar"
                      : "Keine Dateiablage hinterlegt"}
                </p>
              </div>
            </div>

            {previewParagraphs.length ? (
              <div className="mt-4 max-h-[560px] space-y-3 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
                {previewParagraphs.map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 16)}`} className="text-sm leading-relaxed text-slate-800">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="Keine nutzbare Textgrundlage verfügbar"
                  description="Für dieses Dokument liegt derzeit noch keine nutzbare Textgrundlage vor. Die strukturierte Analyse ist erst nach erfolgreicher Textextraktion verfügbar."
                />
              </div>
            )}

            {document.processingStatus === "FEHLGESCHLAGEN" ? (
              <p className="mt-4 text-sm text-rose-700">
                Verarbeitungshinweis: {document.processingError ?? "Die Verarbeitung konnte nicht abgeschlossen werden."}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              {fileAccess?.fileAvailable ? (
                <Link
                  href={`/api/workspace/dokumente/${document.id}/download`}
                  className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Dokument herunterladen
                </Link>
              ) : null}
              <ProcessingTriggerForm documentId={document.id} />
            </div>
          </InfoPanel>

          <div className="space-y-4">
            <InfoPanel title="Strukturierte Analyse" tone="default">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Erkannte Metadaten</p>
                  <div className="mt-2 space-y-3">
                    {analysis.metadata.map((section) => (
                      <div key={section.heading} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-medium text-slate-900">{section.heading}</p>
                        {section.values.length ? (
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                            {section.values.map((value) => (
                              <li key={value}>{value}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-sm text-slate-600">{section.emptyHint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prüfbereiche / Klauselthemen</p>
                  <ul className="mt-2 space-y-2">
                    {analysis.clauseTopics.map((topic) => (
                      <li key={topic.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">{topic.label}</p>
                          <StatusBadge label={topic.available ? "Erkannt" : "Offen"} tone={topic.available ? "info" : "neutral"} />
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{topic.note}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Analysehinweise / Grenzen</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {analysis.guidance.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </InfoPanel>

            <InfoPanel title="Review- & Freigabekontext" tone="muted">
              <div className="grid gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Aktueller Review-Stand</p>
                  <p className="font-medium text-slate-900">{reviewContext.currentReviewState}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Aktueller Freigabestand</p>
                  <p className="font-medium text-slate-900">{reviewContext.approvalState}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Privilegierter Schritt</p>
                  <p className="font-medium text-slate-900">{reviewContext.privilegedStepRecorded ? "Im Verlauf protokolliert" : "Derzeit nicht protokolliert"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Letzte Review-Aktion</p>
                  <p className="font-medium text-slate-900">
                    {reviewContext.latestReviewAction
                      ? `${reviewContext.latestReviewAction.title} · ${new Date(reviewContext.latestReviewAction.timestamp).toLocaleString("de-DE")}`
                      : "Noch keine Review-Aktion protokolliert"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Letzte Freigabe / Archivierung</p>
                  <p className="font-medium text-slate-900">
                    {reviewContext.latestApprovalAction
                      ? `${reviewContext.latestApprovalAction.title} · ${new Date(reviewContext.latestApprovalAction.timestamp).toLocaleString("de-DE")}`
                      : "Noch keine Freigabe- oder Archivierungsaktion protokolliert"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Link href="/workspace/review-queue" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                  Zur Review-Queue
                </Link>
              </div>
            </InfoPanel>

            <InfoPanel title="Technische & organisatorische Metadaten" tone="muted">
              <div className="grid gap-3 text-sm">
                <p>
                  <span className="text-xs uppercase tracking-wide text-slate-500">MIME-Typ:</span>{" "}
                  <span className="font-medium text-slate-900">{document.mimeType ?? "Nicht hinterlegt"}</span>
                </p>
                <p>
                  <span className="text-xs uppercase tracking-wide text-slate-500">Dateiablage:</span>{" "}
                  <span className="font-medium text-slate-900">{document.storageKey ? "Storage-Key tenant-gebunden hinterlegt" : "Keine Dateiablage hinterlegt"}</span>
                </p>
                <p>
                  <span className="text-xs uppercase tracking-wide text-slate-500">Zuletzt verarbeitet:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {document.processedAt ? new Date(document.processedAt).toLocaleString("de-DE") : "Noch keine Verarbeitung durchgeführt"}
                  </span>
                </p>
              </div>
            </InfoPanel>
          </div>
        </section>

        <DocumentReviewPanel
          documentId={document.id}
          notes={notesResult.notes}
          findings={findingsResult.findings}
          reviewSummary={reviewSummary}
          assignableMembers={assignableMembersResult.members}
        />

        <DocumentCommentsPanel documentId={document.id} comments={commentsResult.comments} canWrite />

        <DocumentActivityTimeline activities={activities} />

        <InfoPanel title="Nächste Schritte" tone="muted">
          <div className="flex flex-wrap gap-3">
            <Link href="/workspace/dokumente" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zur Dokumentenliste
            </Link>
            <Link href="/workspace/upload" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Upload öffnen
            </Link>
          </div>
        </InfoPanel>
      </PageShell>
    )
  } catch {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Document Workbench derzeit nicht verfügbar"
          description="Das Dokument konnte aktuell nicht geladen werden. Bitte versuchen Sie es erneut."
        />
      </PageShell>
    )
  }
}
