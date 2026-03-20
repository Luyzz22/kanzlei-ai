import Link from "next/link"

import { DocumentActivityTimeline } from "@/components/documents/document-activity-timeline"
import { EmptyState } from "@/components/marketing/empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageShell } from "@/components/marketing/page-shell"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { getDocumentDossierData } from "@/lib/documents/document-dossier-core"
import {
  getDocumentProcessingStatusLabel,
  getDocumentProcessingStatusTone,
  getWorkspaceDocumentStatusLabel,
  getWorkspaceDocumentStatusTone
} from "@/lib/documents/workspace-core"

function formatSize(sizeBytes: number | null): string {
  if (!sizeBytes || sizeBytes <= 0) return "Nicht hinterlegt"
  if (sizeBytes < 1024) return `${sizeBytes} Bytes`

  const kb = sizeBytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`

  return `${(kb / 1024).toFixed(1)} MB`
}

function splitPreviewText(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

type DokumentDossierPageProps = {
  params: {
    id: string
  }
}

export default async function DokumentDossierPage({ params }: DokumentDossierPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dossier"
          title="Dossier nicht verfügbar"
          description="Bitte melden Sie sich an, um den tenant-gebundenen Entscheidungsfall zu öffnen."
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
          eyebrow="Workspace · Dossier"
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
          eyebrow="Workspace · Dossier"
          title="Mandantenkontext nicht eindeutig"
          description="Diese Ansicht erfordert einen eindeutigen Mandantenkontext. Die gesteuerte Auswahl folgt in einem späteren Ausbau."
        />
      </PageShell>
    )
  }

  const dossier = await getDocumentDossierData(tenantContext.tenantId, session.user.id, params.id)

  if (!dossier) {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Dossier"
          title="Dokument nicht gefunden"
          description="Das angeforderte Dossier ist in diesem Arbeitsbereich nicht verfügbar."
        />
        <InfoPanel title="Hinweis" tone="muted">
          Bitte prüfen Sie die Dokument-ID oder öffnen Sie die Dokumentenübersicht erneut.
        </InfoPanel>
      </PageShell>
    )
  }

  const previewParagraphs = dossier.document.extractedTextPreview ? splitPreviewText(dossier.document.extractedTextPreview) : []

  return (
    <PageShell width="wide" className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionIntro
          eyebrow="Decision Dossier · Prüfakt"
          title={dossier.document.title}
          description="Strukturierter Entscheidungsfall mit Nachweisstand, Review-Dokumentation und Governance-Kontext im tenant-gebundenen Read-Model."
        />

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Dokument-ID</p>
            <p className="font-medium text-slate-900">{dossier.document.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Dokumenttyp</p>
            <p className="font-medium text-slate-900">{dossier.document.documentType}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Organisation / Mandant</p>
            <p className="font-medium text-slate-900">{dossier.document.organizationName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Dokumentstatus</p>
            <div className="mt-1">
              <StatusBadge label={getWorkspaceDocumentStatusLabel(dossier.document.status)} tone={getWorkspaceDocumentStatusTone(dossier.document.status)} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Verarbeitungsstand</p>
            <div className="mt-1">
              <StatusBadge
                label={getDocumentProcessingStatusLabel(dossier.document.processingStatus)}
                tone={getDocumentProcessingStatusTone(dossier.document.processingStatus)}
              />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Entscheidungsreife</p>
            <p className="font-medium text-slate-900">{dossier.reviewReadiness.label}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Review-Verantwortung</p>
            <p className="font-medium text-slate-900">{dossier.document.reviewOwnerLabel ?? "Nicht zugewiesen"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Fälligkeit</p>
            <p className="font-medium text-slate-900">{dossier.document.reviewDueAt ? new Date(dossier.document.reviewDueAt).toLocaleDateString("de-DE") : "Nicht gesetzt"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Letzte relevante Bearbeitung</p>
            <p className="font-medium text-slate-900">{new Date(dossier.document.updatedReferenceAt).toLocaleString("de-DE")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Nachweisstand</p>
            <div className="mt-1">
              <StatusBadge label={dossier.evidenceSummary.caseStatusLabel} tone={dossier.evidenceSummary.caseStatus === "NACHWEIS_VORBEREITET" ? "success" : "info"} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <InfoPanel title="Entscheidungszusammenfassung" tone="default">
          <p className="text-sm font-medium text-slate-900">{dossier.decisionSummary.headline}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {dossier.decisionSummary.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>

          {dossier.decisionSummary.missingElements.length ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Offene Punkte</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {dossier.decisionSummary.missingElements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-4 text-sm text-slate-700">{dossier.decisionSummary.recommendation}</p>
        </InfoPanel>

        <InfoPanel title="Export- / Paketbereitschaft" tone="muted">
          <p className="text-sm text-slate-700">{dossier.evidenceSummary.exportReadinessHint}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
            Nachweisbausteine: {dossier.evidenceSummary.completedCount}/{dossier.evidenceSummary.totalCount}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/admin/policies" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              Richtlinienregister
            </Link>
            <Link href="/dashboard/audit" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              Audit-Protokoll
            </Link>
          </div>
        </InfoPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <InfoPanel title="Dokument- und Kontextbasis" tone="default">
          <p className="text-sm text-slate-700">{dossier.document.description ?? "Für dieses Dokument liegt keine ergänzende Kontextbeschreibung vor."}</p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateiname</p>
              <p className="font-medium text-slate-900">{dossier.document.filename}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateigröße</p>
              <p className="font-medium text-slate-900">{formatSize(dossier.document.sizeBytes)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">MIME-Typ</p>
              <p className="font-medium text-slate-900">{dossier.document.mimeType ?? "Nicht hinterlegt"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Extrahiert am</p>
              <p className="font-medium text-slate-900">
                {dossier.document.textExtractedAt ? new Date(dossier.document.textExtractedAt).toLocaleString("de-DE") : "Noch keine Extraktion durchgeführt"}
              </p>
            </div>
          </div>

          {previewParagraphs.length ? (
            <div className="mt-4 max-h-[440px] space-y-3 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
              {previewParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 20)}`} className="text-sm leading-relaxed text-slate-800">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Keine nutzbare Textgrundlage verfügbar"
                description="Für dieses Dokument liegt derzeit noch keine nutzbare Textgrundlage vor."
              />
            </div>
          )}
        </InfoPanel>

        <InfoPanel title="Erkannte Referenzen" tone="muted">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Parteien</p>
              {dossier.references.parties.length ? <ul className="mt-1 list-disc pl-4 text-slate-700">{dossier.references.parties.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-1 text-slate-600">Keine belastbaren Parteienangaben erkannt.</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Referenzen / Nummern</p>
              {dossier.references.documentReferences.length ? <ul className="mt-1 list-disc pl-4 text-slate-700">{dossier.references.documentReferences.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-1 text-slate-600">Keine eindeutigen Referenzen erkannt.</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Datumsangaben</p>
              {dossier.references.dates.length ? <ul className="mt-1 list-disc pl-4 text-slate-700">{dossier.references.dates.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-1 text-slate-600">Keine belastbaren Datumsangaben erkannt.</p>}
            </div>
          </div>
        </InfoPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <InfoPanel title="Review-Notizen" tone="default">
          {dossier.notes.length ? (
            <ul className="space-y-3">
              {dossier.notes.map((note) => (
                <li key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{note.title ?? "Review-Notiz"}</p>
                  <p className="mt-1 text-sm text-slate-700">{note.body}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {note.authorLabel} · {new Date(note.createdAt).toLocaleString("de-DE")} · {note.sectionKey ?? "Allgemeiner Abschnitt"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">Für dieses Dokument liegen derzeit keine Review-Notizen vor.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Findings / Prüfhinweise" tone="default">
          {dossier.findings.length ? (
            <ul className="space-y-3">
              {dossier.findings.map((finding) => (
                <li key={finding.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={finding.severity} tone={finding.severity === "HOCH" ? "risk" : finding.severity === "MITTEL" ? "warning" : "neutral"} />
                    <StatusBadge label={finding.status} tone={finding.status === "OFFEN" ? "warning" : "success"} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{finding.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{finding.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Erstellt durch {finding.createdByLabel} · {new Date(finding.createdAt).toLocaleString("de-DE")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">Es wurden aktuell keine offenen Prüfhinweise erfasst.</p>
          )}
        </InfoPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <InfoPanel title="Freigabevermerk / Decision Memo" tone="muted">
          {dossier.decisionMemo ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{dossier.decisionMemo.title ?? "Freigabevermerk"}</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{dossier.decisionMemo.body}</p>
              <p className="mt-3 text-xs text-slate-500">
                {dossier.decisionMemo.authorLabel} · {new Date(dossier.decisionMemo.createdAt).toLocaleString("de-DE")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Für dieses Dokument liegt derzeit noch kein Freigabevermerk vor.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Evidence- / Nachweisübersicht" tone="muted">
          <ul className="space-y-2">
            {dossier.evidenceSummary.items.map((item) => (
              <li key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <StatusBadge label={item.available ? "Vorhanden" : "Offen"} tone={item.available ? "success" : "warning"} />
                </div>
                <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
              </li>
            ))}
          </ul>
        </InfoPanel>
      </section>

      <InfoPanel title="Richtlinien- und Governance-Bezug" tone="muted">
        {dossier.policyContext.relevantCategories.length ? (
          <div className="space-y-3">
            {dossier.policyContext.relevantCategories.map((category) => (
              <article key={category.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{category.title}</p>
                  <StatusBadge label={category.maturityLabel} tone={category.maturity === "verfuegbar" ? "success" : category.maturity === "in_vorbereitung" ? "warning" : "info"} />
                </div>
                <p className="mt-1 text-sm text-slate-700">{category.relevanceReason}</p>
                <p className="mt-1 text-xs text-slate-500">Verantwortungsbereich: {category.owner}</p>
              </article>
            ))}
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {dossier.policyContext.governanceSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Für diesen Fall konnte kein eindeutiger Governance-Kontext abgeleitet werden.</p>
        )}
      </InfoPanel>

      <DocumentActivityTimeline activities={dossier.activities} />

      <InfoPanel title="Nächste Schritte" tone="muted">
        <div className="flex flex-wrap gap-3">
          <Link href={`/workspace/dokumente/${dossier.document.id}`} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
            Zur Dokumentansicht
          </Link>
          <Link href="/workspace/review-queue" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
            Zur Review-Queue
          </Link>
        </div>
      </InfoPanel>
    </PageShell>
  )
}
