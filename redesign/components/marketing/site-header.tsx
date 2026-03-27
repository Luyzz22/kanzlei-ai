'use client'

import Link from "next/link"
import { useState } from "react"

const primaryNav = [
  { label: "Produkt", href: "/produkt" },
  {
    label: "Lösungen",
    children: [
      { label: "Für Kanzleien", href: "/loesungen/kanzleien", desc: "Vertragsprüfung, Mandatskontext, Teamabstimmung" },
      { label: "Für Rechtsabteilungen", href: "/loesungen/rechtsabteilungen", desc: "Review-Abläufe, Freigaben, Entscheidungspfade" },
    ]
  },
  { label: "Preise", href: "/preise" },
  { label: "Integrationen", href: "/integrationen" },
  { label: "Trust Center", href: "/trust-center" },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003856]">
            <span className="text-[11px] font-bold tracking-tight text-white">KA</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">
            KanzleiAI
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) =>
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
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-lg px-3.5 py-3 transition-colors hover:bg-gray-50"
                      >
                        <span className="text-[13px] font-medium text-gray-900">{child.label}</span>
                        <span className="mt-0.5 block text-[12px] text-gray-500">{child.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-[13px] font-medium text-gray-600 transition-colors hover:text-gray-900">
            Anmelden
          </Link>
          <Link
            href="/enterprise-kontakt"
            className="rounded-full bg-[#003856] px-5 py-2 text-[13px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98]"
          >
            Demo anfragen
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-5 pb-6 pt-4 lg:hidden animate-fade-in">
          <div className="space-y-1">
            {primaryNav.map((item) =>
              item.children ? (
                <div key={item.label} className="space-y-1">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {item.label}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-lg px-3 py-2.5 text-[14px] text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="block rounded-lg px-3 py-2.5 text-[14px] text-gray-700 transition-colors hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
          <div className="mt-5 flex flex-col gap-2.5 border-t border-gray-100 pt-5">
            <Link href="/login" className="rounded-xl border border-gray-200 px-4 py-3 text-center text-[14px] font-medium text-gray-700 hover:bg-gray-50">
              Anmelden
            </Link>
            <Link href="/enterprise-kontakt" className="rounded-xl bg-[#003856] px-4 py-3 text-center text-[14px] font-medium text-white hover:bg-[#002a42]">
              Demo anfragen
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
