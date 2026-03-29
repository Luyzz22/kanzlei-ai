export default function ReleaseNotesPage() {
  const releases = [
    {
      version: "1.2.0",
      date: "29. März 2026",
      tag: "Aktuell",
      changes: [
        "🤖 Contract Copilot: KI-Chat mit Echtzeit-Streaming (Claude Sonnet 4)",
        "📊 Enterprise Analyse-Display: Risiko-Score, extrahierte Vertragsdaten, Klausel-Zitate",
        "🔗 Vertragskontext-Übernahme: Analyse → Copilot mit vollem Dokumentkontext",
        "🎨 Design-System: Warme Stone-Palette, Gold-Akzente, SBS-Brand-Konsistenz",
      ]
    },
    {
      version: "1.1.0",
      date: "28. März 2026",
      tag: "",
      changes: [
        "⚡ Schnellanalyse: PDF-Upload mit KI-Vertragsanalyse",
        "🔐 JWT Session-Strategie (NextAuth v5 Fix)",
        "👤 Session-aware Header mit User-Avatar und Dropdown",
        "📄 Landing Page mit Hero-Grafik und professionellen Emojis",
      ]
    },
    {
      version: "1.0.0",
      date: "27. März 2026",
      tag: "",
      changes: [
        "🚀 Initialer Launch der KanzleiAI-Plattform",
        "🏗️ Enterprise-Architektur: Multi-Tenant, RBAC, Audit Trail",
        "🤖 Multi-Provider KI: OpenAI, Claude, Gemini",
        "🔒 DSGVO-konforme Datenverarbeitung, EU-Hosting",
      ]
    },
  ]
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Changelog</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Release Notes</h1>
          <div className="mt-10 space-y-8">
            {releases.map((r) => (
              <div key={r.version} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="text-[18px] font-bold text-gray-900">v{r.version}</span>
                  {r.tag && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{r.tag}</span>}
                  <span className="text-[13px] text-gray-400">{r.date}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {r.changes.map((c) => (
                    <li key={c} className="text-[14px] leading-relaxed text-gray-600">{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
