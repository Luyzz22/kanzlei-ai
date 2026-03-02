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
          <header className="border-b">
            <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
              <Link href="/" className="font-semibold">
                KanzleiAI
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <Link href="/datenschutz">Datenschutz</Link>
                <Link href="/impressum">Impressum</Link>
                <Link href="/avv">AVV</Link>
                <ThemeToggle />
              </div>
            </nav>
          </header>
          {children}
          <ConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
