"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const workspaceNav = [
  { label: "Dashboard", href: "/dashboard", emoji: "📊" },
  { label: "Schnellanalyse", href: "/workspace/analyse", emoji: "⚡" },
  { label: "Contract Copilot", href: "/workspace/copilot", emoji: "🤖" },
  { label: "Analyseverlauf", href: "/workspace/history", emoji: "📋" },
  { label: "Dokumente", href: "/workspace/dokumente", emoji: "📂" },
  { label: "Upload", href: "/workspace/upload", emoji: "📤" },
  { label: "Faelle", href: "/workspace/faelle", emoji: "📁" },
  { label: "Review & Freigabe", href: "/workspace/review-queue", emoji: "✅" },
  { label: "AGB-Vergleich", href: "/workspace/vergleich", emoji: "⚖️" },
  { label: "Benchmarking", href: "/workspace/benchmarking", emoji: "📊" },
]

const adminNav = [
  { label: "Verwaltung", href: "/dashboard/admin", emoji: "⚙️" },
  { label: "Audit-Protokoll", href: "/dashboard/audit", emoji: "📋" },
  { label: "Billing", href: "/dashboard/billing", emoji: "💳" },
  { label: "Mein Profil", href: "/dashboard/profil", emoji: "👤" },
]

export function WorkspaceSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[220px] shrink-0 border-r border-gray-100 bg-white lg:block">
      <div className="sticky top-0 flex h-[calc(100vh-64px)] flex-col overflow-y-auto px-3 py-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Workspace</p>
        <nav className="mt-2 space-y-0.5">
          {workspaceNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${active ? "bg-gold-50 font-medium text-[#003856]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <span className="text-[14px]">{item.emoji}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Verwaltung</p>
          <nav className="mt-2 space-y-0.5">
            {adminNav.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard/admin" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${active ? "bg-gold-50 font-medium text-[#003856]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <span className="text-[14px]">{item.emoji}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">System online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
