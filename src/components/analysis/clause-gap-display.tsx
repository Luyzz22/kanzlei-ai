"use client"

import { useState } from "react"
import { ClauseGap } from "@/lib/clause-library/gap-detection"

interface Props {
  gaps: ClauseGap[]
}

export function ClauseGapDisplay({ gaps }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const severityColor = (s: ClauseGap["severity"]) => {
    if (s === "kritisch") return { badge: "bg-red-100 text-red-700", border: "border-red-200" }
    if (s === "hoch") return { badge: "bg-amber-100 text-amber-700", border: "border-amber-200" }
    if (s === "mittel") return { badge: "bg-blue-100 text-blue-700", border: "border-blue-200" }
    return { badge: "bg-gray-100 text-gray-600", border: "border-gray-200" }
  }

  if (gaps.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <span className="text-[24px]">✓</span>
        <p className="mt-2 text-[13px] font-medium text-emerald-800">Alle Marktstandard-Klauseln vorhanden</p>
        <p className="mt-1 text-[11px] text-emerald-600">Keine kritischen Luecken im Vertrag identifiziert</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-600">
          <span className="font-semibold text-gray-900">{gaps.length} fehlende Klauseln</span> identifiziert — sortiert nach Kritikalitaet
        </p>
        <p className="text-[11px] text-gray-400">Mit Copy-Paste Ersatzformulierungen</p>
      </div>

      {gaps.map((gap) => {
        const c = severityColor(gap.severity)
        const isExpanded = expanded === gap.clauseId
        const isCopied = copied === gap.clauseId

        return (
          <div key={gap.clauseId} className={`rounded-xl border ${c.border} bg-white overflow-hidden`}>
            <button
              onClick={() => setExpanded(isExpanded ? null : gap.clauseId)}
              className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.badge}`}>{gap.severity}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-gray-900">{gap.clauseName}</h3>
                  {gap.bgbReference && <span className="font-mono text-[10px] text-gray-400">{gap.bgbReference}</span>}
                </div>
                <p className="mt-1 text-[13px] text-gray-500">{gap.description}</p>
              </div>
              <span className={`shrink-0 text-[18px] text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">📋 Empfohlene Ersatzklausel (Standard-Enterprise)</p>
                  <button
                    onClick={() => copyToClipboard(gap.fallbackTemplate, gap.clauseId)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                      isCopied ? "bg-emerald-600 text-white" : "bg-[#003856] text-white hover:bg-[#002a42]"
                    }`}
                  >
                    {isCopied ? "✓ Kopiert" : "📋 Kopieren"}
                  </button>
                </div>
                <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
                  <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-gray-800 font-serif">{gap.fallbackTemplate}</p>
                </div>
                <p className="mt-2 text-[10px] text-gray-400">
                  Hinweis: Standardformulierung — bitte vor Verwendung juristisch validieren und an Vertragskontext anpassen.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
