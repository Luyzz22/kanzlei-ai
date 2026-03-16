import type { Metadata } from "next"
import Link from "next/link"

import "./globals.css"
import { ConsentBanner } from "@/components/gdpr/consent-banner"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export const metadata: Metadata = {
  title: "KanzleiAI",
  description: "DSGVO-konforme KI-Plattform für moderne Kanzleien"
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <header className="border-b border-slate-200 bg-white/95">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="font-semibold">
                KanzleiAI
              </Link>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <Link href="/produkt" className="hover:text-slate-950">Produkt</Link>
                <Link href="/loesungen/kanzleien" className="hover:text-slate-950">Lösungen Kanzleien</Link>
                <Link href="/loesungen/rechtsabteilungen" className="hover:text-slate-950">Lösungen Rechtsabteilungen</Link>
                <Link href="/preise" className="hover:text-slate-950">Preise</Link>
                <Link href="/integrationen" className="hover:text-slate-950">Integrationen</Link>
                <Link href="/enterprise-kontakt" className="hover:text-slate-950">Enterprise-Kontakt</Link>
                <Link href="/workspace/dokumente" className="hover:text-slate-950">Workspace</Link>
                <Link href="/hilfe" className="hover:text-slate-950">Hilfe</Link>
                <Link href="/support" className="hover:text-slate-950">Support</Link>
                <Link href="/systemstatus" className="hover:text-slate-950">Systemstatus</Link>
                <Link href="/trust-center" className="hover:text-slate-950">Trust Center</Link>
                <Link href="/sicherheit-compliance" className="hover:text-slate-950">Sicherheit & Compliance</Link>
                <Link href="/datenschutz" className="hover:text-slate-950">Datenschutz</Link>
                <Link href="/impressum" className="hover:text-slate-950">Impressum</Link>
                <Link href="/avv" className="hover:text-slate-950">AVV</Link>
                <ThemeToggle />
              </div>
            </nav>
          </header>
          {children}
          <footer className="border-t">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
              <Link href="/datenschutz" className="hover:text-foreground">
                Datenschutz
              </Link>
              <Link href="/impressum" className="hover:text-foreground">
                Impressum
              </Link>
              <Link href="/avv" className="hover:text-foreground">
                AVV
              </Link>
              <Link href="/ki-transparenz" className="hover:text-foreground">
                KI-Transparenz
              </Link>
              <Link href="/trust-center" className="hover:text-foreground">
                Trust Center
              </Link>
            </div>
          </footer>
          <ConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
