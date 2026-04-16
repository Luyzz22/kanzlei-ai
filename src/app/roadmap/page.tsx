import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Roadmap — KanzleiAI",
  description: "KanzleiAI Produkt-Roadmap von v1.0 bis v3.0 — phasenbasierter Ausbau zur fuehrenden DACH Legal Intelligence Plattform."
}
export const revalidate = 3600

export default function RoadmapPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📍 Produkt-Roadmap</p>
            <h1 className="mt-3 text-display text-gray-950">Von Vertragsanalyse zur Legal Intelligence Plattform</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-gray-500">
              KanzleiAI entwickelt sich in drei Phasen. Jede Phase baut auf der vorherigen auf und erschliesst neue Enterprise-Anwendungsfelder.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* v1.0 Foundation */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">VERFUEGBAR</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">v1.0 — v2.1</span>
              </div>
              <h2 className="mt-3 text-[20px] font-semibold text-gray-950">Foundation</h2>
              <p className="mt-1 text-[13px] text-gray-500">Bilingual KI-Vertragsanalyse mit Enterprise-Compliance</p>
              <div className="mt-6 space-y-2">
                {[
                  "Bilinguale Analyse (DE/EN, 16 Vertragstypen)",
                  "Multi-Provider KI (Claude, GPT-4o, Gemini)",
                  "AGB-Vergleich & Lieferanten-Benchmarking",
                  "Vertragsradar — Regulatorischer Compliance-Monitor",
                  "Verhandlungssimulator (BETA)",
                  "Microsoft Dynamics 365 Integration",
                  "SCIM v2 Provisioning",
                  "Audit-Log mit Hash-Verkettung",
                  "Mandantentrennung (Row-Level Security)",
                  "DSGVO + EU AI Act Limited Risk konform"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">✓</span>
                    <span className="text-[13px] text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* v2.5 Intelligence */}
            <div className="rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white">IN ENTWICKLUNG</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">v2.5 — Q3 2026</span>
              </div>
              <h2 className="mt-3 text-[20px] font-semibold text-gray-950">Intelligence Tier</h2>
              <p className="mt-1 text-[13px] text-gray-500">Type-Aware UX und Multi-Dimensionales Risiko</p>
              <div className="mt-6 space-y-2">
                {[
                  { item: "Contract-Type-Aware Data Model", desc: "NDA/SaaS/AVV — adaptive Felder" },
                  { item: "Multi-Dimensionales Risiko", desc: "Legal/Financial/Operational/Compliance" },
                  { item: "Signature-Blocker Flagging", desc: "Hartes Ja/Nein-Signal fuer Entscheider" },
                  { item: "Strukturelles vs. Substantielles Matching", desc: "Form vs. Inhalt getrennt bewertet" },
                  { item: "Markt-Standard-Klausel-Pruefung", desc: "Was fehlt im Vertrag?" },
                  { item: "Copy-Paste Ersatzklauseln", desc: "Fallback-Templates pro Klauseltyp" },
                  { item: "EUR-Lex Live-Feed", desc: "Echtzeit Regulatorik-Updates" },
                  { item: "Custom Playbook-Editor", desc: "Eigene Standards definieren" }
                ].map((item) => (
                  <div key={item.item} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">→</span>
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">{item.item}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* v3.0 Agentic */}
            <div className="rounded-2xl border-2 border-blue-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">GEPLANT</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">v3.0 — Q1 2027</span>
              </div>
              <h2 className="mt-3 text-[20px] font-semibold text-gray-950">Agentic Tier</h2>
              <p className="mt-1 text-[13px] text-gray-500">Autonome Vertragsorchestrierung im Enterprise</p>
              <div className="mt-6 space-y-2">
                {[
                  { item: "Multi-Agent Orchestrierung", desc: "Spezialisierte Agenten arbeiten zusammen" },
                  { item: "Autonome Vertragsentwurfs-Agent", desc: "Erste Drafts auf Basis Playbook" },
                  { item: "Negotiation Round Agent", desc: "Erste Verhandlungsrunden autonom" },
                  { item: "Cross-Contract Intelligence", desc: "Portfolio-weite Muster-Erkennung" },
                  { item: "Self-Learning Playbooks", desc: "Verbessern sich aus Verhandlungshistorie" },
                  { item: "Predictive Risk Analytics", desc: "Risiko-Vorhersage vor Unterzeichnung" },
                  { item: "PEPPOL E-Invoice Integration", desc: "Volle B2B-E-Rechnungs-Anbindung" },
                  { item: "ISO 27001 / ISO 42001 zertifiziert", desc: "Hoechste Enterprise-Standards" }
                ].map((item) => (
                  <div key={item.item} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">◐</span>
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">{item.item}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strategic Pillars */}
          <div className="mt-20">
            <h2 className="text-center text-[24px] font-semibold tracking-tight text-gray-950">Strategische Saeulen</h2>
            <p className="mt-2 text-center text-[14px] text-gray-500">Was bleibt konstant ueber alle Versionen</p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { emoji: "🇩🇪", title: "DACH-First", desc: "Deutsches Recht, deutsche Sprache, EU-Hosting — keine US-Centric-Tools" },
                { emoji: "🛡️", title: "Compliance-Native", desc: "EU AI Act, DSGVO, NIS2, LkSG — eingebaut, nicht aufgesetzt" },
                { emoji: "🤝", title: "Human-in-the-Loop", desc: "KI als Werkzeug, Jurist entscheidet — keine Autonomie ohne Aufsicht" },
                { emoji: "🏢", title: "Enterprise-Grade", desc: "Mandantentrennung, Audit-Trail, SSO, SCIM — von Tag 1" }
              ].map((pillar) => (
                <div key={pillar.title} className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
                  <span className="text-[32px]">{pillar.emoji}</span>
                  <h3 className="mt-3 text-[15px] font-semibold text-gray-950">{pillar.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Future Modules */}
          <div className="mt-20 rounded-3xl border border-gray-200 bg-white p-8 sm:p-12">
            <h2 className="text-[22px] font-semibold tracking-tight text-gray-950">Geplante Module nach v3.0</h2>
            <p className="mt-2 text-[14px] text-gray-500">Was wir nach Q1 2027 angehen — basierend auf Customer-Feedback</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { emoji: "🌐", title: "PEPPOL Integration", desc: "Volle B2B-E-Rechnung-Anbindung fuer EU-weiten Rechnungsverkehr" },
                { emoji: "📊", title: "Vertrags-Performance Analytics", desc: "KPI-Dashboards: Welche Vertraege sind profitabel? Welche Klauseln werden oft verletzt?" },
                { emoji: "🔮", title: "Predictive Compliance", desc: "Vorhersage zukuenftiger Compliance-Risiken aus Vertragsstruktur" },
                { emoji: "🤖", title: "Autonomous Drafting Agent", desc: "Erste Vertragsentwuerfe vollstaendig autonom — Mensch reviewt nur" },
                { emoji: "📚", title: "Knowledge Graph", desc: "Verkettetes Wissen ueber Vertraege, Klauseln, Praezedenzen, Lieferanten" },
                { emoji: "🎓", title: "Continuous Learning", desc: "Plattform lernt aus jedem Review und verbessert ihre Empfehlungen" }
              ].map((m) => (
                <div key={m.title} className="flex gap-3">
                  <span className="text-[24px]">{m.emoji}</span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900">{m.title}</h3>
                    <p className="mt-0.5 text-[13px] text-gray-500">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-[14px] text-gray-500">Welche Features sind fuer Ihr Unternehmen am wichtigsten?</p>
            <Link href="/enterprise-kontakt" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">
              📞 Roadmap-Gespraech vereinbaren
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
