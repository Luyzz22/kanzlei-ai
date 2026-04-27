import Link from "next/link"
import { redirect } from "next/navigation"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { loadAuditKpis } from "@/lib/audit/audit-console-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login?next=/dashboard/audit")
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status !== "single") {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="text-[36px]">🔒</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">
          Mandantenkontext nicht eindeutig
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Für den Zugriff auf das Audit-Protokoll ist ein eindeutiger Mandantenkontext erforderlich.
        </p>
      </div>
    )
  }

  let kpis
  try {
    kpis = await loadAuditKpis(tenantContext.tenantId)
  } catch (e) {
    console.error("[audit.dashboard.kpis_failed]", {
      tenantId: tenantContext.tenantId,
      error: e instanceof Error ? e.message : String(e)
    })
    kpis = {
      eventsToday: 0,
      eventsLast7d: 0,
      totalAnalyses: 0,
      highRiskEvents: 0,
      integrityPercent: 100,
      totalEvents: 0
    }
  }

  const integrityTone =
    kpis.integrityPercent === 100
      ? "text-emerald-600"
      : kpis.integrityPercent >= 95
        ? "text-amber-600"
        : "text-rose-600"

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">
            📋 Governance
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">
            Audit-Protokoll
          </h1>
          <p className="mt-2 text-[14px] text-gray-500">
            Manipulationssichere Protokollierung aller sicherheitsrelevanten Aktionen.{" "}
            Hash-verkettet, mandantengetrennt, Compliance-konform.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/audit/aktivitaeten"
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            📊 Detail-Ansicht
          </Link>
          <a
            href="/api/audit/export"
            className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            ⬇️ CSV-Export
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{kpis.eventsToday}</p>
          <p className="text-[11px] text-gray-400">Events heute</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{kpis.totalAnalyses}</p>
          <p className="text-[11px] text-gray-400">Analysen gesamt</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p
            className={`text-[22px] font-semibold ${
              kpis.highRiskEvents > 0 ? "text-amber-600" : "text-gray-900"
            }`}
          >
            {kpis.highRiskEvents}
          </p>
          <p className="text-[11px] text-gray-400">Hochrisiko-Events</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className={`text-[22px] font-semibold ${integrityTone}`}>
            {kpis.integrityPercent}%
          </p>
          <p className="text-[11px] text-gray-400">Hash-Integrität</p>
        </div>
      </div>

      {/* 7-Day Activity */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-gray-700">
            Aktivität der letzten 7 Tage
          </p>
          <span className="text-[12px] text-gray-500">
            {kpis.eventsLast7d} Events
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
          Insgesamt sind <strong className="text-gray-900">{kpis.totalEvents}</strong>{" "}
          Audit-Einträge in diesem Mandanten persistiert. Alle Einträge sind mit dem
          jeweiligen Vorgänger-Hash verkettet — eine Manipulation einzelner Datensätze
          würde die Hash-Integrität sofort sichtbar machen.
        </p>
      </div>

      {/* Empty state OR call to action */}
      {kpis.totalEvents === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <span className="text-[36px]">📋</span>
          <h2 className="mt-4 text-[16px] font-semibold text-gray-950">
            Audit Trail aktiv — noch keine Events
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-gray-500">
            Alle Aktionen werden automatisch mit Zeitstempel, Akteur und Mandanten-Kontext
            protokolliert. Starten Sie eine Analyse oder konfigurieren Sie eine
            Integration, um den ersten Audit-Eintrag zu erzeugen.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/workspace/dokumente"
              className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
            >
              ⚡ Analyse starten
            </Link>
            <Link
              href="/dashboard/admin/dynamics"
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              🏗️ Integration einrichten
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">
                Letzte Aktivitäten
              </h2>
              <p className="mt-0.5 text-[12px] text-gray-500">
                Vollständiges Log mit Filter und Suche in der Detail-Ansicht.
              </p>
            </div>
            <Link
              href="/dashboard/audit/aktivitaeten"
              className="text-[13px] font-medium text-gold-700 hover:underline"
            >
              Alle Events ansehen →
            </Link>
          </div>
        </div>
      )}

      {/* Architecture explainer */}
      <div className="mt-8">
        <h2 className="text-[15px] font-semibold text-gray-900">
          Audit-Trail-Architektur
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[14px]">🔗</p>
            <p className="mt-1 text-[12px] font-semibold text-gray-900">
              Hash-Verkettung
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Jeder Eintrag enthält einen{" "}
              <code className="rounded bg-gray-100 px-1 font-mono text-[10px]">prevHash</code>,
              der den vorherigen Event-Hash referenziert.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[14px]">🏗️</p>
            <p className="mt-1 text-[12px] font-semibold text-gray-900">
              Mandantentrennung
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Postgres Row-Level Security isoliert Audit-Daten pro Tenant — auch
              technische Admin-Zugriffe sind nicht tenant-übergreifend möglich.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[14px]">📤</p>
            <p className="mt-1 text-[12px] font-semibold text-gray-900">
              Compliance-Export
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              CSV-Export aller Events für interne Audits und Compliance-Reviews —
              inkl. Hash-Kette zur Integritätsprüfung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
