"use client"

import { useEffect, useState, useCallback } from "react"

/* ================================================================ */
/* TYPES                                                            */
/* ================================================================ */

type EvalData = {
  totalRuns: number
  completedRuns: number
  totalFindings: number
  totalReviews: number
  overrideRate: number | null
  drift: {
    recentOverrideRate: number | null
    previousOverrideRate: number | null
    delta: number | null
    alert: boolean
  }
  decisions: { akzeptiert: number; abgelehnt: number; angepasst: number; kenntnisgenommen: number }
  confidenceCalibration: Array<{ range: string; total: number; acceptanceRate: number | null }>
  qualityByContractType: Array<{
    type: string; overrideRate: number | null; reviewed: number
    avgConfidence: number | null; avgCost: number | null; avgLatencyMs: number | null
  }>
  providers: Array<{
    model: string | null; runs: number; avgConfidence: number | null
    avgCostEur: number | null; avgLatencyMs: number | null; avgTokens: number | null
  }>
  promptVersions: Array<{ version: string; runs: number; avgConfidence: number | null; avgRiskScore: number | null }>
  timeline: Array<{
    date: string | null; confidence: number | null; riskScore: number | null
    cost: number | null; latencyMs: number | null; model: string | null
    findingsTotal: number; findingsReviewed: number; findingsOverridden: number
  }>
}

/* ================================================================ */
/* HELPER COMPONENTS                                                */
/* ================================================================ */

function KpiCard({ title, value, subtitle, trend, alert }: {
  title: string; value: string | number; subtitle?: string; trend?: string; alert?: boolean
}) {
  return (
    <div className={`rounded-xl border p-5 ${alert ? "border-rose-200 bg-rose-50/50" : "border-slate-200 bg-white"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? "text-rose-700" : "text-[#003856]"}`}>{value}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      {trend && (
        <p className={`mt-1 text-[11px] font-medium ${trend.startsWith("+") && parseFloat(trend) > 0 ? "text-rose-600" : trend.startsWith("-") ? "text-emerald-600" : "text-slate-500"}`}>
          {trend}
        </p>
      )}
    </div>
  )
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      <span className="text-base">{icon}</span>
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#003856]">{title}</h2>
    </div>
  )
}

function HorizontalBar({ label, value, max, color, suffix }: {
  label: string; value: number; max: number; color: string; suffix?: string
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-[140px] shrink-0 truncate text-[12px] text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-[60px] shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-600">
        {value}{suffix ?? ""}
      </span>
    </div>
  )
}

