"use client"

import { useEffect, useState, useCallback } from "react"

/* ================================================================ */
/* TYPES                                                            */
/* ================================================================ */

type PlaybookRule = {
  category: string
  pattern: "AUTO_ACCEPT" | "ALWAYS_REJECT" | "PREFERRED_REVISION" | "NEEDS_REVIEW" | "INCONSISTENT"
  confidence: number
  description: string
  stats: {
    total: number; accepted: number; rejected: number; adjusted: number; noted: number
    acceptanceRate: number; overrideRate: number; dominantSeverity: string; avgConfidence: number | null
  }
  preferredRevision: string | null
  exampleTitles: string[]
  reviewers: string[]
}

type PlaybookData = {
  summary: {
    totalReviewedFindings: number; totalCategories: number; categoriesWithPattern: number
    autoAcceptable: number; alwaysReject: number; withPreferredRevision: number; minSamplesRequired: number
  }
  rules: PlaybookRule[]
}

/* ================================================================ */
/* PATTERN STYLING                                                  */
/* ================================================================ */

const patternConfig: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  AUTO_ACCEPT: { label: "Auto-Accept", emoji: "✅", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  ALWAYS_REJECT: { label: "Immer prüfen", emoji: "🚫", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  PREFERRED_REVISION: { label: "Bevorzugte Formulierung", emoji: "✏️", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  NEEDS_REVIEW: { label: "Review empfohlen", emoji: "👀", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  INCONSISTENT: { label: "Inkonsistent", emoji: "⚠️", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" }
}

/* ================================================================ */
/* MAIN PAGE                                                        */
/* ================================================================ */

export default function PlaybooksPage() {
  const [data, setData] = useState<PlaybookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [filterPattern, setFilterPattern] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/playbook-miner")
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
          <p className="mt-3 text-[13px] text-slate-500">Review-Historie wird analysiert…</p>
          <p className="mt-1 text-[11px] text-slate-400">Patterns aus Ihren Entscheidungen werden erkannt</p>
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

  const filteredRules = filterPattern
    ? data.rules.filter(r => r.pattern === filterPattern)
    : data.rules

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#003856]">Playbook Miner</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Automatische Klausel-Policies aus Ihrer Review-Historie
          </p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          ↻ Neu analysieren
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reviewed Findings</p>
          <p className="mt-1 text-xl font-bold text-[#003856]">{data.summary.totalReviewedFindings}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kategorien</p>
          <p className="mt-1 text-xl font-bold text-slate-700">{data.summary.totalCategories}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Regeln erkannt</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{data.summary.categoriesWithPattern}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Auto-Accept</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{data.summary.autoAcceptable}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Immer prüfen</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{data.summary.alwaysReject}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Mit Vorlage</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{data.summary.withPreferredRevision}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterPattern(null)}
          className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${!filterPattern ? "bg-[#003856] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          Alle ({data.rules.length})
        </button>
        {Object.entries(patternConfig).map(([key, cfg]) => {
          const count = data.rules.filter(r => r.pattern === key).length
          if (count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilterPattern(filterPattern === key ? null : key)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${filterPattern === key ? `${cfg.bg} ${cfg.text} ${cfg.border} border` : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {cfg.emoji} {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {data.rules.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-[40px]">🔍</p>
          <p className="mt-3 text-[15px] font-medium text-slate-700">Noch keine Patterns erkannt</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Der Playbook Miner benötigt mindestens {data.summary.minSamplesRequired} Review-Entscheidungen pro Kategorie.
            Analysieren und reviewen Sie weitere Verträge, um Patterns zu erkennen.
          </p>
        </div>
      )}

      {/* Rules */}
      <div className="space-y-3">
        {filteredRules.map((rule) => {
          const cfg = patternConfig[rule.pattern] ?? patternConfig.INCONSISTENT
          const isExpanded = expandedRule === rule.category

          return (
            <div
              key={rule.category}
              className={`rounded-xl border bg-white transition-all ${cfg.border}`}
            >
              {/* Rule Header */}
              <button
                type="button"
                onClick={() => setExpandedRule(isExpanded ? null : rule.category)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="text-lg">{cfg.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-slate-800">{rule.category}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-slate-500">{rule.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Konfidenz</p>
                    <p className="text-[14px] font-bold tabular-nums text-slate-700">{Math.round(rule.confidence * 100)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Samples</p>
                    <p className="text-[14px] font-bold tabular-nums text-slate-700">{rule.stats.total}</p>
                  </div>
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Akzeptiert</p>
                      <p className="text-[16px] font-bold text-emerald-600">{rule.stats.accepted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Abgelehnt</p>
                      <p className="text-[16px] font-bold text-rose-600">{rule.stats.rejected}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Angepasst</p>
                      <p className="text-[16px] font-bold text-amber-600">{rule.stats.adjusted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Kenntnisgenommen</p>
                      <p className="text-[16px] font-bold text-blue-600">{rule.stats.noted}</p>
                    </div>
                  </div>

                  {/* Decision Bar */}
                  <div className="mt-4">
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      {rule.stats.accepted > 0 && (
                        <div className="bg-emerald-500" style={{ width: `${(rule.stats.accepted / rule.stats.total) * 100}%` }} />
                      )}
                      {rule.stats.noted > 0 && (
                        <div className="bg-blue-400" style={{ width: `${(rule.stats.noted / rule.stats.total) * 100}%` }} />
                      )}
                      {rule.stats.adjusted > 0 && (
                        <div className="bg-amber-500" style={{ width: `${(rule.stats.adjusted / rule.stats.total) * 100}%` }} />
                      )}
                      {rule.stats.rejected > 0 && (
                        <div className="bg-rose-500" style={{ width: `${(rule.stats.rejected / rule.stats.total) * 100}%` }} />
                      )}
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>Akzeptanz: {rule.stats.acceptanceRate}%</span>
                      <span>Override: {rule.stats.overrideRate}%</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-slate-500">
                    <span>Dominante Severity: <b className="text-slate-700">{rule.stats.dominantSeverity}</b></span>
                    {rule.stats.avgConfidence != null && (
                      <span>Ø KI-Konfidenz: <b className="text-slate-700">{Math.round(rule.stats.avgConfidence * 100)}%</b></span>
                    )}
                    {rule.reviewers.length > 0 && (
                      <span>Reviewer: <b className="text-slate-700">{rule.reviewers.join(", ")}</b></span>
                    )}
                  </div>

                  {/* Example Titles */}
                  {rule.exampleTitles.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Beispiel-Findings</p>
                      <div className="mt-1 space-y-1">
                        {rule.exampleTitles.map((t, i) => (
                          <p key={i} className="text-[12px] text-slate-600">• {t}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Revision */}
                  {rule.preferredRevision && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                        Erkannte Standardformulierung
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-blue-900">
                        {rule.preferredRevision}
                      </p>
                    </div>
                  )}

                  {/* Action Hint */}
                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <p className="text-[11px] text-slate-500">
                      {rule.pattern === "AUTO_ACCEPT" && "💡 Diese Kategorie kann in einer zukünftigen Version automatisch akzeptiert werden, um Review-Zeit zu sparen."}
                      {rule.pattern === "ALWAYS_REJECT" && "💡 Prüfen Sie, ob der KI-Prompt für diese Kategorie verbessert werden sollte, oder definieren Sie eine Standardformulierung."}
                      {rule.pattern === "PREFERRED_REVISION" && "💡 Die erkannte Standardformulierung kann als Default-Revision für neue Analysen verwendet werden."}
                      {rule.pattern === "NEEDS_REVIEW" && "💡 Gemischte Entscheidungen deuten auf kontextabhängige Bewertung hin — weiterhin individuelle Prüfung empfohlen."}
                      {rule.pattern === "INCONSISTENT" && "💡 Klären Sie intern den Standard für diese Kategorie, um konsistentere Reviews zu erreichen."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-slate-300">
        Playbook Miner Alpha · Min. {data.summary.minSamplesRequired} Samples pro Kategorie · Patterns aus {data.summary.totalReviewedFindings} Reviews
      </p>
    </div>
  )
}
