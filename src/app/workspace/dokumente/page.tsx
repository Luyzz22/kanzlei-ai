import Link from "next/link"

import { CtaPanel } from "@/components/marketing/cta-panel"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { dokumentenliste, filterOptionen, type DokumentStatus, type Pruefstatus } from "@/config/workspace-documents"

const statusTone: Record<DokumentStatus, "neutral" | "success" | "warning"> = {
  Entwurf: "neutral",
  "In Prüfung": "warning",
  Freigegeben: "success",
  Archiviert: "neutral"
}

const pruefstatusTone: Record<Pruefstatus, "neutral" | "success" | "warning" | "risk"> = {
  Ungeprüft: "neutral",
  "Juristisch geprüft": "success",
  "Freigabe ausstehend": "warning",
  "Risiko markiert": "risk"
}

export default function WorkspaceDokumentePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Workspace · Dokumente"
        title="Dokumenten-Workspace für Mandats- und Vertragsarbeit"
        description="Die Übersicht bündelt Verträge und Dokumente organisationsbezogen. Fokus liegt auf belastbarer Lesbarkeit von Status, Prüfkontext und Zuständigkeit als Grundlage für nachgelagerte Freigabe- und Governance-Prozesse."
      />

      <InfoPanel title="Filter und Suchkontext" tone="muted">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-sm font-medium text-slate-800">Suche (Vorbereitung)</span>
            <input
              type="search"
              placeholder="Dokumenttitel, Aktenzeichen oder ID"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label="Suche in der Dokumentenliste"
              readOnly
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Dokumenttyp</span>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue="Alle Typen" aria-label="Filter Dokumenttyp">
              {filterOptionen.dokumenttyp.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Status</span>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue="Alle Status" aria-label="Filter Status">
              {filterOptionen.status.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Prüfstatus</span>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue="Alle Prüfstatus" aria-label="Filter Prüfstatus">
              {filterOptionen.pruefstatus.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <label className="flex max-w-sm flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Mandant / Organisation</span>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue="Alle Organisationen" aria-label="Filter Mandant oder Organisation">
              {filterOptionen.organisation.map((option) => (
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
                <th className="px-4 py-3 font-semibold">Dokument</th>
                <th className="px-4 py-3 font-semibold">Typ</th>
                <th className="px-4 py-3 font-semibold">Organisation / Mandant</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Verantwortlich</th>
                <th className="px-4 py-3 font-semibold">Letzte Änderung</th>
                <th className="px-4 py-3 font-semibold">Prüfstatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {dokumentenliste.map((eintrag) => (
                <tr key={eintrag.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <Link
                      href={`/workspace/dokumente/${eintrag.id}`}
                      className="font-medium text-slate-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    >
                      {eintrag.dokument}
                    </Link>
                    <p className="text-xs text-slate-500">{eintrag.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{eintrag.typ}</td>
                  <td className="px-4 py-3 text-slate-600">{eintrag.organisation}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={eintrag.status} tone={statusTone[eintrag.status]} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{eintrag.verantwortlich}</td>
                  <td className="px-4 py-3 text-slate-600">{eintrag.letzteAenderung}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={eintrag.pruefstatus} tone={pruefstatusTone[eintrag.pruefstatus]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CtaPanel
        title="Read-only Ausbauzustand"
        description="Diese Seite bildet aktuell den dokumentenbezogenen Lesekontext ab. Kommentare, aktive Versionierung, Freigabeschritte und Audit-nahe Aktivitätsverläufe werden in dedizierten Folge-PRs ergänzt."
        primaryLabel="Dokumentendetail prüfen"
        primaryHref="/workspace/dokumente/DOC-2026-014"
        secondaryLabel="Trust Center öffnen"
        secondaryHref="/trust-center"
      />
    </main>
  )
}