function DecisionDonut({ decisions }: { decisions: EvalData["decisions"] }) {
  const total = decisions.akzeptiert + decisions.abgelehnt + decisions.angepasst + decisions.kenntnisgenommen
  if (total === 0) return <p className="text-[12px] text-slate-400">Noch keine Reviews</p>
  const items = [
    { label: "Akzeptiert", count: decisions.akzeptiert, color: "bg-emerald-500", ring: "#10b981" },
    { label: "Kenntnisgenommen", count: decisions.kenntnisgenommen, color: "bg-blue-400", ring: "#60a5fa" },
    { label: "Angepasst", count: decisions.angepasst, color: "bg-amber-500", ring: "#f59e0b" },
    { label: "Abgelehnt", count: decisions.abgelehnt, color: "bg-rose-500", ring: "#ef4444" }
  ]
  // Conic gradient donut
  let cumulative = 0
  const segments = items.map(item => {
    const start = cumulative
    const pct = (item.count / total) * 100
    cumulative += pct
    return { ...item, start, pct }
  })
  const conicGradient = segments
    .map(s => `${s.ring} ${s.start}% ${s.start + s.pct}%`)
    .join(", ")

  return (
    <div className="flex items-center gap-6">
      <div
        className="h-[100px] w-[100px] shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${conicGradient})`,
          mask: "radial-gradient(farthest-side, transparent 55%, black 56%)",
          WebkitMask: "radial-gradient(farthest-side, transparent 55%, black 56%)"
        }}
      />
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            <span className="text-[12px] text-slate-600">{item.label}</span>
            <span className="text-[11px] font-semibold tabular-nums text-slate-800">
              {item.count} ({Math.round((item.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniSparkline({ values, color }: { values: (number | null)[]; color: string }) {
  const filtered = values.filter((v): v is number => v != null)
  if (filtered.length < 2) return null
  const min = Math.min(...filtered)
  const max = Math.max(...filtered)
  const range = max - min || 1
  const w = 120
  const h = 32
  const points = filtered.map((v, i) => {
    const x = (i / (filtered.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  )
}

/* ================================================================ */
/* MAIN PAGE                                                        */
/* ================================================================ */

export default function EvalDashboardPage() {
  const [data, setData] = useState<EvalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/eval-dashboard")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#003856]" />
          <p className="mt-3 text-[13px] text-slate-500">Eval-Metriken werden geladen…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-[13px] font-medium text-rose-700">Fehler: {error ?? "Keine Daten"}</p>
          <button onClick={fetchData} className="mt-3 rounded-lg bg-[#003856] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#003856]/90">
            Erneut laden
          </button>
        </div>
      </div>
    )
  }

  const passRate = data.overrideRate != null ? Math.round((100 - data.overrideRate) * 10) / 10 : null
  const avgConf = data.timeline.length > 0
    ? Math.round((data.timeline.filter(t => t.confidence != null).reduce((s, t) => s + (t.confidence ?? 0), 0) / Math.max(data.timeline.filter(t => t.confidence != null).length, 1)) * 100)
    : null

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#003856]">Continuous Eval Dashboard</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Qualitätsmonitoring · Override-Erkennung · Drift Detection
          </p>
        </div>
        <button onClick={fetchData} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
          ↻ Aktualisieren
        </button>
      </div>

      {/* Drift Alert */}
      {data.drift.alert && (
        <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-50/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🚨</span>
            <div>
              <p className="text-[13px] font-bold text-rose-800">Drift Alert — Override-Rate gestiegen</p>
              <p className="mt-0.5 text-[12px] text-rose-600">
                Override-Rate letzte 30 Tage: {data.drift.recentOverrideRate}% (vorher: {data.drift.previousOverrideRate}%) — Delta: +{data.drift.delta}pp
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          title="Analysen"
          value={data.completedRuns}
          subtitle={`von ${data.totalRuns} gestartet`}
        />
        <KpiCard
          title="Pass Rate"
          value={passRate != null ? `${passRate}%` : "—"}
          subtitle="Findings ohne Override"
          alert={passRate != null && passRate < 80}
        />
        <KpiCard
          title="Override-Rate"
          value={data.overrideRate != null ? `${data.overrideRate}%` : "—"}
          subtitle={`${data.totalReviews} Reviews gesamt`}
          trend={data.drift.delta != null ? `${data.drift.delta > 0 ? "+" : ""}${data.drift.delta}pp vs. Vormonat` : undefined}
          alert={data.overrideRate != null && data.overrideRate > 20}
        />
        <KpiCard
          title="Ø Konfidenz"
          value={avgConf != null ? `${avgConf}%` : "—"}
          subtitle="Letzte 50 Analysen"
        />
      </div>

      {/* Row: Decisions + Confidence Calibration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Decision Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader title="Review-Entscheidungen" icon="📊" />
          <div className="mt-4">
            <DecisionDonut decisions={data.decisions} />
          </div>
        </div>

        {/* Confidence Calibration */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader title="Konfidenz-Kalibrierung" icon="🎯" />
          <p className="mt-2 text-[11px] text-slate-400">
            Werden High-Confidence-Findings häufiger akzeptiert? (Ideal: monoton steigend)
          </p>
          <div className="mt-3 space-y-2.5">
            {data.confidenceCalibration.map(b => (
              <HorizontalBar
                key={b.range}
                label={`Konfidenz ${b.range}`}
                value={b.acceptanceRate ?? 0}
                max={100}
                color={b.acceptanceRate != null && b.acceptanceRate >= 70 ? "bg-emerald-500" : b.acceptanceRate != null && b.acceptanceRate >= 40 ? "bg-amber-500" : "bg-rose-500"}
                suffix="%"
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Akzeptanz = AKZEPTIERT + KENNTNISGENOMMEN · n = {data.confidenceCalibration.reduce((s, b) => s + b.total, 0)} Findings
          </p>
        </div>
      </div>

      {/* Quality by Contract Type */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionHeader title="Qualität nach Vertragstyp" icon="📋" />
        {data.qualityByContractType.length === 0 ? (
          <p className="mt-4 text-[12px] text-slate-400">Noch keine klassifizierten Analysen</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 pr-4">Vertragstyp</th>
                  <th className="pb-2 pr-4 text-right">Reviewed</th>
                  <th className="pb-2 pr-4 text-right">Override-Rate</th>
                  <th className="pb-2 pr-4 text-right">Ø Konfidenz</th>
                  <th className="pb-2 pr-4 text-right">Ø Kosten</th>
                  <th className="pb-2 text-right">Ø Latenz</th>
                </tr>
              </thead>
              <tbody>
                {data.qualityByContractType.map(ct => (
                  <tr key={ct.type} className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-medium text-slate-700">{ct.type}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-slate-600">{ct.reviewed}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      <span className={ct.overrideRate != null && ct.overrideRate > 20 ? "font-semibold text-rose-600" : "text-slate-600"}>
                        {ct.overrideRate != null ? `${ct.overrideRate}%` : "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-slate-600">{ct.avgConfidence ?? "—"}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-slate-600">{ct.avgCost != null ? `€${ct.avgCost}` : "—"}</td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{ct.avgLatencyMs != null ? `${(ct.avgLatencyMs / 1000).toFixed(1)}s` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row: Provider Comparison + Prompt Versions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Provider */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader title="Provider-Vergleich" icon="🤖" />
          {data.providers.length === 0 ? (
            <p className="mt-4 text-[12px] text-slate-400">Keine Daten</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.providers.map(p => (
                <div key={p.model ?? "unknown"} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-700">{p.model ?? "Unbekannt"}</span>
                    <span className="rounded-full bg-[#003856]/10 px-2 py-0.5 text-[10px] font-medium text-[#003856]">{p.runs} Runs</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
                    <span>Konfidenz: <b className="text-slate-700">{p.avgConfidence ?? "—"}</b></span>
                    <span>Kosten: <b className="text-slate-700">{p.avgCostEur != null ? `€${p.avgCostEur}` : "—"}</b></span>
                    <span>Latenz: <b className="text-slate-700">{p.avgLatencyMs != null ? `${(p.avgLatencyMs / 1000).toFixed(1)}s` : "—"}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prompt Versions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader title="Prompt-Versionen" icon="📝" />
          {data.promptVersions.length === 0 ? (
            <p className="mt-4 text-[12px] text-slate-400">Keine Daten</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.promptVersions.map((v, i) => (
                <div key={v.version} className={`rounded-lg border p-3 ${i === 0 ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-700">v{v.version}</span>
                      {i === 0 && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">Aktuell</span>}
                    </div>
                    <span className="text-[11px] tabular-nums text-slate-500">{v.runs} Runs</span>
                  </div>
                  <div className="mt-1.5 flex gap-4 text-[11px] text-slate-500">
                    <span>Ø Konfidenz: <b className="text-slate-700">{v.avgConfidence ?? "—"}</b></span>
                    <span>Ø Risiko: <b className="text-slate-700">{v.avgRiskScore ?? "—"}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline / Trend */}
      {data.timeline.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader title="Qualitätstrend (letzte 50 Analysen)" icon="📈" />
          <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Konfidenz</p>
              <MiniSparkline values={data.timeline.map(t => t.confidence)} color="#003856" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Risiko-Score</p>
              <MiniSparkline values={data.timeline.map(t => t.riskScore)} color="#ef4444" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kosten (€)</p>
              <MiniSparkline values={data.timeline.map(t => t.cost)} color="#f59e0b" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Latenz (ms)</p>
              <MiniSparkline values={data.timeline.map(t => t.latencyMs)} color="#6366f1" />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-[10px] text-slate-300">
        KanzleiAI Continuous Eval · Phase 2A · Prompt v2026-05-16
      </p>
    </div>
  )
}
