"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const SIDEBAR_KEY = "kanzlei_sidebar_collapsed"
const SECTIONS_KEY = "kanzlei_sidebar_sections"

const workspaceNav = [
  { label: "Dashboard", href: "/dashboard", emoji: "📊" },
  { label: "Schnellanalyse", href: "/workspace/analyse", emoji: "⚡" },
  { label: "Contract Copilot", href: "/workspace/copilot", emoji: "🤖" },
  { label: "Analyseverlauf", href: "/workspace/history", emoji: "📋" },
  { label: "Dokumente", href: "/workspace/dokumente", emoji: "📂" },
  { label: "Upload", href: "/workspace/upload", emoji: "📤" },
  { label: "Faelle & Mandate", href: "/workspace/faelle", emoji: "📁" },
  { label: "Review & Freigabe", href: "/workspace/review-queue", emoji: "✅" },
  { label: "AGB-Vergleich", href: "/workspace/vergleich", emoji: "⚖️" },
  { label: "Benchmarking", href: "/workspace/benchmarking", emoji: "📊" },
]

const adminNav = [
  { label: "Benachrichtigungen", href: "/dashboard/benachrichtigungen", emoji: "🔔" },
  { label: "Onboarding", href: "/workspace/onboarding", emoji: "👋" },
  { label: "Verwaltung", href: "/dashboard/admin", emoji: "⚙️" },
  { label: "Audit-Protokoll", href: "/dashboard/audit", emoji: "📋" },
  { label: "Billing", href: "/dashboard/billing", emoji: "💳" },
  { label: "Mein Profil", href: "/dashboard/profil", emoji: "👤" },
]

function NavItem({ item, active, collapsed }: { item: typeof workspaceNav[0]; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center rounded-lg transition-colors ${
        collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2"
      } ${
        active
          ? "bg-gold-50 font-medium text-[#003856]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`${collapsed ? "text-[16px]" : "text-[14px]"} shrink-0`}>{item.emoji}</span>
      {!collapsed && <span className="text-[13px] truncate">{item.label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-[12px] font-medium text-white shadow-lg group-hover:block">
          {item.label}
        </span>
      )}
    </Link>
  )
}

function SectionHeader({ label, collapsed, open, onToggle }: { label: string; collapsed: boolean; open: boolean; onToggle: () => void }) {
  if (collapsed) return <div className="mx-auto my-2 h-px w-6 bg-gray-200" />
  return (
    <button onClick={onToggle} className="flex w-full items-center justify-between px-3 py-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <svg className={`h-3 w-3 text-gray-300 transition-transform ${open ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export function WorkspaceSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [sections, setSections] = useState({ workspace: true, admin: true })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY)
      if (stored === "true") setCollapsed(true)
      const storedSections = localStorage.getItem(SECTIONS_KEY)
      if (storedSections) setSections(JSON.parse(storedSections))
    } catch {}
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  const toggleSection = useCallback((key: "workspace" | "admin") => {
    setSections(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Keyboard shortcut: Cmd+B / Ctrl+B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [toggleCollapsed])

  return (
    <aside className={`hidden shrink-0 border-r border-gray-100 bg-white transition-all duration-200 ease-in-out lg:block ${collapsed ? "w-[56px]" : "w-[220px]"}`}>
      <div className="sticky top-0 flex h-[calc(100vh-64px)] flex-col overflow-y-auto overflow-x-hidden py-4">
        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Sidebar ausklappen (⌘B)" : "Sidebar einklappen (⌘B)"}
          className={`mx-auto mb-3 flex items-center justify-center rounded-lg border border-gray-100 bg-gray-50 transition-all hover:bg-gray-100 ${collapsed ? "h-8 w-8" : "mx-3 h-7 w-full gap-2 px-3"}`}
        >
          <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="text-[11px] text-gray-400">Einklappen</span>}
        </button>

        {/* Workspace Section */}
        <div className={collapsed ? "px-1.5" : "px-2"}>
          <SectionHeader label="Workspace" collapsed={collapsed} open={sections.workspace} onToggle={() => toggleSection("workspace")} />
          {(sections.workspace || collapsed) && (
            <nav className="mt-1 space-y-0.5">
              {workspaceNav.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return <NavItem key={item.href} item={item} active={active} collapsed={collapsed} />
              })}
            </nav>
          )}
        </div>

        {/* Admin Section */}
        <div className={`mt-4 ${collapsed ? "px-1.5" : "px-2"}`}>
          <SectionHeader label="Verwaltung" collapsed={collapsed} open={sections.admin} onToggle={() => toggleSection("admin")} />
          {(sections.admin || collapsed) && (
            <nav className="mt-1 space-y-0.5">
              {adminNav.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard/admin" && pathname.startsWith(item.href))
                return <NavItem key={item.href} item={item} active={active} collapsed={collapsed} />
              })}
            </nav>
          )}
        </div>

        {/* System Status */}
        <div className={`mt-auto border-t border-gray-100 pt-3 ${collapsed ? "px-1.5" : "px-2"}`}>
          {collapsed ? (
            <div className="flex justify-center" title="System online">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-700">System online</span>
            </div>
          )}
          {!collapsed && (
            <p className="mt-2 px-1 text-center text-[9px] text-gray-300">⌘B zum Ein-/Ausklappen</p>
          )}
        </div>
      </div>
    </aside>
  )
}
