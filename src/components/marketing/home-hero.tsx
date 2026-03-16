import Link from "next/link"

import { HomeHeroSlides } from "@/components/marketing/home-hero-slides"
import { PageHero } from "@/components/marketing/page-hero"

export function HomeHero() {
  return (
    <PageHero
      eyebrow="KanzleiAI Plattform"
      title="Strukturierte KI-Unterstützung für Dokumente, Review und Nachweise"
      description="KanzleiAI unterstützt juristische Teams bei der Prüfung von Verträgen und Dokumenten mit nachvollziehbaren Hinweisen, klaren Freigaben und transparentem Governance-Kontext."
    >
      <div className="space-y-4">
        <HomeHeroSlides />
        <div className="flex flex-wrap gap-3">
          <Link href="/produkt" className="inline-flex rounded-md border border-white bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100">
            Produkt ansehen
          </Link>
          <Link href="/enterprise-kontakt" className="inline-flex rounded-md border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800">
            Enterprise-Kontakt
          </Link>
        </div>
      </div>
    </PageHero>
  )
}
