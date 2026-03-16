import Link from "next/link"

import { HomeHeroSlides } from "@/components/marketing/home-hero-slides"

export function HomeHero() {
  return (
    <section className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">KanzleiAI Plattform</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Strukturierte KI-Unterstützung für Dokumente, Review und Nachweise.
        </h1>
        <p className="text-base leading-relaxed text-slate-600">
          KanzleiAI unterstützt juristische Teams bei der Prüfung von Verträgen und Dokumenten mit nachvollziehbaren
          Hinweisen, klaren Freigaben und transparentem Governance-Kontext.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/produkt" className="inline-flex rounded-md border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            Produkt ansehen
          </Link>
          <Link href="/enterprise-kontakt" className="inline-flex rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Enterprise-Kontakt
          </Link>
        </div>
      </div>
      <HomeHeroSlides />
    </section>
  )
}
