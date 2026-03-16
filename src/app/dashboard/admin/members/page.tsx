import { Role, type TenantRole } from "@prisma/client"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { CtaPanel } from "@/components/marketing/cta-panel"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { requireAdminAccess } from "@/lib/admin/guards"
import { listTenantMembers } from "@/lib/admin/members-core"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"

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
  const guard = await requireAdminAccess()

  if (!guard.ok) {
    return (
      <AdminEmptyState
        title="Mitglieder & Rollen"
        description={
          guard.status === 401
            ? "Bitte melden Sie sich an, um diese Governance-Ansicht zu öffnen."
            : "Zugriff nur für Administratoren. Dieser Bereich enthält mandantenbezogene Rollen- und Berechtigungsinformationen."
        }
        backHref={guard.status === 401 ? "/login" : "/dashboard/admin"}
        backLabel={guard.status === 401 ? "Zur Anmeldung" : "Zurück zum Admin Center"}
      />
    )
  }

  const tenantContext = await resolveTenantContextForUser(guard.user.id)

  if (tenantContext.status === "none") {
    return (
      <AdminEmptyState
        title="Mitglieder & Rollen"
        description="Für dieses Konto ist aktuell kein Mandantenkontext hinterlegt. Bitte prüfen Sie die Tenant-Zuordnung in der Administration."
      />
    )
  }

  if (tenantContext.status === "multiple") {
    return (
      <AdminEmptyState
        title="Mitglieder & Rollen"
        description="Für diese Ansicht ist ein eindeutiger Mandantenkontext erforderlich. Die gesteuerte Tenant-Auswahl wird in einem folgenden Ausbaupaket bereitgestellt."
      />
    )
  }

  const members = await listTenantMembers(tenantContext.tenantId)

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · Rollen & Berechtigungen"
        title="Mitglieder & Rollen"
        description="Read-only Übersicht aller Tenant-Mitgliedschaften als Grundlage für spätere Rollenänderungen, Freigaben und revisionsnahe Nachvollziehbarkeit."
      />

      <InfoPanel title="Ausbaustand" tone="muted">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label="Read-only aktiv" tone="info" />
          <StatusBadge label="Rollenänderung in Vorbereitung" tone="warning" />
        </div>
        <p className="mt-3">
          Schreibende Änderungen sind in diesem Schritt bewusst deaktiviert. In Folge-PRs werden Freigabepfade,
          Pflichtbegründungen und Audit-Felder für Rollenänderungen ergänzt.
        </p>
      </InfoPanel>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">E-Mail</th>
                <th className="p-3 font-semibold">Tenant-Rolle</th>
                <th className="p-3 font-semibold">Plattform-Rolle</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Mitglied seit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.length ? (
                members.map((member) => (
                  <tr key={member.membershipId} className="hover:bg-slate-50/70">
                    <td className="p-3 text-slate-900">{member.name ?? "-"}</td>
                    <td className="p-3 text-slate-600">{member.email}</td>
                    <td className="p-3 text-slate-700">{tenantRoleLabel[member.tenantRole]}</td>
                    <td className="p-3 text-slate-700">{platformRoleLabel[member.platformRole]}</td>
                    <td className="p-3">
                      <StatusBadge label={member.isActive ? "Aktiv" : "Deaktiviert"} tone={member.isActive ? "success" : "neutral"} />
                    </td>
                    <td className="p-3 text-slate-600">{new Date(member.joinedAt).toLocaleDateString("de-DE")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 text-slate-600" colSpan={6}>
                    Keine Mitgliedschaften vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CtaPanel
        title="Nächster Governance-Schritt"
        description="Als nächstes folgen freigabepflichtige Rollenänderungen mit Vier-Augen-Prinzip, Begründungspflicht und nachvollziehbarer Änderungsdokumentation."
        primaryLabel="Zurück zum Admin Center"
        primaryHref="/dashboard/admin"
        secondaryLabel="Audit-Protokoll öffnen"
        secondaryHref="/dashboard/audit"
        variant="default"
      />
    </main>
  )
}
