import Link from "next/link"

import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { type DocumentEvidencePackageData } from "@/lib/documents/document-evidence-package-core"
import {
  getDocumentProcessingStatusLabel,
  getDocumentProcessingStatusTone,
  getWorkspaceDocumentStatusLabel,
  getWorkspaceDocumentStatusTone
} from "@/lib/documents/workspace-core"

type DocumentEvidencePackageViewProps = {
  evidencePackage: DocumentEvidencePackageData
}

function formatDateTime(value: Date | string | null): string {
  if (!value) return "Nicht hinterlegt"
  return new Date(value).toLocaleString("de-DE")
}

function formatDate(value: Date | string | null): string {
  if (!value) return "Nicht gesetzt"
  return new Date(value).toLocaleDateString("de-DE")
}

export function DocumentEvidencePackageView({ evidencePackage }: DocumentEvidencePackageViewProps) {
  const { dossier, readiness, sections, compactActivities } = evidencePackage

  return (
    <article className="evidence-print-root space-y-6">
      <section className="evidence-print-card rounded-xl border border-slate-300 bg-white p-6">
        <SectionIntro
          eyebrow="Nachweispaket · Exportansicht"
          title={dossier.document.title}
          description="Formalisierte, tenant-gebundene Nachweisansicht für interne Freigabe, Legal-Review und Audit-Vorbereitung."
        />

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {evidencePackage.readOnlyNotice}
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
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
            <p className="text-xs uppercase tracking-wide text-slate-500">Paket erstellt am</p>
            <p className="font-medium text-slate-900">{formatDateTime(evidencePackage.generatedAt)}</p>
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
            <p className="text-xs uppercase tracking-wide text-slate-500">Review-Reife</p>
            <p className="font-medium text-slate-900">{dossier.reviewReadiness.label}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Nachweis-Reife</p>
            <div className="mt-1">
              <StatusBadge
                label={readiness.label}
                tone={
                  readiness.state === "NACHWEIS_VORBEREITET"
                    ? "success"
                    : readiness.state === "INTERN_PRUEFFAEHIG"
                      ? "info"
                      : readiness.state === "IN_BEARBEITUNG"
                        ? "warning"
                        : "risk"
                }
              />
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
          {!!dossier.decisionSummary.missingElements.length && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Offene Punkte</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {dossier.decisionSummary.missingElements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-sm text-slate-700">{dossier.decisionSummary.recommendation}</p>
        </InfoPanel>

        <InfoPanel title="Vollständigkeit und Readiness" tone="muted">
          <p className="text-sm text-slate-700">{readiness.hint}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            Nachweisbausteine vorhanden: {sections.filter((section) => section.available).length}/{sections.length}
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">Vorhanden</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                {readiness.presentItems.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-900">Fehlend / zu klären</p>
              {readiness.missingItems.length ? (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                  {readiness.missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-slate-700">Keine offenen Vollständigkeitslücken erkannt.</p>
              )}
            </div>
          </div>
        </InfoPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <InfoPanel title="Dokument- und Kontextbasis" tone="default">
          <p className="text-sm text-slate-700">{dossier.document.description ?? "Für dieses Dokument liegt keine ergänzende Kontextbeschreibung vor."}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dateiname</p>
              <p className="font-medium text-slate-900">{dossier.document.filename}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">MIME-Typ</p>
              <p className="font-medium text-slate-900">{dossier.document.mimeType ?? "Nicht hinterlegt"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Erfasst am</p>
              <p className="font-medium text-slate-900">{formatDateTime(dossier.document.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Text extrahiert am</p>
              <p className="font-medium text-slate-900">{formatDateTime(dossier.document.textExtractedAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Review-Verantwortung</p>
              <p className="font-medium text-slate-900">{dossier.document.reviewOwnerLabel ?? "Nicht zugewiesen"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Fälligkeit</p>
              <p className="font-medium text-slate-900">{formatDate(dossier.document.reviewDueAt)}</p>
            </div>
          </div>
        </InfoPanel>

        <InfoPanel title="Review- und Entscheidungsstand" tone="default">
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Offene Findings: <span className="font-medium text-slate-900">{dossier.reviewReadiness.openFindingsCount}</span>
            </p>
            <p>
              Geschlossene Findings: <span className="font-medium text-slate-900">{dossier.reviewReadiness.closedFindingsCount}</span>
            </p>
            <p>
              Review-Notizen: <span className="font-medium text-slate-900">{dossier.notes.length}</span>
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Freigabevermerk</p>
            {dossier.decisionMemo ? (
              <>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{dossier.decisionMemo.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {dossier.decisionMemo.authorLabel} · {formatDateTime(dossier.decisionMemo.createdAt)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-700">Für dieses Dokument liegt noch kein formaler Freigabevermerk vor.</p>
            )}
          </div>
        </InfoPanel>
      </section>

      <InfoPanel title="Nachweisbausteine" tone="muted">
        <div className="grid gap-3 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                <StatusBadge label={section.available ? "Vorhanden" : "Offen"} tone={section.available ? "success" : "warning"} />
              </div>
              <p className="mt-1 text-sm text-slate-700">{section.detail}</p>
            </article>
          ))}
        </div>
      </InfoPanel>

      <InfoPanel title="Governance- und Richtlinienkontext" tone="muted">
        {dossier.policyContext.relevantCategories.length ? (
          <div className="space-y-3">
            {dossier.policyContext.relevantCategories.map((category) => (
              <article key={category.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{category.title}</p>
                  <StatusBadge label={category.maturityLabel} tone={category.maturity === "verfuegbar" ? "success" : "info"} />
                </div>
                <p className="mt-1 text-sm text-slate-700">{category.relevanceReason}</p>
                <p className="mt-1 text-xs text-slate-500">Verantwortungsbereich: {category.owner}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-700">Für diesen Fall konnte kein eindeutiger Governance-Kontext abgeleitet werden.</p>
        )}
      </InfoPanel>

      <InfoPanel title="Aktivitäten und Verlauf (kompakt)" tone="default">
        {compactActivities.length ? (
          <ol className="space-y-2">
            {compactActivities.map((activity) => (
              <li key={activity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-900">{activity.title}</p>
                <p className="text-slate-700">{activity.context}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateTime(activity.timestamp)} · {activity.actorLabel} · {activity.action}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-700">Für dieses Dokument sind aktuell keine weiteren audit-nahen Aktivitäten protokolliert.</p>
        )}
      </InfoPanel>

      <section className="evidence-print-actions rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <p className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Browser-Druck: Strg+P (Windows) oder Cmd+P (macOS)</p>
          <Link href={`/workspace/dokumente/${dossier.document.id}`} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
            Zur Dokumentansicht
          </Link>
          <Link href={`/workspace/dokumente/${dossier.document.id}/dossier`} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
            Zum Dossier
          </Link>
        </div>
      </section>
    </article>
  )
}
