import Link from "next/link"

import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { hilfeThemen } from "@/config/help-center"

export default function HilfePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Hilfe"
        title="Zentrale Orientierung für Fachbereiche, Administration und Compliance"
        description="Diese Seite bündelt den strukturierten Einstieg in zentrale Produktbereiche. Sie unterstützt Fachnutzer, Admin-Teams sowie Datenschutz- und IT-Verantwortliche bei der schnellen Einordnung typischer Arbeits- und Prüfkontexte."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hilfeThemen.map((thema) => (
          <FeatureCard
            key={thema.titel}
            title={thema.titel}
            description={`${thema.beschreibung}\n\n• ${thema.hilfepunkte.join("\n• ")}`}
            meta="Selbsthilfe und Orientierung"
          />
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {hilfeThemen.map((thema) =>
          thema.links?.length ? (
            <article key={`${thema.titel}-links`} className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">{thema.titel} · Relevante Bereiche</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {thema.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          ) : null
        )}
      </section>

      <InfoPanel title="Hinweis zum Ausbaustand" tone="muted">
        <p>
          Erweiterte Produktdokumentation, geführte Hilfepfade und rollenbasierte Kontextführung werden in späteren Ausbaustufen ergänzt. Aktuell dient diese Seite als zentraler,
          belastbarer Einstieg in bestehende Bereiche.
        </p>
      </InfoPanel>
    </main>
  )
}
