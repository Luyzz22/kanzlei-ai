import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "KI-Transparenz", description: "KI-Modelle, Prompt Governance, Datenschutz und Human-in-the-Loop bei KanzleiAI." }

export default function KiTransparenzPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🤖</span>
              <span className="text-[12px] font-medium text-gold-700">KI-Transparenz</span>
            </div>
            <h1 className="text-display text-gray-950">Transparente KI-Nutzung</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">KanzleiAI setzt KI verantwortungsvoll ein. Hier dokumentieren wir welche Modelle wir nutzen, wie wir Qualitaet sicherstellen und wie Ihre Daten geschuetzt werden.</p>
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🧠 KI-Modelle</p>
          <h2 className="mt-3 text-display-sm text-gray-950">Multi-Provider-Architektur</h2>
          <p className="mt-3 text-[15px] text-gray-500">Wir setzen auf mehrere KI-Provider fuer Redundanz und bestmoegliche Ergebnisse.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: "🟣", name: "Claude Sonnet 4", provider: "Anthropic", role: "Primaer-Modell", desc: "Vertragsanalyse, Risikobewertung, Datenextraktion. Hoechste Qualitaet fuer juristische Texte.", status: "Aktiv" },
              { emoji: "🟢", name: "GPT-4o", provider: "OpenAI", role: "Fallback-Modell", desc: "Automatischer Fallback bei Claude-Nichtverfuegbarkeit. Gleiche Prompt-Struktur.", status: "Fallback" },
              { emoji: "🔵", name: "Gemini", provider: "Google", role: "Zusatz-Modell", desc: "Schnelle Voranalysen und Textklassifizierung. Kosteneffizient fuer Batch-Verarbeitung.", status: "Optional" },
            ].map((m) => (
              <div key={m.name} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[22px]">{m.emoji}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.status === "Aktiv" ? "bg-emerald-100 text-emerald-700" : m.status === "Fallback" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{m.status}</span>
                </div>
                <h3 className="mt-3 text-[16px] font-semibold text-gray-900">{m.name}</h3>
                <p className="text-[12px] text-gray-400">{m.provider} · {m.role}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚖️ Grundsaetze</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Verantwortungsvolle KI-Nutzung</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { emoji: "🚫", title: "Kein Training mit Ihren Daten", desc: "Kein KI-Provider nutzt Ihre Vertragsdaten zum Training von Modellen. Dies ist vertraglich durch AVVs mit allen Providern abgesichert." },
              { emoji: "👤", title: "Human-in-the-Loop", desc: "KI-Ergebnisse sind Entscheidungshilfen, keine Entscheidungen. Jede Analyse erfordert juristische Pruefung durch qualifiziertes Personal." },
              { emoji: "📋", title: "Prompt Governance", desc: "Alle KI-Prompts sind versioniert und dokumentiert. Aenderungen durchlaufen einen Review-Prozess bevor sie in Produktion gehen." },
              { emoji: "🔍", title: "Nachvollziehbarkeit", desc: "Jede Analyse protokolliert das verwendete Modell, die Prompt-Version und den Zeitstempel. Ergebnisse sind reproduzierbar." },
              { emoji: "🛡️", title: "Verschluesselte Uebermittlung", desc: "Vertragstexte werden via TLS 1.3 an KI-Provider gesendet. Keine Zwischenspeicherung auf Drittservern." },
              { emoji: "📊", title: "Qualitaetssicherung", desc: "Risiko-Scores und Findings werden gegen deutsches Recht validiert. Regelmaessige Qualitaets-Audits der KI-Ergebnisse." },
            ].map((p) => (
              <div key={p.title} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5">
                <span className="text-[22px]">{p.emoji}</span>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">{p.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Flow */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔄 Datenfluss</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Wie Ihre Daten verarbeitet werden</h2>
          <div className="mt-10 space-y-3">
            {[
              { step: "1", emoji: "📤", title: "Upload", desc: "Sie laden einen Vertrag hoch (PDF/TXT). Die Datei wird in der EU gespeichert." },
              { step: "2", emoji: "📝", title: "Textextraktion", desc: "Der Vertragstext wird extrahiert (PDF-Parsing serverseitig in Frankfurt)." },
              { step: "3", emoji: "🧠", title: "KI-Analyse", desc: "Der Text wird via TLS 1.3 an Claude Sonnet 4 gesendet. Das Modell analysiert Risiken und extrahiert Daten." },
              { step: "4", emoji: "📊", title: "Ergebnis", desc: "Die strukturierte Analyse wird mandantengetrennt in der EU-Datenbank gespeichert." },
              { step: "5", emoji: "📋", title: "Audit", desc: "Zeitstempel, Modell-Version und Ergebnis-Hash werden im Audit-Trail protokolliert." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[13px] font-bold text-gold-700">{s.step}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{s.emoji}</span>
                    <h3 className="text-[14px] font-semibold text-gray-900">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-[13px] text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-display-sm text-gray-950">Fragen zur KI-Nutzung?</h2>
          <p className="mt-4 text-[16px] text-gray-500">Wir beantworten gerne alle Fragen zu unserer KI-Architektur und Datenschutzpraktiken.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Gespraech vereinbaren</Link>
            <Link href="/trust-center" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Trust Center</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
