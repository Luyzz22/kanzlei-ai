import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Release Notes", description: "Alle Aenderungen und Updates an KanzleiAI." }

const releases = [
  {
    version: "2.0.0",
    date: "11. April 2026",
    title: "DERMALOG Enterprise + Einkauf & Beschaffung",
    current: true,
    changes: [
      { type: "NEU", text: "Bilinguale Vertragsanalyse (DE/EN) mit automatischer Spracherkennung" },
      { type: "NEU", text: "AGB vs. AEB Vergleichsmodus — zwei Dokumente Klausel fuer Klausel abgleichen" },
      { type: "NEU", text: "Lieferanten-Benchmarking — Risiko-Uebersicht aller analysierten Lieferanten" },
      { type: "NEU", text: "Umformulierungsvorschlaege fuer jedes Hochrisiko-Finding" },
      { type: "NEU", text: "Kuendigungsfristen-Dashboard mit Ampel-System (rot/gelb/gruen)" },
      { type: "NEU", text: "Loesungsseite Einkauf & Beschaffung mit 6 Use Cases" },
      { type: "NEU", text: "9 Procurement-Pruefpunkte (Limitation of Liability, Indemnification, IP, etc.)" },
      { type: "NEU", text: "EN-Vertragstypen: Supplier Agreement, NDA English, MSA, Purchase Agreement" },
      { type: "NEU", text: "Compare-API (/api/compare) fuer Dokumentenvergleich" },
    ]
  },
  {
    version: "1.8.0",
    date: "06. April 2026",
    title: "Enterprise Plattform Komplett",
    changes: [
      { type: "NEU", text: "Persistente Workspace-Sidebar (wie Notion/Linear)" },
      { type: "NEU", text: "KI-Transparenz-Seite mit 3 Modellen und Datenfluss" },
      { type: "NEU", text: "Dynamisches OG-Image (Edge Runtime) fuer Social Sharing" },
      { type: "NEU", text: "Social Proof mit 3 Testimonials und 5 Trust Badges" },
      { type: "NEU", text: "6 funktionale Admin-Subpages (Members, Security, Policies, etc.)" },
      { type: "NEU", text: "Audit-Dashboard mit Event-Typ-Filtern" },
      { type: "NEU", text: "Profil-Seite mit E-Mail/Passwort-Aenderung" },
      { type: "FIX", text: "Metadata fuer alle Tab-Titel ergaenzt" },
    ]
  },
  {
    version: "1.6.0",
    date: "05. April 2026",
    title: "Plattform-Ausbau & Compliance",
    changes: [
      { type: "NEU", text: "Trust Center mit 4 Saeulen, 6 Compliance-Badges, 7 Sub-Processors" },
      { type: "NEU", text: "Hilfe-Center mit Getting Started, Features, FAQ" },
      { type: "NEU", text: "Datenschutzerklaerung (10 DSGVO-Sektionen)" },
      { type: "NEU", text: "AVV mit TOM und 8 Verarbeitungssektionen" },
      { type: "NEU", text: "JSON-LD Structured Data (Organization + SoftwareApplication)" },
      { type: "FIX", text: "contractType wird jetzt an Analyse-API gesendet" },
      { type: "FIX", text: "NextAuth debug-mode auf Development beschraenkt" },
    ]
  },
  {
    version: "1.4.0",
    date: "04. April 2026",
    title: "Workspace & Admin Upgrade",
    changes: [
      { type: "NEU", text: "Admin-Dashboard mit 11 klickbaren Eintraegen" },
      { type: "NEU", text: "Vertragstypen-Seite mit 8 Typen und BGB-Referenzen" },
      { type: "NEU", text: "Developer/API-Seite mit 12 Endpunkten und Webhook-Doku" },
      { type: "NEU", text: "Password-Reset Seite" },
      { type: "FIX", text: "Login-Seite mit SSO-Fehlerbehandlung" },
    ]
  },
  {
    version: "1.2.0",
    date: "03. April 2026",
    title: "Sicherheit & Compliance",
    changes: [
      { type: "NEU", text: "Sicherheit-Seite mit 6 Schutzschichten" },
      { type: "NEU", text: "Loesungen-Seiten fuer Kanzleien und Rechtsabteilungen" },
      { type: "NEU", text: "Release Notes (diese Seite)" },
    ]
  },
  {
    version: "1.0.0",
    date: "01. April 2026",
    title: "Enterprise MVP",
    changes: [
      { type: "NEU", text: "KI-Vertragsanalyse mit 3 Providern (Claude, GPT-4o, Gemini)" },
      { type: "NEU", text: "Contract Copilot mit SSE-Streaming" },
      { type: "NEU", text: "4 Export-Formate (PDF, JSON, CSV, DATEV)" },
      { type: "NEU", text: "NextAuth v5 mit JWT + Credentials Provider" },
      { type: "NEU", text: "Row-Level Security fuer Mandantentrennung" },
      { type: "NEU", text: "Stripe Billing Integration" },
    ]
  }
]

export default function ReleaseNotesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Changelog</p>
      <h1 className="mt-2 text-display text-gray-950">Release Notes</h1>
      <p className="mt-4 text-[16px] text-gray-500">Alle Aenderungen und Verbesserungen an KanzleiAI.</p>

      <div className="mt-12 space-y-10">
        {releases.map((release) => (
          <div key={release.version} className="relative border-l-2 border-gray-200 pl-6">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white bg-[#003856]" />
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-semibold text-gray-900">v{release.version}</h2>
              {release.current && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">AKTUELL</span>}
              <span className="text-[13px] text-gray-400">{release.date}</span>
            </div>
            <p className="mt-1 text-[15px] font-medium text-gray-700">{release.title}</p>
            <div className="mt-4 space-y-2">
              {release.changes.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${c.type === "NEU" ? "bg-emerald-100 text-emerald-700" : c.type === "FIX" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{c.type}</span>
                  <p className="text-[13px] text-gray-600">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-gray-100 bg-gray-50 p-5 text-center">
        <p className="text-[14px] text-gray-600">Fragen oder Feature-Wuensche? <Link href="/enterprise-kontakt" className="font-medium text-[#003856]">Kontaktieren Sie uns →</Link></p>
      </div>
    </main>
  )
}
