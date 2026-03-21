import Link from "next/link"

import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { EmptyState } from "@/components/marketing/empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { TableShell } from "@/components/marketing/table-shell"
import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_OBJECT_TYPE_OPTIONS,
  ACTIVITY_PERIOD_OPTIONS,
  type ActivityCategory,
  type ActivityObjectType,
  type ActivityPeriod,
  getTenantActivityCounts,
  listTenantActivities
} from "@/lib/audit/activity-worklist-core"
import { requireAdminAccess } from "@/lib/admin/guards"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"

const categoryTone: Record<string, "neutral" | "info" | "success" | "warning" | "risk"> = {
  Dokument: "info",
  Review: "warning",
  Freigabe: "success",
  Archivierung: "neutral",
  Richtlinie: "info",
  Admin: "neutral",
  Sicherheit: "risk",
  Aufbewahrung: "warning",
  Audit: "neutral",
  Verarbeitung: "info"
}

function parseCategory(value?: string): ActivityCategory {
  return ACTIVITY_CATEGORY_OPTIONS.find((option) => option === value) ?? "Alle"
}

function parsePeriod(value?: string): ActivityPeriod {
  return ACTIVITY_PERIOD_OPTIONS.find((option) => option === value) ?? "7d"
}

function parseObjectType(value?: string): ActivityObjectType {
  return ACTIVITY_OBJECT_TYPE_OPTIONS.find((option) => option === value) ?? "Alle"
}

export default async function ActivityWorklistPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const guard = await requireAdminAccess()

  if (!guard.ok) {
    return (
      <AdminEmptyState
        title="Aktivitäten"
        description={
          guard.status === 401
            ? "Diese Aktivitätsübersicht ist nur für berechtigte Nutzer im Tenant-Kontext verfügbar."
            : "Diese Aktivitätsübersicht ist nur für Tenant-Administratoren verfügbar."
        }
        backHref={guard.status === 401 ? "/login" : "/dashboard/audit"}
        backLabel={guard.status === 401 ? "Zur Anmeldung" : "Zurück zum Audit-Protokoll"}
      />
    )
  }

  const tenantContext = await resolveTenantContextForUser(guard.user.id)

  if (tenantContext.status !== "single") {
    return (
      <AdminEmptyState
        title="Aktivitäten"
        description={
          tenantContext.status === "none"
            ? "Für dieses Konto ist aktuell kein eindeutiger Mandantenkontext hinterlegt."
            : "Für diese Aktivitätsübersicht ist ein eindeutiger Mandantenkontext erforderlich."
        }
        backHref="/dashboard/audit"
        backLabel="Zurück zum Audit-Protokoll"
      />
    )
  }

  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>
  const category = parseCategory(typeof params.category === "string" ? params.category : undefined)
  const period = parsePeriod(typeof params.period === "string" ? params.period : undefined)
  const objectType = parseObjectType(typeof params.objectType === "string" ? params.objectType : undefined)

  const [activities, counts] = await Promise.all([
    listTenantActivities({ tenantId: tenantContext.tenantId, category, period, objectType }),
    getTenantActivityCounts(tenantContext.tenantId)
  ])

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Audit · Aktivitäten"
        title="Tenantbezogene Aktivitäten"
        description="Zentrale, lesende Arbeitsoberfläche für protokollierte Aktivitäten im Tenant. Die Ansicht bündelt Audit-nahe Vorgänge aus Dokumenten-, Review-, Richtlinien- und Admin-Kontexten."
      />

      <InfoPanel title="Einordnung" tone="muted">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label="Mandantengebundene Auswertung" tone="info" />
          <StatusBadge label="AuditEvent als Primärquelle" tone="success" />
          <StatusBadge label="Read-only Arbeitsliste" tone="neutral" />
        </div>
      </InfoPanel>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Aktivitäten gesamt</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Review & Freigabe</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.reviewOrApproval}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Richtlinie & Admin</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.policyOrAdminChanges}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Dokumentbezug</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.documentActivities}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Letzte 7 Tage</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.lastSevenDays}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <form className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm text-slate-600">Kategorie</span>
            <select name="category" defaultValue={category} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              {ACTIVITY_CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Zeitraum</span>
            <select name="period" defaultValue={period} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="24h">Letzte 24 Stunden</option>
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="all">Gesamter Zeitraum</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Objektart</span>
            <select name="objectType" defaultValue={objectType} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              {ACTIVITY_OBJECT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              Filter anwenden
            </button>
            <Link href="/dashboard/audit/aktivitaeten" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zurücksetzen
            </Link>
          </div>
        </form>
      </section>

      {!activities.length ? (
        <EmptyState
          title="Keine protokollierten Aktivitäten gefunden"
          description="Für den gewählten Zeitraum liegen derzeit keine protokollierten Aktivitäten vor. Passen Sie die Filter an oder wechseln Sie in Upload-, Review- oder Admin-Bereiche, um neue Vorgänge nachzuvollziehen."
          actionHref="/workspace/review-queue"
          actionLabel="Zur Review-Queue"
        />
      ) : (
        <TableShell
          title="Aktivitäts- und Audit-Arbeitsliste"
          description="Die Liste zeigt tenantbezogene Aktivitäten mit Objektbezug, Bearbeitungskontext und Einstieg in den jeweiligen Fachbereich."
        >
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3 font-semibold">Zeit</th>
                <th className="p-3 font-semibold">Aktivität</th>
                <th className="p-3 font-semibold">Kategorie</th>
                <th className="p-3 font-semibold">Objektart</th>
                <th className="p-3 font-semibold">Objektbezug</th>
                <th className="p-3 font-semibold">Akteur</th>
                <th className="p-3 font-semibold">Einstieg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="align-top hover:bg-slate-50/70">
                  <td className="whitespace-nowrap p-3 text-slate-700">{activity.occurredAt.toLocaleString("de-DE")}</td>
                  <td className="p-3">
                    <p className="font-medium text-slate-900">{activity.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{activity.context}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{activity.action}</p>
                  </td>
                  <td className="p-3">
                    <StatusBadge label={activity.category} tone={categoryTone[activity.category] ?? "neutral"} />
                  </td>
                  <td className="p-3 text-slate-700">{activity.objectType}</td>
                  <td className="p-3 text-slate-700">{activity.objectLabel}</td>
                  <td className="p-3 text-slate-700">{activity.actorLabel}</td>
                  <td className="p-3">
                    {activity.linkHref && activity.linkLabel ? (
                      <Link href={activity.linkHref} className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
                        {activity.linkLabel}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">Kein direkter Einstieg</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </main>
  )
}
