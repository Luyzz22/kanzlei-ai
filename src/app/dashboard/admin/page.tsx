import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Administration", description: "Nutzer, Rollen, Sicherheit und Mandanteneinstellungen." }

const sections = [
  {
    title: "Benutzerverwaltung",
    items: [
      { emoji: "👥", title: "Team-Mitglieder", desc: "Nutzer einladen, Rollen zuweisen und Zugriffsrechte verwalten", href: "/dashboard/admin/members", status: "Verfuegbar" },
      { emoji: "📜", title: "Richtlinien", desc: "Organisationsrichtlinien fuer Vertragsanalyse und Dokumentenverarbeitung", href: "/dashboard/admin/policies", status: "Verfuegbar" },
      { emoji: "✅", title: "Freigabeprozesse", desc: "Mehrstufige Freigabe-Workflows fuer analysierte Vertraege definieren", href: "/dashboard/admin/approval-policies", status: "Verfuegbar" },
    ]
  },
  {
    title: "Sicherheit & Zugriff",
    items: [
      { emoji: "🔐", title: "Sicherheit & Zugriff", desc: "Authentifizierung, SSO-Konfiguration und Zugriffsprotokolle", href: "/dashboard/admin/security-access", status: "Verfuegbar" },
      { emoji: "🗄️", title: "Datenschutz & Aufbewahrung", desc: "Aufbewahrungsfristen, Loeschrichtlinien und DSGVO-Einstellungen", href: "/dashboard/admin/privacy-retention", status: "Verfuegbar" },
    ]
  },
  {
    title: "KI & Governance",
    items: [
      { emoji: "🔑", title: "API-Schluessel", desc: "REST API Keys erstellen und verwalten", href: "/dashboard/admin/api-keys", status: "Verfuegbar" },
      { emoji: "🤖", title: "Prompt Governance", desc: "KI-Prompt-Versionen, Release-Prozesse und Qualitaetskontrolle", href: "/dashboard/admin/prompt-governance", status: "Verfuegbar" },
    ]
  },
  {
    title: "Audit & Monitoring",
    items: [
      { emoji: "📋", title: "Audit-Log", desc: "Alle Aktionen mandantengetrennt protokolliert und exportierbar", href: "/dashboard/audit", status: "Aktiv" },
      { emoji: "📊", title: "Aktivitaeten", desc: "Detaillierte Ansicht aller Audit-Events mit Filterung und Export", href: "/dashboard/audit/aktivitaeten", status: "Verfuegbar" },
      { emoji: "📡", title: "Systemstatus", desc: "Live-Health-Checks fuer Datenbank und KI-Provider", href: "/systemstatus", status: "Aktiv" },
    ]
  },
  {
    title: "Abrechnung & Konto",
    items: [
      { emoji: "💳", title: "Billing & Subscription", desc: "Plan verwalten, Rechnungen einsehen, Stripe Customer Portal", href: "/dashboard/billing", status: "Aktiv" },
      { emoji: "👤", title: "Mein Profil", desc: "E-Mail, Passwort und persoenliche Einstellungen aendern", href: "/dashboard/profil", status: "Verfuegbar" },
    ]
  },
]

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚙️ Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Verwaltung</h1>
      <p className="mt-2 text-[14px] text-gray-500">Nutzer, Sicherheit, KI-Governance und Mandanteneinstellungen.</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-gray-400">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <Link key={item.title} href={item.href} className="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-gold-200 hover:shadow-card">
                  <span className="text-[22px]">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-gray-900 group-hover:text-[#003856]">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === "Aktiv" ? "bg-emerald-100 text-emerald-700" : item.status === "Verfuegbar" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-gray-500">{item.desc}</p>
                  </div>
                  <svg className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
