import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Fuer Einkauf & Beschaffung", description: "KI-Vertragsanalyse fuer Einkaufsabteilungen: Lieferantenvertraege, NDAs, AGB-Abgleich, Kuendigungsfristen-Monitoring." }

export default function EinkaufPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🛒</span>
              <span className="text-[12px] font-medium text-gold-700">Einkauf & Beschaffung</span>
            </div>
            <h1 className="text-display text-gray-950">KI-Vertragsanalyse fuer den Einkauf</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Lieferantenvertraege in Sekunden pruefen, Risiken identifizieren und Konditionen vergleichen — in Deutsch und Englisch.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Demo anfragen</Link>
              <Link href="/workspace/analyse" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Jetzt testen</Link>
            </div>
          </div>
        </div>
      </section>

      {/* DERMALOG Use Cases */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Anwendungsfaelle</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Optimiert fuer Einkaufsabteilungen</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              { emoji: "📦", title: "Lieferantenvertraege (DE/EN)", desc: "Analyse von Supplier Agreements, Rahmenvertraegen und Einkaufsvertraegen. Automatische Spracherkennung — deutsche und englische Vertraege werden mit sprachspezifischen Risikokatalogen geprueft.", features: ["Limitation of Liability erkennen", "Haftungsbeschraenkungen bewerten", "Preisanpassungsklauseln identifizieren", "Gerichtsstand + anwendbares Recht pruefen"] },
              { emoji: "🔒", title: "NDA-Analyse (DE/EN)", desc: "Geheimhaltungsvereinbarungen systematisch pruefen: Vertraulichkeitsdefinition, Laufzeit, Vertragsstrafen, Ausnahmen und Rueckgabepflichten.", features: ["Zu weite Vertraulichkeitsdefinition erkennen", "Unbefristete Laufzeiten flaggen", "Verhaeltnismaessigkeit der Vertragsstrafen", "Fehlende Standardausnahmen identifizieren"] },
              { emoji: "⚖️", title: "AGB vs. AEB Abgleich", desc: "Lieferanten-AGB automatisch gegen Ihre eigenen Allgemeinen Einkaufsbedingungen pruefen. Abweichungen, Widersprueche und fehlende Klauseln werden identifiziert.", features: ["Tabellarischer Klausel-Vergleich", "Severity-Bewertung pro Abweichung", "Fehlende Klauseln erkennen", "Widersprueche zwischen AGB und AEB"] },
              { emoji: "📅", title: "Kuendigungsfristen-Monitoring", desc: "Alle vertraglichen Fristen auf einen Blick: Kuendigungsfristen, Auto-Renewal, Verlaengerungszeitraeume, naechste Kuendigungstermine.", features: ["Ampel-System (rot/gelb/gruen)", "Auto-Renewal Warnung", "Export als CSV fuer ERP", "Kalendarische Uebersicht"] },
              { emoji: "📊", title: "Lieferanten-Benchmarking", desc: "Konditionen mehrerer Lieferantenvertraege vergleichen: Preise, SLAs, Haftung, Kuendigungsfristen, Gewaehrleistung — alles in einer Uebersicht.", features: ["Risiko-Score pro Lieferant", "Konditionen-Vergleichstabelle", "Ø Risiko-Trend ueber Zeit", "Export fuer Management-Reporting"] },
              { emoji: "✏️", title: "Umformulierungsvorschlaege", desc: "Fuer jedes identifizierte Hochrisiko liefert die KI einen konkreten Formulierungsvorschlag, der das Risiko adressiert — direkt einsetzbar in Verhandlungen.", features: ["Alternative Klauseln fuer jedes Risiko", "Angepasst an DE/EN Recht", "Copilot fuer individuelle Rueckfragen", "Export als Word-Vorlage (geplant)"] },
            ].map((uc) => (
              <div key={uc.title} className="rounded-2xl border border-gray-100 bg-white p-7">
                <span className="text-[28px]">{uc.emoji}</span>
                <h3 className="mt-3 text-[18px] font-semibold text-gray-900">{uc.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{uc.desc}</p>
                <ul className="mt-4 space-y-2">
                  {uc.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[8px] text-gold-700">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Contract Types */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📄 Vertragstypen</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Deutsch & Englisch</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Lieferantenvertrag", "Supplier Agreement", "NDA (DE)", "NDA (English)",
              "Dienstleistungsvertrag", "Service Agreement", "Rahmenvertrag", "Master Service Agreement",
              "Kaufvertrag", "Purchase Agreement", "SaaS-Vertrag", "SaaS Agreement",
              "AGB-Abgleich", "Lizenzvertrag", "License Agreement", "Werkvertrag"
            ].map((t) => (
              <div key={t} className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-center text-[13px] font-medium text-gray-700">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔗 Integration</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Passt in Ihren Beschaffungsprozess</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: "🏢", title: "Microsoft Dynamics", desc: "Vertraege aus Dynamics importieren, Analyseergebnisse zurueckschreiben. API-basierte Integration.", status: "In Entwicklung" },
              { emoji: "📤", title: "DATEV Export", desc: "Analyseergebnisse im DATEV-Format 510 fuer Ihre Buchhaltung exportieren.", status: "Verfuegbar" },
              { emoji: "🔔", title: "Slack / Teams", desc: "Automatische Benachrichtigungen bei Hochrisiko-Vertraegen via Webhook.", status: "Verfuegbar" },
            ].map((int) => (
              <div key={int.title} className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[22px]">{int.emoji}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${int.status === "Verfuegbar" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{int.status}</span>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900">{int.title}</h3>
                <p className="mt-1 text-[13px] text-gray-500">{int.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <span className="text-[28px]">🛒</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Bereit fuer Ihren Einkauf?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">Testen Sie KanzleiAI mit Ihren eigenen Lieferantenvertraegen. Kostenloser Pilot, individuelle Anpassung.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Pilotprojekt starten</Link>
            <Link href="/preise" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Preise ansehen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
