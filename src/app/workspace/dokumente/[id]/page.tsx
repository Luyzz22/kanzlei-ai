import Link from "next/link"

import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import {
  getWorkspaceDokumentDetailById,
  type DokumentStatus,
  type Pruefstatus
} from "@/config/workspace-documents"

type DokumentDetailPageProps = {
  params: {
    id: string
  }
}

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

export default function DokumentDetailPage({ params }: DokumentDetailPageProps) {
  const dokument = getWorkspaceDokumentDetailById(params.id)

  if (!dokument) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="Workspace · Dokumente"
          title="Dokument nicht gefunden"
          description="Das angeforderte Dokument ist in diesem Arbeitsbereich derzeit nicht verfügbar. Bitte prüfen Sie die Dokument-ID oder öffnen Sie die Übersicht erneut."
        />

        <InfoPanel title="Hinweis" tone="muted">
          Falls das Dokument im Fachbereich erwartet wird, stimmen Sie sich bitte mit der zuständigen Kanzleirolle oder der operativen Dokumentenverantwortung ab.
          <div className="mt-4">
            <Link href="/workspace/dokumente" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zurück zur Dokumentenübersicht
            </Link>
          </div>
        </InfoPanel>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionIntro
          eyebrow="Dokumentdetail · Read-only"
          title={dokument.dokument}
          description="Einzelfallansicht für Vertrags- und Dokumentarbeit mit Fokus auf Statusklarheit, Verantwortlichkeiten und prüfbaren Freigabekontext."
        />

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Dokument-ID</p>
            <p className="font-medium text-slate-900">{dokument.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Dokumenttyp</p>
            <p className="font-medium text-slate-900">{dokument.typ}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Organisation / Mandant</p>
            <p className="font-medium text-slate-900">{dokument.organisation}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1">
              <StatusBadge label={dokument.status} tone={statusTone[dokument.status]} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Prüfstatus</p>
            <div className="mt-1">
              <StatusBadge label={dokument.pruefstatus} tone={pruefstatusTone[dokument.pruefstatus]} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <FeatureCard title="Überblick" description={`Titel: ${dokument.dokument}\nTyp: ${dokument.typ}\nVerantwortlich: ${dokument.verantwortlich}\nLetzte Änderung: ${dokument.letzteAenderung}`} meta={`Version ${dokument.version} · Referenz ${dokument.referenz}`} />
        <FeatureCard title="Dokumentkontext" description={`${dokument.gegenstand}\n\n${dokument.kurzbeschreibung}`} meta={dokument.frist ?? "Keine gesonderte Frist hinterlegt"} />
        <FeatureCard title="Verantwortlichkeiten" description={`Organisation/Mandant: ${dokument.organisation}\n\n${dokument.bearbeitungsverantwortung}`} />
        <FeatureCard title="Prüf- und Freigabekontext" description={`${dokument.freigabekontext}\n\nRisikohinweis: ${dokument.risikohinweis}`} />
      </section>

      <InfoPanel title="Nächste Ausbaustufen" tone="accent">
        <ul className="list-disc space-y-2 pl-5">
          <li>Kommentarfähige Fallkommunikation mit Rollen- und Rechtebezug.</li>
          <li>Versionierung mit nachvollziehbarer Änderungsbegründung je Stand.</li>
          <li>Freigabeprozess mit Vier-Augen-Prinzip und Verantwortlichkeitsmatrix.</li>
          <li>Audit-nahe Aktivitätsansicht für revisionsorientierte Nachvollziehbarkeit.</li>
        </ul>
      </InfoPanel>

      <CtaPanel
        title="Arbeitskontext"
        description="Die aktuelle Detailseite bleibt bewusst read-only. Für weitere Dokumente können Sie zur Übersicht zurückkehren oder den Trust-Kontext für Governance-Nachweise öffnen."
        primaryLabel="Zur Dokumentenliste"
        primaryHref="/workspace/dokumente"
        secondaryLabel="Trust Center"
        secondaryHref="/trust-center"
      />
    </main>
  )
}
