"use client"

import { useState, useCallback } from "react"

type SimilarityResult = {
  id: string; similarityScore: number; matchedKeywords: string[]
  category: string; title: string; description: string
  severity: string; confidence: number | null; clauseRef: string | null
  suggestedRevision: string | null; contractType: string | null
  documentName: string | null; documentId: string | null; createdAt: string
  review: { decision: string; comment: string | null; modifiedRevision: string | null; reviewer: string | null; date: string } | null
}

const severityColor: Record<string, string> = {
  HOCH: "bg-rose-100 text-rose-700", MITTEL: "bg-amber-100 text-amber-700", NIEDRIG: "bg-emerald-100 text-emerald-700"
}
const decisionColor: Record<string, string> = {
  AKZEPTIERT: "text-emerald-700", ABGELEHNT: "text-rose-700", ANGEPASST: "text-amber-700", KENNTNISGENOMMEN: "text-blue-700"
}

export default function SimilarityPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SimilarityResult[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const search = useCallback(async () => {
    if (query.length < 3) return
    setLoading(true)
    try {
      const res = await fetch("/api/similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 15 })
      })
      const data = await res.json()
      setResults(data.results ?? [])
      setKeywords(data.keywords ?? [])
      setSearched(true)
    } catch { setResults([]); setSearched(true) }
    finally { setLoading(false) }
  }, [query])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-xl font-bold text-[#003856]">Präzedenz-Suche</h1>
        <p className="mt-1 text-[13px] text-slate-500">Finden Sie ähnliche Klauseln und vergangene Review-Entscheidungen</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Klausel-Text, Kategorie oder Beschreibung eingeben…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 focus:border-[#003856] focus:outline-none focus:ring-1 focus:ring-[#003856]"
        />
        <button
          onClick={search}
          disabled={query.length < 3 || loading}
          className="shrink-0 rounded-xl bg-[#003856] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#003856]/90 disabled:opacity-40"
        >
          {loading ? "Suche…" : "🔍 Suchen"}
        </button>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-400 self-center mr-1">Keywords:</span>
          {keywords.map(kw => (
            <span key={kw} className="rounded-full bg-[#003856]/10 px-2 py-0.5 text-[10px] font-medium text-[#003856]">{kw}</span>
          ))}
        </div>
      )}

      {/* Empty */}
      {searched && results.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-[40px]">🔍</p>
          <p className="mt-3 text-[14px] font-medium text-slate-700">Keine ähnlichen Findings gefunden</p>
          <p className="mt-1 text-[12px] text-slate-500">Versuchen Sie andere Suchbegriffe oder analysieren Sie mehr Verträge</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map(r => {
          const isExpanded = expandedId === r.id
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {/* Score */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${r.similarityScore >= 70 ? "bg-emerald-100 text-emerald-700" : r.similarityScore >= 40 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {r.similarityScore}%
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-800 truncate">{r.title}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${severityColor[r.severity] ?? "bg-slate-100 text-slate-600"}`}>{r.severity}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">{r.category} · {r.documentName ?? "Unbekannt"} · {r.contractType ?? ""}</p>
                </div>

                {/* Review decision */}
                {r.review && (
                  <span className={`shrink-0 text-[11px] font-semibold ${decisionColor[r.review.decision] ?? "text-slate-600"}`}>
                    {r.review.decision}
                  </span>
                )}

                <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                  <p className="text-[12px] leading-relaxed text-slate-600">{r.description}</p>

                  {r.clauseRef && (
                    <p className="text-[11px] text-slate-500">Klauselreferenz: <b className="text-slate-700">{r.clauseRef}</b></p>
                  )}

                  {r.suggestedRevision && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
                      <p className="text-[10px] font-semibold uppercase text-emerald-700">KI-Formulierungsvorschlag</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-emerald-900">{r.suggestedRevision}</p>
                    </div>
                  )}

                  {r.review && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${decisionColor[r.review.decision] ?? ""}`}>{r.review.decision}</span>
                        {r.review.reviewer && <span className="text-[10px] text-slate-400">von {r.review.reviewer}</span>}
                        <span className="text-[10px] text-slate-400">{new Date(r.review.date).toLocaleDateString("de-DE")}</span>
                      </div>
                      {r.review.comment && <p className="mt-1 text-[11px] text-slate-600">{r.review.comment}</p>}
                      {r.review.modifiedRevision && (
                        <div className="mt-2 rounded border border-blue-200 bg-blue-50/60 p-2">
                          <p className="text-[10px] font-semibold uppercase text-blue-700">Angepasste Formulierung</p>
                          <p className="mt-0.5 text-[11px] text-blue-900">{r.review.modifiedRevision}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 text-[10px] text-slate-400">
                    <span>Konfidenz: {r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"}</span>
                    <span>Datum: {new Date(r.createdAt).toLocaleDateString("de-DE")}</span>
                    <span>Keywords: {r.matchedKeywords.join(", ")}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-[10px] text-slate-300">
        Similarity PoC · Keyword-basiert · Production: Embedding + pgvector
      </p>
    </div>
  )
}
