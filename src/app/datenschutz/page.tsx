import type { Metadata } from "next"

export const metadata: Metadata = { title: "Datenschutzerklärung", description: "Datenschutzerklärung der SBS Deutschland GmbH & Co. KG für KanzleiAI." }
export default function DatenschutzPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔐 Rechtliches</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Datenschutzerklärung</h1>
          <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-600">
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">1. Verantwortlicher</h2>
              <p className="mt-3">SBS Deutschland GmbH & Co. KG, In der Dell 19, 69469 Weinheim. E-Mail: ki@sbsdeutschland.de</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
              <p className="mt-3">Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Dienste erforderlich ist. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">3. KI-gestützte Verarbeitung</h2>
              <p className="mt-3">KanzleiAI nutzt KI-Modelle zur Vertragsanalyse. Hochgeladene Dokumente werden zur Analyse an KI-Provider (Anthropic, OpenAI, Google) übermittelt. Es findet kein Training der KI-Modelle mit Ihren Daten statt. Die Verarbeitung erfolgt auf Basis einer Auftragsverarbeitungsvereinbarung (AVV) mit den jeweiligen Providern.</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">4. Datenspeicherung</h2>
              <p className="mt-3">Alle Daten werden auf Servern innerhalb der Europäischen Union gespeichert (Standort: Frankfurt am Main). Die Mandantentrennung erfolgt durch Row-Level Security auf Datenbankebene.</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">5. Ihre Rechte</h2>
              <p className="mt-3">Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO). Kontaktieren Sie uns unter ki@sbsdeutschland.de.</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">6. Cookies</h2>
              <p className="mt-3">Wir verwenden ausschließlich technisch notwendige Session-Cookies für die Authentifizierung. Es werden keine Tracking- oder Analyse-Cookies eingesetzt.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
