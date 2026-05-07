import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { getRadarMatches, getPortfolioStats } from "@/lib/documents/workspace-analytics"
import { REGULATION_WATCHLIST } from "@/lib/regulatory/watchlist"

export const dynamic = "force-dynamic"
export const revalidate = 0

const urgencyStyle: Record<string, { border: string; bg: string; text: string; label: string; dot: string }> = {
  kritisch: { border: "border-red-300", bg: "bg-red-50", text: "text-red-800", label: "Kritisch", dot: "bg-red-500" },
  hoch:     { border: "border-amber-300", bg: "bg-amber-50", text: "text-amber-800", label: "Hoch", dot: "bg-amber-500" },
  mittel:   { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", label: "Mittel", dot: "bg-blue-400" },
  niedrig:  { border: "border-stone-200", bg: "bg-stone-50", text: "text-stone-600", label: "Niedrig", dot: "bg-stone-400" }
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function deadlineLabel(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days < 0) return `seit ${Math.abs(days)} Tagen in Kraft`
  if (days === 0) return "Heute"
  if (days <= 30) return `in ${days} Tagen`
  if (days <= 365) return `in ${Math.round(days / 30)} Monaten`
  return `in ${(days / 365).toFixed(1)} Jahren`
}

export default async function VertragsradarPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") redirect("/workspace")

  const [matches, stats] = await Promise.all([
    getRadarMatches(ctx.tenantId),
    getPortfolioStats(ctx.tenantId)
  ])

  const unmatched = REGULATION_WATCHLIST.filter(
    reg => !matches.some(m => m.regulation.id === reg.id)
  )

  const totalAffected = matches.reduce((sum, m) => sum + m.affectedDocuments.length, 0)
  const criticalCount = matches.filter(m => m.urgency === "kritisch" || m.urgency === "hoch").length

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link href="/workspace" className="text-sm text-stone-500 hover:text-[#003856] transition-colors">
            &larr; Workspace
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[#003856]">Vertragsradar</h1>
          <p className="mt-1 text-sm text-stone-500">
            Regulatorisches Monitoring &mdash; automatischer Abgleich Ihres Vertragsportfolios mit aktuellen EU- und DE-Regulierungen.
          </p>
        </div>

        {/* Status-KPIs */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Regulierungen</p>
            <p className="mt-1 text-2xl font-semibold text-[#003856]">{REGULATION_WATCHLIST.length}</p>
            <p className="text-xs text-stone-400">auf der Watchlist</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Treffer</p>
            <p className="mt-1 text-2xl font-semibold text-[#003856]">{matches.length}</p>
            <p className="text-xs text-stone-400">betreffen Ihr Portfolio</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Betroffene Verträge</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">{totalAffected}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Dringend</p>
            <p className="mt-1 text-2xl font-semibold text-red-600">{criticalCount}</p>
            <p className="text-xs text-stone-400">kritisch / hoch</p>
          </div>
        </div>

        {/* Matches */}
        {matches.length === 0 && stats.analyzedDocuments === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <span className="text-2xl">&#128225;</span>
            </div>
            <h2 className="text-lg font-medium text-[#003856]">Radar aktiv &mdash; keine Verträge geladen</h2>
            <p className="mt-2 text-sm text-stone-500">Laden Sie Verträge hoch, um sie automatisch gegen {REGULATION_WATCHLIST.length} Regulierungen abzugleichen.</p>
            <Link href="/workspace/upload" className="mt-4 inline-block rounded-lg bg-[#003856] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#00263d]">
              Vertrag hochladen
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.length === 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-sm font-medium text-emerald-800">Keine regulatorischen Treffer &mdash; Ihr Portfolio ist derzeit nicht von ueberwachten Änderungen betroffen.</p>
              </div>
            )}

            {matches.map(match => {
              const style = urgencyStyle[match.urgency] ?? urgencyStyle.niedrig
              const reg = match.regulation

              return (
                <div key={reg.id} className={`rounded-xl border ${style.border} ${style.bg} p-6`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{reg.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-[#003856]">{reg.shortName}</h3>
                          <p className="text-xs text-stone-500">{reg.fullName}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-stone-600">{reg.description}</p>

                      {/* Betroffene Klauseln */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {reg.impactedClauses.map(clause => (
                          <span key={clause} className="rounded bg-white/60 px-2 py-0.5 text-xs text-stone-500 border border-stone-200">{clause}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.text} bg-white/80 border ${style.border}`}>
                        <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                      <p className="text-xs text-stone-500">{deadlineLabel(reg.enforcementDate)}</p>
                      <p className="text-xs text-stone-400">{reg.jurisdiction}</p>
                    </div>
                  </div>

                  {/* Betroffene Verträge */}
                  {match.affectedDocuments.length > 0 && (
                    <div className="mt-4 border-t border-stone-200/50 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                        {match.affectedDocuments.length} betroffene{match.affectedDocuments.length === 1 ? "r Vertrag" : " Verträge"}
                      </p>
                      <div className="space-y-1">
                        {match.affectedDocuments.slice(0, 5).map(doc => (
                          <Link key={doc.id} href={`/workspace/dokumente/${doc.id}`} className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2 text-sm transition-colors hover:bg-white/80">
                            <div className="flex items-center gap-2">
                              <span className="text-stone-400">&#128196;</span>
                              <span className="font-medium text-[#003856]">{doc.title}</span>
                              <span className="text-xs text-stone-400">{doc.organizationName}</span>
                            </div>
                            {doc.riskScore != null && (
                              <span className={`rounded px-2 py-0.5 text-xs font-medium ${doc.riskScore >= 0.7 ? "bg-red-100 text-red-700" : doc.riskScore >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {(doc.riskScore * 100).toFixed(0)}%
                              </span>
                            )}
                          </Link>
                        ))}
                        {match.affectedDocuments.length > 5 && (
                          <p className="px-3 text-xs text-stone-400">+ {match.affectedDocuments.length - 5} weitere</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Nicht betroffene Regulierungen */}
            {unmatched.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
                  Weitere ueberwachte Regulierungen (keine Treffer)
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {unmatched.map(reg => (
                    <div key={reg.id} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
                      <span>{reg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-600 truncate">{reg.shortName}</p>
                        <p className="text-xs text-stone-400">{reg.jurisdiction} &middot; {deadlineLabel(reg.enforcementDate)}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-600">&#10003;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-400">
            <span className="font-semibold">Hinweis:</span> Der Vertragsradar gleicht Ihr Portfolio automatisch gegen eine kuratierte Watchlist ab (Quellen: EUR-Lex, BGBl).
            Dies stellt keine Rechtsberatung dar. Die Ergebnisse dienen der Information und erfordern eine juristische Prüfung.
          </p>
        </div>
      </div>
    </div>
  )
}
