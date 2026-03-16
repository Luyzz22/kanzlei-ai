import { Role, type TenantRole } from "@prisma/client"
import Link from "next/link"

import { listTenantMembers } from "@/lib/admin/members-core"
import { resolveSingleTenantIdForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"

const tenantRoleLabel: Record<TenantRole, string> = {
  OWNER: "Inhaber",
  ADMIN: "Administrator",
  MEMBER: "Mitglied"
}

const platformRoleLabel: Record<Role, string> = {
  ADMIN: "Administrator",
  ANWALT: "Anwalt",
  ASSISTENT: "Assistenz"
}

export default async function AdminMembersPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Mitglieder & Rollen</h1>
        <p className="text-sm text-muted-foreground">Bitte melden Sie sich an, um diesen Bereich zu öffnen.</p>
      </div>
    )
  }

  if (session.user.role !== Role.ADMIN) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Mitglieder & Rollen</h1>
        <p className="text-sm text-muted-foreground">
          Zugriff nur für Administratoren. Dieser Bereich enthält sicherheitsrelevante Tenant-Einstellungen.
        </p>
      </div>
    )
  }

  const tenantId = await resolveSingleTenantIdForUser(session.user.id)
  if (!tenantId) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Mitglieder & Rollen</h1>
        <p className="text-sm text-muted-foreground">
          Für Ihr Konto konnte kein eindeutiger Mandantenkontext ermittelt werden.
        </p>
      </div>
    )
  }

  const members = await listTenantMembers(tenantId)

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Mitglieder & Rollen</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Read-only Übersicht der aktuellen Tenant-Mitgliedschaften als Grundlage für nachfolgende
          Rollen- und Berechtigungsfreigaben.
        </p>
      </header>

      <section className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
        Änderungen an Rollen sind in diesem Schritt bewusst deaktiviert. Der nächste Ausbau führt
        freigabepflichtige Rollenänderungen mit Audit-Pflichtfeldern ein.
      </section>

      <section className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Tenant-Rolle</th>
              <th className="p-3">Plattform-Rolle</th>
              <th className="p-3">Status</th>
              <th className="p-3">Mitglied seit</th>
            </tr>
          </thead>
          <tbody>
            {members.length ? (
              members.map((member) => (
                <tr key={member.membershipId} className="border-b last:border-0">
                  <td className="p-3">{member.name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{member.email}</td>
                  <td className="p-3">{tenantRoleLabel[member.tenantRole]}</td>
                  <td className="p-3">{platformRoleLabel[member.platformRole]}</td>
                  <td className="p-3">{member.isActive ? "Aktiv" : "Deaktiviert"}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  Keine Mitgliedschaften vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div>
        <Link href="/dashboard/admin" className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-accent">
          Zurück zum Admin Center
        </Link>
      </div>
    </div>
  )
}
