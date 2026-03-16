import type { Metadata } from "next"

import "./globals.css"
import { ConsentBanner } from "@/components/gdpr/consent-banner"
import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"
import { ThemeProvider } from "@/components/layout/theme-provider"

export const metadata: Metadata = {
  title: "KanzleiAI",
  description: "DSGVO-konforme KI-Plattform für moderne Kanzleien"
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <ConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
