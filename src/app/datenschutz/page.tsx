import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Datenschutzerklärung", description: "Datenschutzerklaerung der SBS Deutschland GmbH & Co. KG fuer KanzleiAI." }

const sections = [
  {
    title: "1. Verantwortlicher",
    content: "Verantwortlich fuer die Datenverarbeitung im Sinne der DSGVO ist die SBS Deutschland GmbH & Co. KG, In der Dell 19, 69469 Weinheim, Deutschland. E-Mail: ki@sbsdeutschland.de. Bei Fragen zum Datenschutz wenden Sie sich bitte an diese Adresse."
  },
  {
    title: "2. Hosting und Infrastruktur",
    content: "KanzleiAI wird auf Vercel Inc. (USA) gehostet, wobei der Traffic ueber das europaeische Edge-Netzwerk geroutet wird. Die Datenbank wird bei Neon Inc. in der Region eu-central-1 (Frankfurt am Main) betrieben. Ein Auftragsverarbeitungsvertrag (AVV) liegt mit allen Dienstleistern vor."
  },
  {
    title: "3. Welche Daten wir verarbeiten",
    content: "Bei der Nutzung von KanzleiAI verarbeiten wir: Bestandsdaten (Name, E-Mail-Adresse, Organisation, Rolle), Nutzungsdaten (Zeitstempel, aufgerufene Seiten, durchgefuehrte Analysen), Vertragsdokumente (hochgeladene PDFs und Texte fuer die KI-Analyse), Analyseergebnisse (Risiko-Scores, extrahierte Daten, Findings), sowie technische Daten (IP-Adresse, Browser-Typ, Geraelinformationen)."
  },
  {
    title: "4. KI-Verarbeitung",
    content: "Hochgeladene Vertraege werden zur Analyse an KI-Provider uebermittelt (Anthropic/Claude, OpenAI/GPT-4o, Google/Gemini). Die Uebermittlung erfolgt verschluesselt via TLS 1.3. Kein KI-Provider nutzt Ihre Daten zum Training von Modellen. Dies ist vertraglich durch AVVs mit allen Providern abgesichert. Analyseergebnisse werden mandantengetrennt gespeichert."
  },
  {
    title: "5. Rechtsgrundlagen",
    content: "Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfuellung), Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bereitstellung und Sicherheit des Dienstes), sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung, soweit erteilt)."
  },
  {
    title: "6. Cookies und Tracking",
    content: "KanzleiAI verwendet ausschliesslich technisch notwendige Cookies fuer die Authentifizierung (Session-Cookie, JWT-Token). Optionale Analyse-Cookies werden nur mit Ihrer ausdruecklichen Einwilligung gesetzt. Sie koennen Ihre Cookie-Praeferenzen jederzeit aendern."
  },
  {
    title: "7. Datensicherheit",
    content: "Wir setzen umfangreiche technische und organisatorische Massnahmen ein: TLS 1.3 Verschluesselung, Row-Level Security auf Datenbankebene, RBAC-Zugriffskontrolle, manipulationssicherer Audit Trail, Security Headers (HSTS, CSP, X-Frame-Options). Alle Daten werden in der EU (Frankfurt am Main) gespeichert."
  },
  {
    title: "8. Ihre Rechte",
    content: "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Loeschung (Art. 17 DSGVO), Einschraenkung der Verarbeitung (Art. 18 DSGVO), Datenuebertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO). Zur Ausuebung Ihrer Rechte kontaktieren Sie uns unter ki@sbsdeutschland.de."
  },
  {
    title: "9. Aufbewahrungsfristen",
    content: "Personenbezogene Daten werden geloescht, sobald der Zweck der Verarbeitung entfaellt und keine gesetzlichen Aufbewahrungspflichten bestehen. Analyseergebnisse werden fuer die Dauer des Vertragsverhaelenisses gespeichert. Audit-Log-Eintraege werden gemaess den gesetzlichen Anforderungen aufbewahrt."
  },
  {
    title: "10. Beschwerderecht",
    content: "Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehoerde zu beschweren. Die fuer uns zustaendige Aufsichtsbehoerde ist der Landesbeauftragte fuer den Datenschutz und die Informationsfreiheit Baden-Wuerttemberg."
  },
]

export default function DatenschutzPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Rechtliches</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Datenschutzerklaerung</h1>
          <p className="mt-4 text-[14px] text-gray-500">Stand: April 2026</p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-[17px] font-semibold text-gray-900">{section.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-gray-100 bg-white p-6">
            <p className="text-[13px] text-gray-500">Fragen zum Datenschutz? Kontaktieren Sie uns unter <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link>. Eine Auftragsverarbeitungsvereinbarung (AVV) stellen wir auf Anfrage zur Verfuegung: <Link href="/avv" className="font-medium text-[#003856]">AVV ansehen</Link></p>
          </div>
        </div>
      </section>
    </main>
  )
}
