import { dokumentenliste, filterOptionen, type DokumentStatus, type Pruefstatus } from "@/config/workspace-documents"

const statusStyles: Record<DokumentStatus, string> = {
  Entwurf: "border-slate-300 bg-slate-50 text-slate-700",
  "In Prüfung": "border-amber-200 bg-amber-50 text-amber-800",
  Freigegeben: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Archiviert: "border-zinc-300 bg-zinc-50 text-zinc-700"
}

const pruefstatusStyles: Record<Pruefstatus, string> = {
  Ungeprüft: "border-slate-300 bg-slate-50 text-slate-700",
  "Juristisch geprüft": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Freigabe ausstehend": "border-amber-200 bg-amber-50 text-amber-800",
  "Risiko markiert": "border-rose-200 bg-rose-50 text-rose-700"
}

export default function WorkspaceDokumentePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dokumenten-Workspace</h1>
        <p className="max-w-4xl text-sm text-muted-foreground sm:text-base">
          Diese Arbeitsoberfläche bündelt Vertrags- und Dokumentenbestände mandatsspezifisch für die juristische
          Bearbeitung. Suche, Filter und Tabellenstruktur sind für den produktiven Ausbau von Intake, Detailprüfung
          und Freigabeprozess vorbereitet.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-sm font-medium">Suche (Vorbereitung)</span>
            <input
              type="search"
              placeholder="Dokumenttitel, Aktenzeichen oder ID"
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Suche in der Dokumentenliste"
              readOnly
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Dokumenttyp</span>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="Alle Typen" aria-label="Filter Dokumenttyp">
              {filterOptionen.dokumenttyp.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Status</span>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="Alle Status" aria-label="Filter Status">
              {filterOptionen.status.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Prüfstatus</span>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="Alle Prüfstatus" aria-label="Filter Prüfstatus">
              {filterOptionen.pruefstatus.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <label className="flex max-w-sm flex-col gap-2">
            <span className="text-sm font-medium">Mandant / Organisation</span>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="Alle Organisationen" aria-label="Filter Mandant oder Organisation">
              {filterOptionen.organisation.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
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
            <tbody className="divide-y">
              {dokumentenliste.map((eintrag) => (
                <tr key={eintrag.id} className="align-top hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{eintrag.dokument}</p>
                    <p className="text-xs text-muted-foreground">{eintrag.id}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{eintrag.typ}</td>
                  <td className="px-4 py-3 text-muted-foreground">{eintrag.organisation}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[eintrag.status]}`}>
                      {eintrag.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{eintrag.verantwortlich}</td>
                  <td className="px-4 py-3 text-muted-foreground">{eintrag.letzteAenderung}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${pruefstatusStyles[eintrag.pruefstatus]}`}>
                      {eintrag.pruefstatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900 sm:p-5">
        <p className="font-semibold">Hinweis zum Ausbaustand</p>
        <p className="mt-1 leading-relaxed text-blue-950/90">
          Diese Seite stellt bewusst eine read-only Arbeitsgrundlage bereit. Upload/Intake sowie Dokumentendetailansicht
          und Review-Queue werden in den nächsten Ausbaustufen separat umgesetzt, inklusive Tenant-gebundener
          Verarbeitung und Freigabeführung.
        </p>
      </section>
    </main>
  )
}
