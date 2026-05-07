import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "§ 203 StGB — Geheimhaltungsvereinbarung",
  description: "Dedizierte Geheimhaltungsvereinbarung nach § 203 Abs. 4 StGB für Rechtsanwaelte, Steuerberater und andere Berufsgeheimnistraeger, die KanzleiAI als 'sonstige mitwirkende Person' einsetzen."
}
export const revalidate = 3600

export default function Paragraph203Page() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="border-b border-gray-200 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
            <span className="text-[14px]">⚖️</span>
            <span className="text-[12px] font-medium text-gold-700">
              Trust Center · Berufsrecht
            </span>
          </div>
          <h1 className="text-[2.25rem] font-semibold tracking-tight text-[#003856] sm:text-[2.75rem]">
            Geheimhaltungsvereinbarung nach § 203 StGB
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-gray-600">
            Dedizierte Vereinbarung für Rechtsanwaelte, Steuerberater und andere
            Berufsgeheimnistraeger. Erfuellt die Anforderung nach § 203 Abs. 4 StGB
            in Verbindung mit § 43e BRAO an die Einbindung &bdquo;sonstiger mitwirkender
            Personen&ldquo;.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-[15px] font-semibold text-amber-900">
              Warum eine separate Vereinbarung neben der AVV?
            </h2>
            <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-amber-800">
              <p>
                Der Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO regelt den
                Schutz personenbezogener Daten. Er reicht <strong>nicht</strong> aus,
                um die spezifischen Pflichten aus § 203 StGB zu erfuellen.
              </p>
              <p>
                § 203 Abs. 1 StGB schuetzt nicht nur personenbezogene Daten, sondern
                <strong> Mandantengeheimnisse</strong> als solche — einschliesslich der
                blossen Tatsache, dass ein Mandatsverhaeltnis besteht. Wer diese
                offenbart, macht sich strafbar.
              </p>
              <p>
                Seit der Novellierung 2017 (§ 203 Abs. 3 S. 2, Abs. 4 StGB) duerfen
                Berufsgeheimnistraeger Cloud-/KI-Dienstleister als &bdquo;sonstige
                mitwirkende Personen&ldquo; einbinden — aber <strong>nur dann</strong>,
                wenn eine formelle Geheimhaltungsvereinbarung mit Strafhinweis
                geschlossen wurde.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#003856]">
            Was die § 203-Vereinbarung regelt
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                emoji: "🔒",
                title: "Verpflichtung zur Verschwiegenheit",
                desc: "Schriftliche Zusicherung gemäß § 203 Abs. 4 Satz 2 Nr. 1 StGB, dass alle Mitarbeiter und Sub-Prozessoren zur Geheimhaltung verpflichtet sind."
              },
              {
                emoji: "⚖️",
                title: "Strafrechtlicher Hinweis",
                desc: "Ausdrueckliche Belehrung über die Strafbarkeit nach § 203 StGB bei Offenbarung fremder Geheimnisse (Strafrahmen bis 1 Jahr Freiheitsstrafe)."
              },
              {
                emoji: "👥",
                title: "Sub-Prozessoren-Kontrolle",
                desc: "Zusicherung, dass alle Sub-Prozessoren (inkl. US-amerikanischer KI-Provider) analoge Geheimhaltungspflichten tragen. Siehe Sub-Prozessoren-Liste."
              },
              {
                emoji: "🛑",
                title: "Zugriffsbeschraenkung",
                desc: "Technische und organisatorische Maßnahmen (Row-Level Security, Zero-Data-Retention-APIs, Audit-Trail), die den Zugriff auf Mandantendaten minimieren."
              },
              {
                emoji: "🗑️",
                title: "Datenloeschung",
                desc: "Verpflichtung zur vollstaendigen Löschung aller Mandantendaten nach Vertragsende innerhalb einer dokumentierten Frist."
              },
              {
                emoji: "📜",
                title: "Kollisionsfaelle",
                desc: "Verfahren für den Fall gesetzlicher Herausgabeverlangen (z.B. CLOUD Act, gerichtliche Anordnungen) einschliesslich Benachrichtigungspflicht."
              }
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-[20px]">{item.emoji}</span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#003856]">
            Verfahren zum Abschluss
          </h2>
          <ol className="mt-6 space-y-4">
            {[
              {
                step: "1",
                title: "Vereinbarung anfordern",
                desc: "Der Kanzlei-Ansprechpartner fordert die Geheimhaltungsvereinbarung über das Formular unten oder per E-Mail an."
              },
              {
                step: "2",
                title: "Bearbeitung und Unterzeichnung",
                desc: "KanzleiAI stellt das Dokument innerhalb von 2 Werktagen in personalisierter Form bereit. Unterzeichnung durch beide Parteien (digital oder postalisch)."
              },
              {
                step: "3",
                title: "Ablage im Trust Center",
                desc: "Die unterzeichnete Vereinbarung wird im persoenlichen Trust-Center-Bereich archiviert und ist jederzeit für interne Audits abrufbar."
              },
              {
                step: "4",
                title: "Freigabe der Mandantendaten-Verarbeitung",
                desc: "Erst nach Vorliegen der unterzeichneten § 203-Vereinbarung ist die Eingabe von Mandantengeheimnissen in KanzleiAI berufsrechtlich zulaessig."
              }
            ].map((s) => (
              <li
                key={s.step}
                className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[13px] font-semibold text-white">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="rounded-xl border border-[#003856]/20 bg-gradient-to-br from-white to-gold-50/30 p-6">
            <h2 className="text-[1.25rem] font-semibold tracking-tight text-[#003856]">
              § 203-Vereinbarung anfordern
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
              Das Dokument wird individuell auf Ihre Kanzlei/Rechtsabteilung
              personalisiert (Name, Sitz, Kammer-Zugehoerigkeit, Sub-Prozessoren-Auswahl).
              Kostenfrei für alle KanzleiAI-Business- und Enterprise-Kunden.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="mailto:compliance@sbsdeutschland.de?subject=%C2%A7%20203%20StGB%20Geheimhaltungsvereinbarung%20anfordern&body=Sehr%20geehrtes%20Compliance-Team%2C%0A%0Abitte%20senden%20Sie%20mir%20die%20auf%20unsere%20Kanzlei%2FRechtsabteilung%20personalisierte%20Geheimhaltungsvereinbarung%20nach%20%C2%A7%20203%20Abs.%204%20StGB%20zu.%0A%0AKanzlei%2FUnternehmen%3A%0ASitz%3A%0AKammer%2FAufsichtsbehörde%3A%0AAnsprechpartner%3A%0A%0AVielen%20Dank%21%0A"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]"
              >
                📧 Per E-Mail anfordern
              </a>
              <Link
                href="/enterprise-kontakt"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
              >
                💬 Kontaktformular
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.25rem] font-semibold tracking-tight text-[#003856]">
            Rechtlicher Rahmen
          </h2>
          <div className="mt-4 space-y-3">
            {[
              {
                law: "§ 203 Abs. 1 StGB",
                text: "Kernvorschrift der Schweigepflicht für Berufsgeheimnistraeger (insb. Rechtsanwaelte, Steuerberater, Aerzte)."
              },
              {
                law: "§ 203 Abs. 3 S. 2 StGB",
                text: "Einbindung von Mitarbeitern und \"sonstigen mitwirkenden Personen\" ohne strafbare Offenbarung — wenn diese zur Verschwiegenheit verpflichtet sind."
              },
              {
                law: "§ 203 Abs. 4 StGB",
                text: "Definiert die formalen Anforderungen an die Verpflichtung: Textform, Belehrung über Strafbarkeit, Einhaltung analoger Regeln für Sub-Beauftragte."
              },
              {
                law: "§ 43e BRAO",
                text: "Erlaubt Rechtsanwaelten die Einbindung externer IT-/Cloud-Dienstleister ohne Mandanten-Einzelzustimmung, wenn § 203-Anforderungen erfuellt sind."
              },
              {
                law: "BRAK-Leitfaden Januar 2025",
                text: "Bundesrechtsanwaltskammer-Handreichung zum Einsatz von KI in Kanzleien: Eigenverantwortliche Endkontrolle des Anwalts ist Pflicht."
              },
              {
                law: "BStBK FAQ-Katalog KI (Feb. 2026)",
                text: "Bundessteuerberaterkammer-FAQ: § 203-Prüfung ist Teil einer KI-Governance-Struktur in Steuerberatungskanzleien."
              }
            ].map((item) => (
              <div
                key={item.law}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <p className="text-[12px] font-semibold text-gold-700">{item.law}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-700">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] italic leading-relaxed text-gray-500">
            Diese Darstellung ersetzt keine Rechtsberatung im Einzelfall. Für die
            konkrete berufsrechtliche Wuerdigung Ihres KI-Einsatzes konsultieren Sie
            bitte Ihre Kammer oder einen auf Berufsrecht spezialisierten Rechtsanwalt.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/datenschutz"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Datenschutz / AVV
            </Link>
            <Link
              href="/trust/sub-prozessoren"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Sub-Prozessoren →
            </Link>
            <Link
              href="/trust/eu-ai-act"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              EU AI Act →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
