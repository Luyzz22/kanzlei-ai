import Link from "next/link"

import { ThemeToggle } from "@/components/layout/theme-toggle"

const primaryNav = [
  { label: "Produkt", href: "/produkt" },
  { label: "Lösungen Kanzleien", href: "/loesungen/kanzleien" },
  { label: "Lösungen Rechtsabteilungen", href: "/loesungen/rechtsabteilungen" },
  { label: "Preise", href: "/preise" },
  { label: "Integrationen", href: "/integrationen" },
  { label: "Trust Center", href: "/trust-center" },
  { label: "Hilfe", href: "/hilfe" }
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-slate-950">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-xs">KA</span>
            KanzleiAI
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/enterprise-kontakt" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Enterprise-Kontakt
          </Link>
          <Link href="/login" className="inline-flex rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Login
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-wrap gap-2 lg:hidden">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
