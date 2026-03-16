import Link from "next/link"

import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"

export default function KiTransparenzPage() {
  return (
    <PageShell width="narrow">
      <PageHero
        eyebrow="Trust · KI-Transparenz"
        title="KI-Transparenz"
        description="KanzleiAI stellt KI-Funktionen als unterstützendes Werkzeug bereit. Die finale rechtliche Bewertung und Freigabe bleibt Aufgabe qualifizierter Mitarbeitender."
      />

      <section className="grid gap-4">
        <FeatureCard title="Art des KI-Systems" description="Unterstützendes Legal-AI-System für juristische Arbeitsabläufe. Kein autonomes Entscheidungssystem und keine rechtsverbindlichen Entscheidungen ohne menschliche Mitwirkung." />
        <FeatureCard title="Zweck und Funktionsweise" description="Markierung relevanter Klauseln, Hervorhebung potenzieller Risiken und Entwurfshilfen für Arbeitstexte im Prüfkontext." />
        <FeatureCard title="Menschliche Kontrolle" description="Alle KI-Ergebnisse werden geprüft, bewertet und freigegeben. Eine automatische Verwendung in der Mandatsarbeit ohne Freigabe erfolgt nicht." />
      </section>

      <InfoPanel title="Datenverarbeitung und Grenzen" tone="muted">
        Verarbeitet werden bereitgestellte Dokumentinhalte, nutzerbezogene Metadaten und Nutzungsprotokolle zur
        Sicherheit und Nachvollziehbarkeit. KI-Ausgaben können unvollständig oder fehlerhaft sein und dienen als
        Unterstützung, nicht als eigenständige Rechtsberatung.
      </InfoPanel>

      <p className="text-sm text-slate-600">
        Informationen zum Datenschutzkontakt finden Sie in unserer{" "}
        <Link href="/datenschutz" className="font-medium text-slate-900 underline underline-offset-4">
          Datenschutzerklärung
        </Link>
        .
      </p>
    </PageShell>
  )
}
