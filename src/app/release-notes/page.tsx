import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"

type ReleaseKategorie = "Neu" | "Verbesserung" | "Governance" | "Workspace" | "Public / Trust" | "Admin" | "Betrieb / Transparenz"

type ReleaseEintrag = {
  datum: string
  titel: string
  beschreibung: string
  bereiche: string[]
  kategorie: ReleaseKategorie
  einordnung: string
}

const releaseEintraege: ReleaseEintrag[] = [
  {
    datum: "2026-03",
    titel: "Public Sales- und Lösungsstruktur ergänzt",
    beschreibung:
      "Die öffentlichen Einstiegsseiten für Produkt, Zielgruppen, Preise, Integrationen und Enterprise-Kontakt wurden als beschaffungsorientierter Rahmen ergänzt.",
    bereiche: ["/produkt", "/loesungen/kanzleien", "/loesungen/rechtsabteilungen", "/preise", "/integrationen", "/enterprise-kontakt"],
    kategorie: "Public / Trust",
    einordnung: "Ausbaustand für Enterprise-Kommunikation und Procurement-Einordnung."
  },
  {
    datum: "2026-03",
    titel: "Trust- und Compliance-Bereich strukturiert ausgebaut",
    beschreibung:
      "Trust Center sowie Sicherheits- und Compliance-Bereiche wurden als nachvollziehbare Referenz für Governance- und Nachweiskontexte bereitgestellt.",
    bereiche: ["/trust-center", "/sicherheit-compliance", "/datenschutz", "/avv", "/ki-transparenz"],
    kategorie: "Governance",
    einordnung: "Relevanter Rahmen für Sicherheits- und Prüfkommunikation."
  },
  {
    datum: "2026-03",
    titel: "Dokumenten-Workspace mit Intake- und Review-Pfaden verfügbar",
    beschreibung:
      "Arbeitsbereiche für Dokumentenliste, Dokumentendetail, Upload und Review Queue sind im Produktkontext sichtbar und strukturiert nutzbar.",
    bereiche: ["/workspace/dokumente", "/workspace/dokumente/[id]", "/workspace/upload", "/workspace/review-queue"],
    kategorie: "Workspace",
    einordnung: "Produktionsnahe Grundlage für dokumentenbezogene Bearbeitungsabläufe."
  },
  {
    datum: "2026-03",
    titel: "Admin- und Audit-Flächen für Governance-Aufgaben ergänzt",
    beschreibung:
      "Administrative Oberflächen für Mitgliederverwaltung und Audit-nahe Einordnung wurden zur besseren Governance-Transparenz ergänzt.",
    bereiche: ["/dashboard/admin", "/dashboard/admin/members", "/dashboard/audit"],
    kategorie: "Admin",
    einordnung: "Rollen- und Kontrollbezug für interne Steuerung."
  },
  {
    datum: "2026-03",
    titel: "Betriebsnahe Orientierung über Hilfe, Support und Systemstatus",
    beschreibung:
      "Hilfeseite, Support-Kontext und systemnahe Statusdarstellung wurden als operative Orientierung für Nutzer- und Betriebsteams ausgebaut.",
    bereiche: ["/hilfe", "/support", "/systemstatus"],
    kategorie: "Betrieb / Transparenz",
    einordnung: "Unterstützt laufende Kommunikation ohne Marketing-Überhöhung."
  }
]

function kategorieBadgeTone(kategorie: ReleaseKategorie) {
  switch (kategorie) {
    case "Neu":
      return "success" as const
    case "Verbesserung":
      return "info" as const
    case "Governance":
      return "warning" as const
    case "Workspace":
      return "info" as const
    case "Public / Trust":
      return "neutral" as const
    case "Admin":
      return "warning" as const
    case "Betrieb / Transparenz":
      return "neutral" as const
  }
}

export default function ReleaseNotesPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Release Notes"
        title="Änderungsübersicht für Produktbereiche und Ausbaustände"
        description="Diese Seite dokumentiert produktrelevante Änderungen, neue Bereiche und Ausbaustände in einer ruhigen, betriebsnahen Struktur für Fachnutzer, Administration, Compliance und IT."
      />

      <InfoPanel title="Einordnung der aktuellen Release-Notes-Struktur" tone="muted">
        <p>
          Die Einträge auf dieser Seite sind als initiale, dokumentationsorientierte Änderungsübersicht aufgebaut und leiten sich aus den aktuell sichtbaren Produktbereichen ab. Sie stellen keine historische Vollversionierung dar.
        </p>
      </InfoPanel>

      <section className="space-y-4">
        {releaseEintraege.map((eintrag) => (
          <article key={`${eintrag.datum}-${eintrag.titel}`} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={eintrag.kategorie} tone={kategorieBadgeTone(eintrag.kategorie)} />
              <StatusBadge label={eintrag.datum} tone="neutral" />
            </div>
            <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{eintrag.titel}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{eintrag.beschreibung}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <FeatureCard
                title="Betroffene Bereiche"
                description={eintrag.bereiche.join("\n")}
                meta="Produktbereiche"
                tone="muted"
              />
              <FeatureCard title="Einordnung" description={eintrag.einordnung} meta="Governance- und Betriebskontext" tone="muted" />
            </div>
          </article>
        ))}
      </section>

      <InfoPanel title="Hinweis zum weiteren Ausbau" tone="accent">
        <p>
          Die Release Notes werden schrittweise erweitert. In späteren Ausbaustufen können zusätzliche Angaben zu Auswirkungen, Rollout-Kontext und betroffenen Rollen ergänzt werden.
        </p>
      </InfoPanel>

      <CtaPanel
        title="Fragen zu Änderungen oder Betriebskontext"
        description="Für operative Rückfragen nutzen Sie den Support. Für laufende Systemeinordnung und Trust-relevante Referenzen stehen die entsprechenden Bereiche bereit."
        primaryLabel="Support öffnen"
        primaryHref="/support"
        secondaryLabel="Systemstatus ansehen"
        secondaryHref="/systemstatus"
      />
    </main>
  )
}
