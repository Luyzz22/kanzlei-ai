import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { listTenantMembers } from "@/lib/admin/members-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MembersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const tenantContext = await resolveTenantContextForUser(session.user.id)
  if (tenantContext.status !== "single") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-[20px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
      </div>
    )
  }

  const members = await listTenantMembers(tenantContext.tenantId)

  const adminCount = members.filter((m) => m.tenantRole === "ADMIN").length

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">👥 Administration</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Team-Mitglieder</h1>
          <p className="mt-2 text-[14px] text-gray-500">Nutzer einladen, Rollen zuweisen und Zugriffsrechte verwalten.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{members.length}</p>
          <p className="text-[11px] text-gray-400">Aktive Nutzer</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{adminCount}</p>
          <p className="text-[11px] text-gray-400">Administratoren</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">0</p>
          <p className="text-[11px] text-gray-400">Ausstehende Einladungen</p>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_1fr_120px_100px]">
        <span>Name</span><span>E-Mail</span><span>Rolle</span><span>Status</span>
      </div>
      <div className="overflow-hidden rounded-b-xl border border-gray-200">
        {members.length === 0 ? (
          <div className="bg-white px-5 py-8 text-center text-[14px] text-gray-400">Noch keine Mitglieder.</div>
        ) : (
          members.map((m) => (
            <div key={m.membershipId} className="grid border-b border-gray-100 bg-white px-5 py-3.5 last:border-b-0 sm:grid-cols-[1fr_1fr_120px_100px] sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-700">
                  {(m.name ?? m.email).charAt(0).toUpperCase()}
                </div>
                <span className="text-[14px] font-medium text-gray-900">{m.name ?? "—"}</span>
              </div>
              <span className="mt-1 text-[13px] text-gray-500 sm:mt-0">{m.email}</span>
              <span className={`mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold sm:mt-0 ${m.tenantRole === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                {m.tenantRole}
              </span>
              <span className={`mt-1 text-[12px] sm:mt-0 ${m.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                {m.isActive ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Roles Info */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Rollen-Modell (RBAC)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { role: "Admin", emoji: "🔐", perms: "Voller Zugriff, Nutzerverwaltung, Einstellungen, Audit-Log" },
            { role: "Anwalt", emoji: "⚖️", perms: "Analyse, Copilot, Dokumente, Review, Export" },
            { role: "Assistent", emoji: "📋", perms: "Dokumente einsehen, Upload, eingeschraenkter Export" },
          ].map((r) => (
            <div key={r.role} className="rounded-lg border border-gray-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">{r.emoji}</span>
                <span className="text-[13px] font-semibold text-gray-900">{r.role}</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">{r.perms}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurück zur Verwaltung</Link>
      </div>
    </div>
  )
}
