import Link from "next/link"

const navItems = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/dashboard/mandate", label: "Mandate" },
  { href: "/dashboard/audit", label: "Audit-Protokoll" },
  { href: "/dashboard/admin", label: "Administration" }
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-65px)] w-full max-w-7xl gap-0 px-4 py-6 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
      <aside className="rounded-l-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Governance Control Plane</p>
        <nav className="space-y-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md border border-transparent px-3 py-2 text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="rounded-r-2xl border-y border-r border-slate-200 bg-white p-6">{children}</section>
    </div>
  )
}
