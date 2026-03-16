import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { dokumentquellen, intakeMetadatenFelder, verarbeitungsoptionen } from "@/config/workspace-upload"

const quellenTone = {
  Verfügbar: "success",
  Vorbereitet: "warning",
  Geplant: "info"
} as const

const optionenTone = {
  Aktiv: "success",
  Vorbereitet: "warning"
} as const

export default function WorkspaceUploadPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Workspace · Intake"
        title="Dokumenten-Intake für mandatssichere Vorgangserfassung"
        description="Der Intake-Bereich strukturiert neue Vertrags- und Dokumentenvorgänge vor der fachlichen Prüfung. Er schafft eine klare Zuordnung zu Organisation und Mandat und bereitet die nachgelagerte Verarbeitung in Review- und Governance-Pipelines vor."
      />

      <InfoPanel title="Dokumentquelle" tone="muted">
        <div className="grid gap-3 md:grid-cols-2">
          {dokumentquellen.map((quelle) => (
            <article key={quelle.kanal} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{quelle.kanal}</h3>
                <StatusBadge label={quelle.status} tone={quellenTone[quelle.status]} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{quelle.beschreibung}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">Geplante Eingänge werden im Backend-Ausbau tenant-gebunden und revisionssicher aktiviert.</p>
      </InfoPanel>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">Dokumentmetadaten</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Vorbereitete Felder für eine konsistente Intake-Erfassung. In diesem Schritt read-only, ohne Speicherung.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {intakeMetadatenFelder.map((feld) => (
            <label key={feld.label} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">{feld.label}</span>
              <input
                type="text"
                readOnly
                value={feld.wert}
                className="h-10 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700"
                aria-label={feld.label}
              />
              {feld.hinweis ? <span className="text-xs text-slate-500">{feld.hinweis}</span> : null}
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <InfoPanel title="Prüf- und Verarbeitungsoptionen" tone="default">
          <div className="space-y-3">
            {verarbeitungsoptionen.map((option) => (
              <article key={option.titel} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{option.titel}</h3>
                  <StatusBadge label={option.status} tone={optionenTone[option.status]} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{option.beschreibung}</p>
              </article>
            ))}
          </div>
        </InfoPanel>

        <aside className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <h2 className="text-base font-semibold text-slate-900">Dateieingang (Vorbereitung)</h2>
          <p className="mt-2 text-sm text-slate-600">Hier entsteht im Folgeausbau die tenant-sichere Dateiannahme mit Hashing, Virenprüfung und auditierter Übergabe.</p>
          <div className="mt-4 rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-600">
            <p>Keine Dateiannahme in diesem Schritt.</p>
            <p className="mt-1">Keine lokale oder persistente Speicherung.</p>
          </div>
          <button
            type="button"
            disabled
            className="mt-4 inline-flex cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500"
          >
            Upload-Funktion folgt in Folge-PR
          </button>
        </aside>
      </section>

      <InfoPanel title="Hinweis zum aktuellen Implementierungsumfang" tone="accent">
        <ul className="list-disc space-y-1 pl-5">
          <li>In diesem PR wird bewusst keine Dateiübernahme, keine Verarbeitung und keine Speicherung ausgelöst.</li>
          <li>Die Oberfläche zeigt ausschließlich strukturierte Intake-Vorbereitung für den nächsten Ausbauschritt.</li>
          <li>Governance, Tenant-Bindung und Verarbeitungspfade werden im Backend-Ausbau ergänzt.</li>
        </ul>
      </InfoPanel>
    </main>
  )
}
