import Link from "next/link"
import type { Metadata } from "next"

const vertragstypen = [
  {
    emoji: "💼",
    title: "Arbeitsverträge",
    desc: "Prüfung von Befristung, Probezeit, Kündigungsfristen, Wettbewerbsverboten, Überstundenregelungen und Geheimhaltungsklauseln.",
    risks: ["Unwirksame Befristungsklauseln", "Fehlende Schriftformklausel", "Überlange Wettbewerbsverbote", "Intransparente Vergütungsregelungen"],
    bgb: "§§ 611a, 614, 622, 626 BGB"
  },
  {
    emoji: "🔒",
    title: "NDAs / Geheimhaltungsvereinbarungen",
    desc: "Analyse von Vertraulichkeitsdefinitionen, Laufzeiten, Vertragsstrafen, Ausnahmen und Rückgabepflichten.",
    risks: ["Zu weite Vertraulichkeitsdefinition", "Fehlende Ausnahmen (öffentlich bekannt)", "Unverhältnismäßige Vertragsstrafen", "Unbefristete Laufzeiten"],
    bgb: "§§ 241, 311 BGB"
  },
  {
    emoji: "💻",
    title: "SaaS-Verträge",
    desc: "Bewertung von SLA-Vereinbarungen, Datenschutzklauseln, Verfügbarkeitsgarantien, Exit-Strategien und Haftungsbeschränkungen.",
    risks: ["Fehlende SLA-Definition", "Unklare Datenportabilität", "Automatische Verlängerung ohne Exit", "Haftungsausschluss für Datenverlust"],
    bgb: "§§ 535ff., 631ff. BGB analog"
  },
  {
    emoji: "🤝",
    title: "Dienstleistungsverträge",
    desc: "Prüfung von Leistungsbeschreibungen, Abnahmekriterien, Gewährleistung, Haftung und Kündigungsregelungen.",
    risks: ["Unklare Leistungsbeschreibung", "Fehlende Abnahmekriterien", "Kurze Gewährleistungsfristen", "Unbeschränkte Haftung"],
    bgb: "§§ 611, 631 BGB"
  },
  {
    emoji: "📦",
    title: "Lieferantenverträge",
    desc: "Analyse von Lieferbedingungen, Qualitätsstandards, Gewährleistung, Rücktrittsrechten und Force-Majeure-Klauseln.",
    risks: ["Fehlende Qualitätsstandards", "Unklare Liefertermine", "Keine Force-Majeure-Regelung", "Einseitige Preisanpassungsklauseln"],
    bgb: "§§ 433ff. BGB, HGB"
  },
  {
    emoji: "🏠",
    title: "Mietverträge",
    desc: "Bewertung von Mietdauer, Kündigungsfristen, Nebenkostenregelungen, Renovierungspflichten und Indexklauseln.",
    risks: ["Unwirksame Schönheitsreparaturklauseln", "Fehlerhafte Nebenkostenabrechnung", "Zu kurze Kündigungsfristen", "Fehlende Indexierungsregeln"],
    bgb: "§§ 535ff. BGB"
  },
  {
    emoji: "🛒",
    title: "Kaufverträge",
    desc: "Prüfung von Kaufgegenstand, Gewährleistung, Garantien, Eigentumsvorbehalten und Zahlungsbedingungen.",
    risks: ["Unklarer Kaufgegenstand", "Ausschluss der Sachmängelhaftung", "Fehlender Eigentumsvorbehalt", "Unverhältnismäßige Zahlungsbedingungen"],
    bgb: "§§ 433ff. BGB"
  },
  {
    emoji: "📜",
    title: "Lizenzverträge",
    desc: "Analyse von Nutzungsrechten, Unterlizenzierung, Laufzeiten, Vergütungsmodellen und IP-Rechten.",
    risks: ["Unklarer Lizenzumfang", "Fehlende Unterlizenzierungsrechte", "Übermäßige Nutzungsbeschränkungen", "Automatische IP-Übertragung"],
    bgb: "§§ 31ff. UrhG, § 305ff. BGB"
  },
]

export const metadata: Metadata = { title: "Vertragstypen — 8 spezialisierte Analysen", description: "KanzleiAI analysiert 8 Vertragstypen nach deutschem Recht: Arbeitsverträge, NDAs, SaaS, Dienstleistung, Lieferanten, Miet-, Kauf- und Lizenzverträge." }

export default function VertragstypenPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">⚖️</span>
              <span className="text-[12px] font-medium text-gold-700">8 Vertragstypen</span>
            </div>
            <h1 className="text-display text-gray-950">Spezialisiert auf deutsches Recht</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">KanzleiAI analysiert acht Vertragstypen mit spezifischen Prüfkriterien, BGB-Referenzen und typischen Risikobereichen.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="space-y-6">
            {vertragstypen.map((vt) => (
              <div key={vt.title} className="rounded-2xl border border-gray-100 bg-white p-7">
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[28px]">{vt.emoji}</span>
                      <div>
                        <h2 className="text-[18px] font-semibold text-gray-900">{vt.title}</h2>
                        <code className="text-[11px] text-gold-700">{vt.bgb}</code>
                      </div>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{vt.desc}</p>
                  </div>
                  <div className="lg:min-w-[280px]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Typische Risiken</p>
                    <ul className="mt-2 space-y-2">
                      {vt.risks.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-[13px] text-gray-600">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[8px] text-amber-700">!</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-display-sm text-gray-950">Ihren Vertragstyp testen?</h2>
          <p className="mt-4 text-[16px] text-gray-500">Laden Sie einen Vertrag hoch und sehen Sie die Analyse in Echtzeit.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">⚡ Jetzt analysieren</Link>
            <Link href="/enterprise-kontakt" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Demo anfragen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
