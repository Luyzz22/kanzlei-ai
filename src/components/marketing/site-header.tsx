'use client'

import Link from "next/link"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"

type NavItem = {
  label: string
  href?: string
  children?: Array<{label: string; href: string; desc: string}>
}

const publicNav: NavItem[] = [
  {
    label: "Produkt",
    children: [
      { label: "Produkt-Übersicht", href: "/produkt", desc: "6 Kernmodule, Tech-Stack, Sicherheit" },
      { label: "Vertragstypen", href: "/vertragstypen", desc: "8 Typen mit BGB-Referenzen" },
      { label: "Developer / API", href: "/developer", desc: "REST API, Webhooks, Integrationen" },
    ]
  },
  {
    label: "Lösungen",
    children: [
      { label: "Für Kanzleien", href: "/loesungen/kanzleien", desc: "Vertragsprüfung, Mandatskontext, Teamabstimmung" },
      { label: "Für Rechtsabteilungen", href: "/loesungen/rechtsabteilungen", desc: "Review-Abläufe, Freigaben, Entscheidungspfade" },
      { label: "Für Einkauf & Beschaffung", href: "/loesungen/einkauf", desc: "Lieferantenverträge, NDAs, AGB-Abgleich" },
    ]
  },
  { label: "Preise", href: "/preise" },
  { label: "Trust Center", href: "/trust-center" },
]

const appNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Workspace", href: "/workspace/dokumente" },
  { label: "Upload", href: "/workspace/upload" },
  { label: "Analyse", href: "/workspace/analyse" },
  { label: "Copilot", href: "/workspace/copilot" },
  { label: "Verlauf", href: "/workspace/history" },
  { label: "Review", href: "/workspace/review-queue" },
]

export function SiteHeader() {
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isLoggedIn = status === "authenticated" && session?.user
  const nav = isLoggedIn ? appNav : publicNav

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-[#FAFAF7]/85 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003856]">
            <span className="text-[11px] font-bold tracking-tight text-white">KA</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">KanzleiAI</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            item.children ? (
              <div key={item.label} className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button className="flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                  {item.label}
                  <svg className="h-3.5 w-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-200/80 bg-white p-2 shadow-elevated animate-fade-in">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className="block rounded-lg px-3.5 py-3 transition-colors hover:bg-gray-50">
                        <span className="text-[13px] font-medium text-gray-900">{child.label}</span>
                        <span className="mt-0.5 block text-[12px] text-gray-500">{child.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href || item.label}
                href={item.href || "#"}
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 rounded-full border border-gray-200 py-1.5 pl-3 pr-2 transition-colors hover:bg-gray-50"
              >
                <span className="text-[13px] font-medium text-gray-700">{session.user.name || session.user.email}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003856] text-[11px] font-bold text-white">
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200/80 bg-white p-2 shadow-elevated animate-fade-in">
                    <div className="border-b border-gray-100 px-3 py-2.5">
                      <p className="text-[13px] font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-[12px] text-gray-500">{session.user.email}</p>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Workspace</p>
                      <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                      <Link href="/workspace/dokumente" className="block rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Dokumente</Link>
                      <Link href="/workspace/upload" className="block rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Upload</Link>
                      <Link href="/dashboard/profil" className="block rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Mein Profil</Link>
                    </div>

                    <div className="mt-1 border-t border-gray-100 pt-1 space-y-0.5">
                      <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Konto</p>
                      <Link href="/dashboard/admin" className="block rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Administration</Link>
                      <Link href="/dashboard/audit" className="block rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Audit-Log</Link>
                    </div>

                    <div className="mt-1 border-t border-gray-100 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
                      >
                        Abmelden
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-[13px] font-medium text-gray-600 transition-colors hover:text-gray-900">Anmelden</Link>
              <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-5 py-2 text-[13px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98]">Demo anfragen</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-5 pb-6 pt-4 lg:hidden animate-fade-in">
          <div className="space-y-1">
            {nav.map((item) =>
              item.children ? (
                <div key={item.label} className="space-y-1">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.label}</p>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} className="block rounded-lg px-3 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{child.label}</Link>
                  ))}
                </div>
              ) : (
                <Link key={item.href || item.label} href={item.href || "#"} className="block rounded-lg px-3 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{item.label}</Link>
              )
            )}
          </div>
          <div className="mt-5 border-t border-gray-100 pt-5">
            {isLoggedIn ? (
              <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full rounded-xl border border-red-200 px-4 py-3 text-center text-[14px] font-medium text-red-600 hover:bg-red-50">Abmelden</button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link href="/login" className="rounded-xl border border-gray-200 px-4 py-3 text-center text-[14px] font-medium text-gray-700 hover:bg-gray-50">Anmelden</Link>
                <Link href="/enterprise-kontakt" className="rounded-xl bg-[#003856] px-4 py-3 text-center text-[14px] font-medium text-white hover:bg-[#002a42]">Demo anfragen</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
