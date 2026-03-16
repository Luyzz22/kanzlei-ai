import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"

const kontrollbereiche = [
  {
    title: "Zugriffskontrolle",
    description: "Rollenbasierte Rechtevergabe mit klarer Verantwortlichkeit und periodischer Überprüfung von Berechtigungen.",
    meta: "Kontrollstatus: aktiv"
  },
  {
    title: "Protokollierung und Nachvollziehbarkeit",
    description: "Sicherheitsrelevante Aktionen werden dokumentiert, um Untersuchungen und interne Freigabeprozesse zu unterstützen.",
    meta: "Kontrollstatus: laufend"
  },
  {
    title: "Lieferanten- und Drittparteikontext",
    description: "Externe Abhängigkeiten werden mit dokumentierten Anforderungen und Risikoeinordnung geführt.",
    meta: "Kontrollstatus: in Review"
  },
  {
    title: "Incident- und Eskalationsabläufe",
    description: "Verbindliche Schritte für Erkennung, Bewertung und Kommunikation von Sicherheitsereignissen.",
    meta: "Kontrollstatus: definiert"
  }
]

export default function SicherheitCompliancePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Sicherheit & Compliance"
        title="Kontrollrahmen für einen verlässlichen Kanzleibetrieb"
        description="Diese Seite strukturiert zentrale Sicherheits- und Compliance-Bausteine für den produktiven Betrieb von KanzleiAI und schafft eine nachvollziehbare Grundlage für interne und externe Prüfkontexte."
      />

      <InfoPanel title="Kontrolllage" tone="muted">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label="Grundkontrollen aktiv" tone="success" />
          <StatusBadge label="Risikobewertungen in Pflege" tone="warning" />
          <StatusBadge label="Nachweisstand konsolidiert" tone="info" />
        </div>
      </InfoPanel>

      <section className="grid gap-4 md:grid-cols-2">
        {kontrollbereiche.map((bereich) => (
          <FeatureCard key={bereich.title} title={bereich.title} description={bereich.description} meta={bereich.meta} />
        ))}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
        <h2 className="text-xl font-semibold tracking-tight">Technischer Einordnungsblock</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">
          Die Plattformarchitektur folgt dem Prinzip kontrollierter Datenflüsse: klarer Verantwortungszuschnitt,
          nachvollziehbare Zugriffspfade und dokumentierte Betriebsmaßnahmen. Dieser Bereich ist bewusst fachlich
          gehalten und dient der technischen Vertrauensbildung für Governance- und Prüfrollen.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200">
          <li>Klare Trennung zwischen operativen Oberflächen und administrativen Kontrollen.</li>
          <li>Nachvollziehbare Ereignisführung für sicherheitsrelevante Betriebsaktionen.</li>
          <li>Standardisierte Richtliniendokumente als Referenz für interne Prüfpfade.</li>
        </ul>
      </section>

      <CtaPanel
        title="Weiterführende Nachweise"
        description="Ergänzende Unterlagen finden Sie im Trust Center sowie in den Datenschutz- und AVV-Seiten für vertragliche und regulatorische Einordnung."
        primaryLabel="Trust Center öffnen"
        primaryHref="/trust-center"
        secondaryLabel="Datenschutz ansehen"
        secondaryHref="/datenschutz"
      />
    </main>
  )
}
