import Link from "next/link"

const navItems = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/dashboard/mandate", label: "Mandate" },
  { href: "/dashboard/audit", label: "Audit Log" },
  { href: "/dashboard/admin", label: "Admin Center" }
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-65px)] md:grid-cols-[220px_1fr]">
      <aside className="border-r bg-muted/30 p-4">
        <p className="mb-4 text-sm font-semibold uppercase text-muted-foreground">KanzleiAI Dashboard</p>
        <nav className="space-y-2 text-sm">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 hover:bg-accent">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="p-6">{children}</section>
    </div>
  )
}
