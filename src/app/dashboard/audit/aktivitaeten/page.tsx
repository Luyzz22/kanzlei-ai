import Link from "next/link"
import { redirect } from "next/navigation"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import {
  listAuditEvents
} from "@/lib/audit/audit-console-core"
import { AUDIT_CATEGORIES, SEVERITY_TONE, type AuditCategory } from "@/lib/audit/registry"

export const dynamic = "force-dynamic"
export const revalidate = 0

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
})

type SearchParams = {
  cat?: string
  q?: string
  cursor?: string
}

function isValidCategory(v: string | undefined): v is AuditCategory | "alle" {
  if (!v) return true
  return AUDIT_CATEGORIES.some((c) => c.key === v)
}

export default async function AuditDetailPage({ searchParams }: { searchParams?: SearchParams }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login?next=/dashboard/audit/aktivitaeten")
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

  const category = isValidCategory(searchParams?.cat)
    ? (searchParams?.cat as AuditCategory | "alle" | undefined) ?? "alle"
    : "alle"
  const query = (searchParams?.q ?? "").trim().slice(0, 200)
  const cursor = searchParams?.cursor ?? null

  let listResult: Awaited<ReturnType<typeof listAuditEvents>>
  try {
    listResult = await listAuditEvents({
      tenantId: tenantContext.tenantId,
      category,
      query: query || undefined,
      cursor,
      limit: 50
    })
  } catch (e) {
    console.error("[audit.detail.list_failed]", {
      tenantId: tenantContext.tenantId,
      error: e instanceof Error ? e.message : String(e)
    })
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">⚠️</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">
          Audit-Liste konnte nicht geladen werden
        </h1>
        <Link
          href="/dashboard/audit"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Audit-Dashboard
        </Link>
      </div>
    )
  }

  const buildHref = (params: Partial<SearchParams>): string => {
    const sp = new URLSearchParams()
    const finalCat = params.cat ?? category
    const finalQ = params.q !== undefined ? params.q : query
    if (finalCat && finalCat !== "alle") sp.set("cat", finalCat)
    if (finalQ) sp.set("q", finalQ)
    if (params.cursor) sp.set("cursor", params.cursor)
    const qs = sp.toString()
    return qs ? `/dashboard/audit/aktivitaeten?${qs}` : "/dashboard/audit/aktivitaeten"
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">
            📋 Audit
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">
            Aktivitäten-Protokoll
          </h1>
          <p className="mt-2 text-[14px] text-gray-500">
            Chronologisches Log aller sicherheitsrelevanten Aktionen. Hash-verkettet,
            mandantengetrennt, nicht manipulierbar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/audit"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            ← Audit-Dashboard
          </Link>
          <a
            href="/api/audit/export"
            className="rounded-full bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            ⬇️ CSV-Export
          </a>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4">
        <form
          action="/dashboard/audit/aktivitaeten"
          method="get"
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <label className="sr-only" htmlFor="audit-search">
              Suche
            </label>
            <input
              id="audit-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Suche: Action, Actor (E-Mail), Ressource ..."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
          </div>
          {category !== "alle" ? (
            <input type="hidden" name="cat" value={category} />
          ) : null}
          <button
            type="submit"
            className="rounded-lg bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            🔍 Suchen
          </button>
          {(query || category !== "alle") && (
            <Link
              href="/dashboard/audit/aktivitaeten"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
            >
              ✕ Reset
            </Link>
          )}
        </form>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {AUDIT_CATEGORIES.map((c) => {
            const active = c.key === category
            return (
              <Link
                key={c.key}
                href={buildHref({ cat: c.key, cursor: undefined })}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-[#003856] text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {c.emoji} {c.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Result counter */}
      <p className="mt-4 text-[12px] text-gray-500">
        {listResult.events.length === 0
          ? "Keine Events für diese Filter."
          : `${listResult.events.length} Events angezeigt${listResult.hasMore ? " (mehr verfügbar)" : ""}`}
        {(query || category !== "alle") && (
          <span className="ml-2 text-gray-400">
            · Filter aktiv:{" "}
            {category !== "alle" && <code className="font-mono">{category}</code>}
            {query && (
              <code className="ml-1 font-mono">&quot;{query}&quot;</code>
            )}
          </span>
        )}
      </p>

      {/* Events List */}
      {listResult.events.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <span className="text-[28px]">📋</span>
          <h2 className="mt-3 text-[14px] font-semibold text-gray-900">
            Keine Events gefunden
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-gray-500">
            {query || category !== "alle"
              ? "Versuchen Sie andere Filter oder setzen Sie die Suche zurück."
              : "Bei der ersten Aktivität entstehen automatisch Audit-Einträge."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Zeit</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Akteur</th>
                <th className="px-4 py-3 text-left">Ressource</th>
                <th className="px-4 py-3 text-left">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {listResult.events.map((e) => {
                const tone = SEVERITY_TONE[e.severity]
                const actor = e.actor?.email ?? e.actor?.name ?? "System"
                return (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-gray-500">
                      {dateTimeFormatter.format(e.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <span className="text-[14px]">{e.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{e.label}</p>
                          <code className="mt-0.5 block truncate font-mono text-[10px] text-gray-400">
                            {e.action}
                          </code>
                          <span
                            className={`mt-1 inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider ${tone.bg} ${tone.text} ${tone.border}`}
                          >
                            {e.severity}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">
                      <span className="block truncate">{actor}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-gray-900">{e.resourceType}</p>
                      {e.resourceId && (
                        <code className="block truncate font-mono text-[10px] text-gray-400">
                          {e.resourceId.slice(0, 24)}
                          {e.resourceId.length > 24 ? "…" : ""}
                        </code>
                      )}
                      {e.documentId && (
                        <Link
                          href={`/workspace/dokumente/${e.documentId}`}
                          className="text-[10px] text-gold-700 hover:underline"
                        >
                          Dokument →
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {e.eventHash ? (
                        <code
                          title={`prevHash: ${e.prevHash ?? "—"}\neventHash: ${e.eventHash}`}
                          className="font-mono text-[10px] text-gray-500"
                        >
                          {e.eventHash.slice(0, 8)}…
                        </code>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {listResult.hasMore && listResult.nextCursor && (
        <div className="mt-6 flex justify-center">
          <Link
            href={buildHref({ cursor: listResult.nextCursor })}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            Weitere 50 Events laden →
          </Link>
        </div>
      )}

      {/* Compliance footer */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-[11px] leading-relaxed text-gray-500">
          <strong className="text-gray-700">Hash-Verkettung:</strong> Jeder Event hat
          einen <code className="rounded bg-white px-1 font-mono text-[10px]">eventHash</code>{" "}
          und referenziert den{" "}
          <code className="rounded bg-white px-1 font-mono text-[10px]">prevHash</code>{" "}
          des vorherigen Events. Eine Manipulation einzelner Datensätze ist erkennbar:
          das Audit-Dashboard zeigt die Integrität in Echtzeit.
        </p>
      </div>
    </div>
  )
}


