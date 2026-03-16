import Link from "next/link"

const footerGroups = [
  {
    title: "Produkt",
    links: [
      { label: "Produkt", href: "/produkt" },
      { label: "Integrationen", href: "/integrationen" },
      { label: "Preise", href: "/preise" }
    ]
  },
  {
    title: "Trust & Compliance",
    links: [
      { label: "Trust Center", href: "/trust-center" },
      { label: "Sicherheit & Compliance", href: "/sicherheit-compliance" },
      { label: "KI-Transparenz", href: "/ki-transparenz" }
    ]
  },
  {
    title: "Hilfe & Betrieb",
    links: [
      { label: "Hilfe", href: "/hilfe" },
      { label: "Support", href: "/support" },
      { label: "Systemstatus", href: "/systemstatus" },
      { label: "Release Notes", href: "/release-notes" }
    ]
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "Impressum", href: "/impressum" },
      { label: "AVV", href: "/avv" }
    ]
  }
]

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="space-y-3 lg:col-span-1">
          <p className="text-sm font-semibold text-white">KanzleiAI</p>
          <p className="text-sm leading-relaxed text-slate-400">Plattform für strukturierte Dokumentenprüfung, Review und Nachweise im juristischen Arbeitskontext.</p>
        </div>
        {footerGroups.map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">{group.title}</h2>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} KanzleiAI</p>
          <p>Dokumente · Review · Freigabe · Audit · Governance</p>
        </div>
      </div>
    </footer>
  )
}
