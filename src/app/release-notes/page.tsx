import type { Metadata } from "next"

const releases = [
  {
    version: "1.6.0",
    date: "05. April 2026",
    tag: "Aktuell",
    changes: [
      { type: "feat", text: "Developer/API-Seite mit 25 Endpunkten, Webhook-Events und Beispiel-Payloads" },
      { type: "feat", text: "Vertragstypen-Wissensdatenbank mit 8 Vertragstypen und BGB-Referenzen" },
      { type: "feat", text: "Admin-Subpages: Members, Policies, Freigaben, Security, Datenschutz, Prompt Governance" },
      { type: "fix", text: "NextAuth Debug-Modus in Production deaktiviert" },
      { type: "fix", text: "SSO-Fehler werden jetzt auf der Login-Seite angezeigt" },
      { type: "feat", text: "Password-Reset-Seite (war 404)" },
      { type: "feat", text: "Demo-Zugangsdaten auf der Login-Seite sichtbar" },
    ]
  },
  {
    version: "1.5.0",
    date: "05. April 2026",
    changes: [
      { type: "feat", text: "Loesungen-Seite: Kanzleien vs. Rechtsabteilungen mit Feature-Vergleich" },
      { type: "feat", text: "Produkt-Seite: Metrics Strip, 6 Kernmodule, Tech-Stack, Sicherheits-Summary" },
      { type: "feat", text: "Landing Page: Stats-Sektion mit harten Zahlen" },
    ]
  },
  {
    version: "1.4.0",
    date: "04. April 2026",
    changes: [
      { type: "feat", text: "DATEV-Format 510 CSV-Export fuer Steuerkanzleien" },
      { type: "feat", text: "CSV-Export mit BOM fuer Excel-Kompatibilitaet" },
      { type: "feat", text: "Webhook-Gateway mit n8n- und Slack-Integration" },
      { type: "feat", text: "Automatische Hochrisiko-Benachrichtigungen (Score >= 70)" },
      { type: "feat", text: "Analyseverlauf mit Volltextsuche, Statistiken, Export-Buttons" },
    ]
  },
  {
    version: "1.3.0",
    date: "04. April 2026",
    changes: [
      { type: "feat", text: "Health API mit Live-Checks (DB, Claude, OpenAI)" },
      { type: "feat", text: "Echtzeit-Systemstatus-Seite mit Service-Badges" },
      { type: "feat", text: "Row-Level Security auf 12 PostgreSQL-Tabellen" },
      { type: "feat", text: "Security Headers: HSTS, X-Frame-Options DENY, CSP" },
      { type: "feat", text: "Tenant-Helper und Audit-Logging-Bibliothek" },
      { type: "feat", text: "RBAC Middleware fuer Admin-Only-Routen" },
      { type: "feat", text: "Dynamisches Dashboard mit echten Statistiken" },
      { type: "feat", text: "JSON-Export fuer Analyseergebnisse" },
    ]
  },
  {
    version: "1.2.0",
    date: "03. April 2026",
    changes: [
      { type: "feat", text: "Stripe Billing: Checkout, Customer Portal, Webhook-Handler" },
      { type: "feat", text: "Preise-Seite mit interaktiven Plan-Buttons" },
      { type: "feat", text: "Billing-Dashboard mit Usage-Stats" },
      { type: "feat", text: "SEO: Favicon, 23 Seitentitel, OG-Tags, robots.txt, sitemap.xml" },
      { type: "feat", text: "Custom 404-Seite" },
      { type: "feat", text: "Enterprise-Design fuer Upload, Dokumente, Review-Queue, Admin, Audit" },
    ]
  },
  {
    version: "1.1.0",
    date: "03. April 2026",
    changes: [
      { type: "feat", text: "PDF-Export mit Risiko-Kreis, Findings und SBS-Branding" },
      { type: "feat", text: "Analyseverlauf mit Auto-Save und Copilot-Uebernahme" },
      { type: "feat", text: "Enterprise-Kontakt E-Mail via Resend (Notification + Bestaetigigung)" },
      { type: "feat", text: "Sidebar-Navigation mit Verlauf-Link" },
    ]
  },
  {
    version: "1.0.0",
    date: "03. April 2026",
    changes: [
      { type: "feat", text: "KI-Vertragsanalyse mit Claude Sonnet 4 (Primaer) und GPT-4o (Fallback)" },
      { type: "feat", text: "Contract Copilot mit SSE-Streaming und Markdown-Rendering" },
      { type: "feat", text: "Enterprise-Design: Warm Stone Palette, SBS Blue, Gold-Akzente" },
      { type: "feat", text: "NextAuth v5 JWT-Auth mit Demo-Provisioning" },
      { type: "feat", text: "Mandantentrennung (Application-Level)" },
      { type: "feat", text: "25+ Seiten im Enterprise-Design" },
      { type: "feat", text: "Landing Page, Produkt, Preise, Loesungen, Trust Center, Legal" },
    ]
  },
]

export const metadata: Metadata = { title: "Release Notes", description: "Changelog und neue Features von KanzleiAI." }

export default function ReleaseNotesPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">📝</span>
              <span className="text-[12px] font-medium text-gold-700">Changelog</span>
            </div>
            <h1 className="text-display text-gray-950">Release Notes</h1>
            <p className="mt-4 text-[17px] text-gray-500">Alle Updates, Features und Verbesserungen.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="space-y-8">
            {releases.map((release) => (
              <div key={release.version} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="text-[18px] font-bold text-gray-950">v{release.version}</span>
                  <span className="text-[13px] text-gray-400">{release.date}</span>
                  {release.tag && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{release.tag}</span>}
                </div>
                <ul className="mt-4 space-y-2">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-gray-600">
                      <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${change.type === "feat" ? "bg-blue-100 text-blue-700" : change.type === "fix" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                        {change.type === "feat" ? "NEU" : "FIX"}
                      </span>
                      {change.text}
                    </li>
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
