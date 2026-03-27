import type { Metadata } from "next"

import "./globals.css"
import { ConsentBanner } from "@/components/gdpr/consent-banner"
import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"
import { ThemeProvider } from "@/components/layout/theme-provider"

export const metadata: Metadata = {
  title: {
    default: "KanzleiAI — KI-Vertragsanalyse für juristische Teams",
    template: "%s | KanzleiAI"
  },
  description: "KI-gestützte Vertragsanalyse und Dokumentenprüfung. Risiken erkennen, Verträge strukturiert prüfen, Entscheidungen auditfähig dokumentieren. Ein Produkt der SBS Deutschland GmbH.",
  metadataBase: new URL("https://kanzlei-ai.com"),
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "KanzleiAI",
    title: "KanzleiAI — KI-Vertragsanalyse für juristische Teams",
    description: "Verträge prüfen. Risiken erkennen. Entscheidungen dokumentieren. DSGVO-konform, Multi-Provider KI, auditfähig.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
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
