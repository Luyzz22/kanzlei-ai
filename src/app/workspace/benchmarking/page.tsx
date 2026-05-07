import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { getVendorBenchmarks, getPortfolioStats } from "@/lib/documents/workspace-analytics"

export const dynamic = "force-dynamic"
export const revalidate = 0

const fmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit", month: "2-digit", year: "numeric"
})

function riskColor(score: number): string {
  if (score >= 0.7) return "text-red-700 bg-red-50 border-red-200"
  if (score >= 0.4) return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-emerald-700 bg-emerald-50 border-emerald-200"
}

function riskBarWidth(score: number): string {
  return `${Math.round(score * 100)}%`
}

export default async function BenchmarkingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") redirect("/workspace")

  const [vendors, stats] = await Promise.all([
    getVendorBenchmarks(ctx.tenantId),
    getPortfolioStats(ctx.tenantId)
  ])

  const hasData = vendors.length > 0

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link href="/workspace" className="text-sm text-stone-500 hover:text-[#003856] transition-colors">
            &larr; Workspace
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[#003856]">Lieferanten-Benchmarking</h1>
          <p className="mt-1 text-sm text-stone-500">
            Risikoverteilung und Vertragsqualität über alle analysierten Vertragspartner.
          </p>
        </div>

        {/* Portfolio KPIs */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Dokumente", value: stats.totalDocuments, sub: `${stats.analyzedDocuments} analysiert` },
            { label: "Vertragspartner", value: vendors.length, sub: null },
            { label: "\u00d8 Risiko", value: `${(stats.avgRiskScore * 100).toFixed(0)}%`, sub: null, color: stats.avgRiskScore >= 0.7 ? "text-red-600" : stats.avgRiskScore >= 0.4 ? "text-amber-600" : "text-emerald-600" },
            { label: "Hochrisiko", value: stats.highRiskCount, sub: "Verträge \u2265 70%", color: "text-red-600" }
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-stone-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{kpi.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${"color" in kpi && kpi.color ? kpi.color : "text-[#003856]"}`}>{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-stone-400">{kpi.sub}</p>}
            </div>
          ))}
        </div>

        {!hasData ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <span className="text-2xl">&#128202;</span>
            </div>
            <h2 className="text-lg font-medium text-[#003856]">Noch keine Analysedaten</h2>
            <p className="mt-2 text-sm text-stone-500">Laden Sie Verträge hoch und starten Sie eine Analyse, um das Benchmarking zu nutzen.</p>
            <Link href="/workspace/upload" className="mt-4 inline-block rounded-lg bg-[#003856] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#00263d]">
              Vertrag hochladen
            </Link>
          </div>
        ) : (
          <>
            {/* Vertragstyp-Verteilung */}
            {stats.contractTypeDistribution.length > 0 && (
              <div className="mb-8 rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">Vertragstyp-Verteilung</h2>
                <div className="flex flex-wrap gap-2">
                  {stats.contractTypeDistribution.map(({ type, count }) => (
                    <span key={type} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
                      {type} <span className="font-semibold text-[#003856]">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor-Ranking-Tabelle */}
            <div className="rounded-xl border border-stone-200 bg-white">
              <div className="border-b border-stone-100 px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Vertragspartner-Ranking nach Risiko</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-left text-xs font-medium uppercase tracking-wider text-stone-400">
                      <th className="px-6 py-3">Vertragspartner</th>
                      <th className="px-4 py-3 text-center">Verträge</th>
                      <th className="px-4 py-3">&Oslash; Risiko</th>
                      <th className="px-4 py-3 text-center">Findings</th>
                      <th className="px-4 py-3 text-center">Hoch</th>
                      <th className="px-4 py-3">Typen</th>
                      <th className="px-4 py-3">Letzte Analyse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {vendors.map((v, i) => (
                      <tr key={v.vendor} className={`transition-colors hover:bg-stone-50 ${i === 0 && v.avgRiskScore >= 0.7 ? "bg-red-50/30" : ""}`}>
                        <td className="px-6 py-4 font-medium text-[#003856]">{v.vendor}</td>
                        <td className="px-4 py-4 text-center font-medium text-stone-700">{v.contractCount}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-stone-100">
                              <div className={`h-full rounded-full ${v.avgRiskScore >= 0.7 ? "bg-red-500" : v.avgRiskScore >= 0.4 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: riskBarWidth(v.avgRiskScore) }} />
                            </div>
                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${riskColor(v.avgRiskScore)}`}>
                              {(v.avgRiskScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-stone-600">{v.totalFindings}</td>
                        <td className="px-4 py-4 text-center">
                          {v.highFindings > 0 ? (
                            <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">{v.highFindings}</span>
                          ) : (
                            <span className="text-stone-300">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {v.contractTypes.slice(0, 2).map(t => (
                              <span key={t} className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500">{t}</span>
                            ))}
                            {v.contractTypes.length > 2 && (
                              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-400">+{v.contractTypes.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-stone-400">
                          {v.lastAnalysisDate ? fmt.format(new Date(v.lastAnalysisDate)) : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-stone-100 px-6 py-3">
                <p className="text-xs text-stone-400">{vendors.length} Vertragspartner &middot; Sortiert nach durchschnittlichem Risiko-Score (absteigend)</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
