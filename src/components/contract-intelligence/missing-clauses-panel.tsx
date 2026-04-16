"use client"

import { useState } from "react"
import type { FallbackClause } from "@/lib/contract-intelligence/fallback-clauses"

interface Props {
  presentClauses: string[]
  requiredClauses: string[]
  recommendedClauses: string[]
  fallbacks: FallbackClause[]
}

export function MissingClausesPanel({ presentClauses, requiredClauses, recommendedClauses, fallbacks }: Props) {
  const [expandedClause, setExpandedClause] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const presentSet = new Set(presentClauses.map(c => c.toLowerCase()))

  const missingRequired = requiredClauses.filter(c => !presentSet.has(c.toLowerCase()))
  const missingRecommended = recommendedClauses.filter(c => !presentSet.has(c.toLowerCase()))

  const findFallback = (clauseTitle: string): FallbackClause | undefined => {
    const lc = clauseTitle.toLowerCase()
    return fallbacks.find(f =>
      f.title.toLowerCase().includes(lc.split(" ")[0]) ||
      lc.includes(f.title.toLowerCase().split(" ")[0])
    )
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      {missingRequired.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-[12px] font-bold text-red-700">!</span>
            <h3 className="text-[14px] font-semibold text-gray-900">Fehlende Pflichtklauseln</h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">{missingRequired.length}</span>
          </div>
          <div className="space-y-3">
            {missingRequired.map((clause) => {
              const fallback = findFallback(clause)
              const isExpanded = expandedClause === clause
              return (
                <div key={clause} className="overflow-hidden rounded-xl border border-red-200 bg-red-50">
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className="text-[14px] font-medium text-red-900">{clause}</p>
                      <p className="mt-0.5 text-[12px] text-red-700">Pflichtklausel fehlt — kritisch fuer Vertragsabschluss</p>
                    </div>
                    {fallback && (
                      <button
                        onClick={() => setExpandedClause(isExpanded ? null : clause)}
                        className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-red-700"
                      >
                        {isExpanded ? "Verbergen" : "Standard-Klausel zeigen →"}
                      </button>
                    )}
                  </div>
                  {isExpanded && fallback && (
                    <div className="border-t border-red-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{fallback.title}</p>
                          <p className="mt-0.5 text-[11px] text-gray-500">{fallback.shortDesc}</p>
                          <div className="mt-1 flex gap-2">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">{fallback.language.toUpperCase()}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${fallback.marketTier === "premium" ? "bg-gold-100 text-gold-700" : fallback.marketTier === "standard" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{fallback.marketTier}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(fallback.text, fallback.id)}
                          className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {copiedId === fallback.id ? "✓ Kopiert" : "📋 Kopieren"}
                        </button>
                      </div>
                      <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="font-mono text-[12px] leading-relaxed text-gray-700">{fallback.text}</p>
                      </div>
                      <p className="mt-2 text-[10px] text-gray-400">Rechtsgrundlage: {fallback.citation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {missingRecommended.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[12px] font-bold text-amber-700">i</span>
            <h3 className="text-[14px] font-semibold text-gray-900">Fehlende empfohlene Klauseln (Marktstandard)</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{missingRecommended.length}</span>
          </div>
          <div className="space-y-2">
            {missingRecommended.map((clause) => {
              const fallback = findFallback(clause)
              const isExpanded = expandedClause === clause
              return (
                <div key={clause} className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
                  <div className="flex items-start justify-between gap-3 p-3">
                    <p className="text-[13px] text-amber-900">{clause}</p>
                    {fallback && (
                      <button
                        onClick={() => setExpandedClause(isExpanded ? null : clause)}
                        className="shrink-0 rounded-full border border-amber-300 bg-white px-3 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-100"
                      >
                        {isExpanded ? "−" : "Klausel zeigen"}
                      </button>
                    )}
                  </div>
                  {isExpanded && fallback && (
                    <div className="border-t border-amber-200 bg-white p-3">
                      <div className="flex items-start justify-between">
                        <p className="text-[11px] font-semibold text-gray-700">{fallback.title}</p>
                        <button onClick={() => copyToClipboard(fallback.text, fallback.id)} className="text-[10px] font-medium text-[#003856]">
                          {copiedId === fallback.id ? "✓ Kopiert" : "📋 Kopieren"}
                        </button>
                      </div>
                      <p className="mt-2 font-mono text-[11px] leading-relaxed text-gray-700">{fallback.text}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {missingRequired.length === 0 && missingRecommended.length === 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <span className="text-[28px]">✓</span>
          <p className="mt-2 text-[14px] font-semibold text-emerald-900">Alle Marktstandard-Klauseln vorhanden</p>
          <p className="mt-1 text-[12px] text-emerald-700">Keine fehlenden Pflicht- oder empfohlenen Klauseln identifiziert.</p>
        </div>
      )}
    </div>
  )
}
