import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-100">
          <span className="text-[28px]">🔍</span>
        </div>
        <h1 className="mt-5 text-[1.5rem] font-semibold text-gray-950">Seite nicht gefunden</h1>
        <p className="mt-2 text-[14px] text-gray-500">Die angeforderte Seite existiert nicht oder wurde verschoben.</p>

        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          {[
            { emoji: "🏠", label: "Startseite", href: "/" },
            { emoji: "⚡", label: "Schnellanalyse", href: "/workspace/analyse" },
            { emoji: "📊", label: "Dashboard", href: "/dashboard" },
            { emoji: "📖", label: "Hilfe-Center", href: "/hilfe" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-medium text-gray-700 transition-colors hover:border-gold-300 hover:bg-gold-50">
              <span>{link.emoji}</span> {link.label}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-[12px] text-gray-400">Fehler melden: <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link></p>
      </div>
    </main>
  )
}
