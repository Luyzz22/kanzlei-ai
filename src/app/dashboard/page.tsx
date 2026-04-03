import Link from "next/link"

const stats = [
  { label: "Verträge gesamt", value: "—", href: "/workspace/dokumente" },
  { label: "In Review", value: "—", href: "/workspace/review-queue" },
  { label: "Analysiert", value: "—", href: "/workspace/dokumente" },
  { label: "Audit-Events", value: "—", href: "/dashboard/audit" },
]

const quickActions = [
  { label: "⚡ Schnellanalyse", href: "/workspace/analyse", desc: "PDF hochladen, KI analysiert sofort Risiken" },
  { label: "🤖 Contract Copilot", href: "/workspace/copilot", desc: "KI-Assistent für Vertragsfragen und Risikoanalyse" },
  { label: "📋 Analyseverlauf", href: "/workspace/history", desc: "Vergangene Analysen einsehen und im Copilot öffnen" },
  { label: "Vertrag hochladen", href: "/workspace/upload", desc: "Dokument im Workspace erfassen" },
  { label: "Dokumente", href: "/workspace/dokumente", desc: "Alle Verträge und Dokumente einsehen" },
  { label: "Review-Queue", href: "/workspace/review-queue", desc: "Offene Prüfvorgänge bearbeiten" },
  { label: "Administration", href: "/dashboard/admin", desc: "Nutzer, Rollen und Einstellungen" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-950">Dashboard</h1>
        <p className="mt-1 text-[14px] text-gray-500">Überblick über Ihre Vertragsanalysen und Workflows.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-card"
          >
            <p className="text-[12px] font-medium text-gray-400">{stat.label}</p>
            <p className="mt-1 text-[1.5rem] font-semibold text-gray-950">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900">Schnellzugriff</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-card"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-100">
                <svg className="h-4 w-4 text-gold-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-gray-900">{action.label}</p>
                <p className="mt-0.5 text-[12px] text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-[13px] font-medium text-gray-700">System online</p>
        </div>
        <p className="mt-1 text-[12px] text-gray-500">
          Datenbank verbunden · OpenAI + Claude + Gemini aktiv · Audit Trail aktiv
        </p>
      </div>
    </div>
  )
}
