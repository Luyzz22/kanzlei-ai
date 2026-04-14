import Link from "next/link"

const footerGroups = [
  {
    title: "Produkt",
    links: [
      { label: "Produkt-Übersicht", href: "/produkt" },
      { label: "Integrationen", href: "/integrationen" },
      { label: "Preise", href: "/preise" },
      { label: "Vertragstypen", href: "/vertragstypen" },
      { label: "Release Notes", href: "/release-notes" },
    ]
  },
  {
    title: "Lösungen",
    links: [
      { label: "Für Kanzleien", href: "/loesungen/kanzleien" },
      { label: "Für Rechtsabteilungen", href: "/loesungen/rechtsabteilungen" },
      { label: "Für Einkauf & Beschaffung", href: "/loesungen/einkauf" },
      { label: "Enterprise-Kontakt", href: "/enterprise-kontakt" },
    ]
  },
  {
    title: "Trust & Compliance",
    links: [
      { label: "Trust Center", href: "/trust-center" },
      { label: "Sicherheit", href: "/sicherheit-compliance" },
      { label: "KI-Transparenz", href: "/ki-transparenz" },
      { label: "Systemstatus", href: "/systemstatus" },
      { label: "Developer / API", href: "/developer" },
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Hilfe", href: "/hilfe" },
      { label: "Support", href: "/support" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "Impressum", href: "/impressum" },
      { label: "AVV", href: "/avv" },
      { label: "Cookie-Einstellungen", href: "/cookie-einstellungen" },
    ]
  }
]

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#FAFAF7]">
      {/* Main Footer */}
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003856]">
                <span className="text-[11px] font-bold tracking-tight text-white">KA</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-gray-900">KanzleiAI</span>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-500">
              KI-gestützte Vertragsanalyse und Dokumentenprüfung für juristische Teams.
            </p>
            <div className="pt-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Ein Produkt der</p>
              <p className="mt-0.5 text-[13px] font-medium text-gray-600">SBS Deutschland GmbH & Co. KG</p>
              <p className="text-[12px] text-gray-400">In der Dell 19, 69469 Weinheim</p>
            </div>
          </div>

          {/* Link Groups */}
          {footerGroups.map((group) => (
            <nav key={group.title} className="space-y-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p className="text-[12px] text-gray-400">
            © {new Date().getFullYear()} SBS Deutschland GmbH & Co. KG. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/datenschutz" className="text-[12px] text-gray-400 hover:text-gray-600">Datenschutz</Link>
            <Link href="/impressum" className="text-[12px] text-gray-400 hover:text-gray-600">Impressum</Link>
            <Link href="/avv" className="text-[12px] text-gray-400 hover:text-gray-600">AVV</Link>
            <Link href="/cookie-einstellungen" className="text-[12px] text-gray-400 hover:text-gray-600">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
