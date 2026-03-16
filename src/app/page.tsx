import Link from "next/link"

import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { HomeHero } from "@/components/marketing/home-hero"
import { ProcessFlow } from "@/components/marketing/process-flow"
import { SectionIntro } from "@/components/marketing/section-intro"

const trustHighlights = [
  {
    title: "Dokumente & Verträge",
    description: "Arbeitsstände, Versionen und Prüfhistorien bleiben in einer konsistenten Oberfläche nachvollziehbar."
  },
  {
    title: "Governance & Nachweise",
    description: "Freigaben, Entscheidungen und Prüfschritte können als Nachweis strukturiert dokumentiert werden."
  },
  {
    title: "Rollen & Mandantenkontext",
    description: "Arbeitsbereiche folgen klaren Zuständigkeiten, Rollen und getrennten Kontexten pro Organisation."
  },
  {
    title: "Trust & Transparenz",
    description: "Öffentliche Informationen zu Sicherheit, Betrieb und Transparenz sind direkt über das Trust Center erreichbar."
  }
]

const modules = [
  {
    title: "Dokumenten-Workspace",
    description: "Zentrale Übersicht für Dokumente, Verträge und Vorgänge mit klaren Statusfeldern.",
    meta: "Arbeitsbereich"
  },
  {
    title: "Prüfung & Review",
    description: "KI-gestützte Hinweise werden im juristischen Prüfkontext dargestellt und für den Review eingeordnet.",
    meta: "Prüfkontext"
  },
  {
    title: "Audit & Nachweise",
    description: "Entscheidungen, Freigaben und Änderungen lassen sich für Audit- und Governance-Anforderungen aufbereiten.",
    meta: "Nachvollziehbarkeit"
  },
  {
    title: "Administration & Rollen",
    description: "Rollen, Teams und Zugriffe orientieren sich an organisatorischen Zuständigkeiten und Prozessen.",
    meta: "Organisation"
  },
  {
    title: "Trust & Compliance",
    description: "Trust Center, Sicherheits- und Transparenzseiten unterstützen Abstimmungen mit IT, Datenschutz und Einkauf.",
    meta: "Beschaffung"
  }
]

const processSteps = [
  { title: "Eingang / Intake", description: "Dokumente werden einem Arbeitskontext mit Zuständigkeiten und Status zugeordnet." },
  { title: "Prüfung / Analyse", description: "Relevante Prüfhinweise werden strukturiert gesammelt und priorisiert." },
  { title: "Review / Freigabe", description: "Juristische und fachliche Verantwortliche prüfen und entscheiden entlang definierter Schritte." },
  { title: "Nachweise / Transparenz", description: "Freigabehistorie und Kontextinformationen werden für Audits und interne Abstimmungen bereitgestellt." }
]

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6 lg:px-8">
      <HomeHero />

      <section className="space-y-5">
        <SectionIntro
          eyebrow="Einordnung"
          title="Für juristische Arbeitsabläufe mit Review- und Governance-Anforderungen"
          description="KanzleiAI verbindet Dokumentenarbeit, Prüfhilfen und Nachweise in einer ruhigen, produktnahen Oberfläche."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustHighlights.map((highlight) => (
            <FeatureCard key={highlight.title} title={highlight.title} description={highlight.description} tone="muted" />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionIntro
          eyebrow="Produktbereiche"
          title="Kernmodule für Dokumente, Prüfung und Governance"
          description="Die Plattform ist in klare Funktionsbereiche gegliedert, damit Teams strukturiert zusammenarbeiten können."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <FeatureCard key={module.title} title={module.title} description={module.description} meta={module.meta} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionIntro
          eyebrow="Prozess"
          title="Von Intake bis Nachweis in vier klaren Schritten"
          description="Die Prozessdarstellung unterstützt eine konsistente Zusammenarbeit zwischen Fachbereich, Recht und Compliance."
        />
        <ProcessFlow steps={processSteps} />
      </section>

      <section className="space-y-5">
        <SectionIntro
          eyebrow="Zielgruppen"
          title="Für Kanzleien, Rechtsabteilungen und Compliance-Teams"
          description="KanzleiAI ordnet Aufgaben entlang der jeweiligen Verantwortung im Arbeitsprozess."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Kanzleien"
            description="Unterstützung bei Vertragsprüfung, Mandatskontext und strukturierter Abstimmung im Team."
            tone="muted"
          />
          <FeatureCard
            title="Rechtsabteilungen"
            description="Einheitliche Review-Abläufe mit klaren Freigabeschritten und nachvollziehbaren Entscheidungspfaden."
            tone="muted"
          />
          <FeatureCard
            title="Compliance, Datenschutz & Einkauf"
            description="Zugriff auf Trust-Informationen, Nachweise und Betriebsinformationen für interne Prüfungen."
            tone="muted"
          />
        </div>
      </section>

      <section className="space-y-5">
        <SectionIntro
          eyebrow="Trust & Beschaffung"
          title="Relevante Informationen für IT, Compliance und Beschaffung"
          description="Öffentliche Trust- und Betriebsseiten schaffen eine klare Orientierung für technische und regulatorische Rückfragen."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard
            title="Trust Center & Sicherheit"
            description="Sicherheits- und Transparenzinformationen für die Bewertung im Beschaffungsprozess."
            meta="Trust Center · Sicherheit & Compliance"
          />
          <FeatureCard
            title="Betrieb & Unterstützung"
            description="Systemstatus, Support und Release Notes für einen transparenten operativen Überblick."
            meta="Support · Systemstatus · Release Notes"
          />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/trust-center" className="text-slate-700 underline underline-offset-4 hover:text-slate-950">
            Trust Center öffnen
          </Link>
          <Link href="/sicherheit-compliance" className="text-slate-700 underline underline-offset-4 hover:text-slate-950">
            Sicherheit & Compliance
          </Link>
          <Link href="/integrationen" className="text-slate-700 underline underline-offset-4 hover:text-slate-950">
            Integrationen ansehen
          </Link>
        </div>
      </section>

      <CtaPanel
        title="Nächster Schritt"
        description="Sprechen Sie mit uns über Ihren organisatorischen Kontext, vorhandene Prozesse und gewünschte Einführungsschritte."
        primaryLabel="Enterprise-Kontakt"
        primaryHref="/enterprise-kontakt"
        secondaryLabel="Produkt ansehen"
        secondaryHref="/produkt"
      />
    </main>
  )
}
