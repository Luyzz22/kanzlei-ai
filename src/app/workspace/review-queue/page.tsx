import Link from "next/link"

import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import {
  reviewFilteroptionen,
  reviewQueueDaten,
  type ReviewPrioritaet,
  type ReviewStatus
} from "@/config/workspace-review-queue"

const prioritaetTone: Record<ReviewPrioritaet, "risk" | "warning" | "neutral"> = {
  Hoch: "risk",
  Mittel: "warning",
  Niedrig: "neutral"
}

const statusTone: Record<ReviewStatus, "neutral" | "warning" | "info" | "success" | "risk"> = {
  Offen: "neutral",
  "In Prüfung": "info",
  "Rückfrage erforderlich": "warning",
  Freigabereif: "success",
  "Eskalation empfohlen": "risk"
}

export default function WorkspaceReviewQueuePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Workspace · Review Queue"
        title="Priorisierte Prüf- und Freigabeübersicht"
        description="Die Review Queue bündelt offene juristische Prüfungen und Freigabeschritte in nachvollziehbarer Reihenfolge. Fokus liegt auf Mandantenbezug, Zuständigkeit und Fristenklarheit für revisionssichere Entscheidungen."
      />

      <InfoPanel title="Filter und Arbeitskontext" tone="muted">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-sm font-medium text-slate-800">Suche (Vorbereitung)</span>
            <input
              type="search"
              readOnly
              placeholder="Vorgang, Dokument-ID oder Organisation"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none"
              aria-label="Suche in der Review Queue"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Status</span>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue="Alle Status" aria-label="Filter Status">
              {reviewFilteroptionen.status.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Priorität</span>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue="Alle Prioritäten" aria-label="Filter Priorität">
              {reviewFilteroptionen.prioritaet.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Zuständigkeit</span>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              defaultValue="Alle Zuständigkeiten"
              aria-label="Filter Zuständigkeit"
            >
              {reviewFilteroptionen.zustaendigkeit.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 max-w-sm">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Mandant / Organisation</span>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue="Alle Organisationen" aria-label="Filter Mandant oder Organisation">
              {reviewFilteroptionen.organisation.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </InfoPanel>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Vorgang / Aufgabe</th>
                <th className="px-4 py-3 font-semibold">Bezugsdokument</th>
                <th className="px-4 py-3 font-semibold">Organisation / Mandant</th>
                <th className="px-4 py-3 font-semibold">Priorität</th>
                <th className="px-4 py-3 font-semibold">Zuständig</th>
                <th className="px-4 py-3 font-semibold">Fälligkeitsdatum</th>
                <th className="px-4 py-3 font-semibold">Entscheidungsstatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reviewQueueDaten.map((eintrag) => (
                <tr key={eintrag.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{eintrag.vorgang}</p>
                    <p className="text-xs text-slate-500">{eintrag.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {eintrag.bezugsdokumentId ? (
                      <Link
                        href={`/workspace/dokumente/${eintrag.bezugsdokumentId}`}
                        className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                      >
                        {eintrag.bezugsdokument}
                      </Link>
                    ) : (
                      eintrag.bezugsdokument
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{eintrag.organisation}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={eintrag.prioritaet} tone={prioritaetTone[eintrag.prioritaet]} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{eintrag.zustaendig}</td>
                  <td className="px-4 py-3 text-slate-600">{eintrag.faelligkeit}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={eintrag.entscheidungsstatus} tone={statusTone[eintrag.entscheidungsstatus]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <InfoPanel title="Roadmap-Hinweis" tone="accent">
        <ul className="list-disc space-y-1 pl-5">
          <li>Freigabehandlungen, Kommentare und Eskalationsschritte folgen in einem späteren Ausbau.</li>
          <li>Die aktuelle Seite stellt bewusst nur eine read-only Sicht auf die Review-Pipeline bereit.</li>
          <li>Mutationen und Entscheidungen werden erst mit tenant-gebundener Workflow-Logik aktiviert.</li>
        </ul>
      </InfoPanel>
    </main>
  )
}
