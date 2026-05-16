"use client"

import { useState } from "react"

import type {
  WorkbenchEvidenceGraph,
  WorkbenchConfidenceFactors
} from "@/types/ai-workbench"

/* ================================================================ */
/* NORM MARKER COLORS                                               */
/* ================================================================ */

const markerStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  DIREKT: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Direkt anwendbar" },
  ZWINGEND: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "Zwingend" },
  "B2B-INDIZ": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "B2B-Wertungsmaßstab" },
  ANALOG: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Analogie" }
}

/* ================================================================ */
/* CONFIDENCE BAR                                                   */
/* ================================================================ */

function ConfidenceBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const pct = Math.round(value * 100)
  const color =
    value >= 0.7 ? "bg-emerald-500" : value >= 0.4 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="flex items-center gap-2">
      <span className="w-[120px] shrink-0 text-[11px] text-slate-500 tabular-nums">
        {label} <span className="text-slate-300">({weight})</span>
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-[32px] shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-600">
        {pct}%
      </span>
    </div>
  )
}

/* ================================================================ */
/* SECTION TOGGLE                                                    */
/* ================================================================ */

function SectionToggle({
  title,
  icon,
  count,
  defaultOpen,
  children
}: {
  title: string
  icon: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 py-1.5 text-left"
      >
        <span className="text-[13px]">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {count != null && count > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {count}
          </span>
        )}
        <svg
          className={`ml-auto h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}

/* ================================================================ */
/* MAIN COMPONENT                                                    */
/* ================================================================ */

export type EvidenceGraphPanelProps = {
  evidenceGraph: WorkbenchEvidenceGraph | null
  confidenceFactors: WorkbenchConfidenceFactors | null
}

export function EvidenceGraphPanel({ evidenceGraph, confidenceFactors }: EvidenceGraphPanelProps) {
  if (!evidenceGraph && !confidenceFactors) return null

  const hasNorms = (evidenceGraph?.normBasis?.length ?? 0) > 0
  const hasSteps = (evidenceGraph?.reasoningSteps?.length ?? 0) > 0
  const hasCounter = (evidenceGraph?.counterArguments?.length ?? 0) > 0
  const hasLimitations = (evidenceGraph?.limitations?.length ?? 0) > 0
  const hasConfidence = confidenceFactors != null

  return (
    <div className="rounded-lg border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <svg className="h-4 w-4 text-[#003856]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#003856]">
          Evidence Graph
        </span>
        <span className="ml-auto text-[10px] text-slate-400">
          Begründungskette
        </span>
      </div>

      <div className="space-y-0.5 px-4 py-3">
        {/* 1: Norm Basis */}
        {hasNorms && (
          <SectionToggle
            title="Rechtsgrundlagen"
            icon="⚖️"
            count={evidenceGraph!.normBasis!.length}
            defaultOpen
          >
            <div className="flex flex-wrap gap-1.5 pb-2 pt-1">
              {evidenceGraph!.normBasis!.map((n, i) => {
                const style = markerStyles[n.marker] ?? markerStyles.DIREKT
                return (
                  <div
                    key={`norm-${i}`}
                    className={`group relative rounded-lg border px-2.5 py-1.5 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[12px] font-semibold ${style.text}`}>{n.norm}</span>
                      <span
                        className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider ${style.text} ${style.bg} ring-1 ring-inset ring-current/10`}
                      >
                        {n.marker}
                      </span>
                    </div>
                    {n.relevance && (
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                        {n.relevance}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </SectionToggle>
        )}

        {/* 2: Reasoning Steps — Timeline */}
        {hasSteps && (
          <SectionToggle
            title="Argumentationskette"
            icon="🔗"
            count={evidenceGraph!.reasoningSteps!.length}
            defaultOpen
          >
            <div className="relative pb-2 pl-4 pt-1">
              {/* Vertical line */}
              <div className="absolute bottom-2 left-[7px] top-1 w-px bg-slate-200" />
              <div className="space-y-3">
                {evidenceGraph!.reasoningSteps!.map((s, i) => (
                  <div key={`step-${i}`} className="relative flex items-start gap-3">
                    {/* Dot */}
                    <div className="absolute -left-4 top-0.5 flex h-[14px] w-[14px] items-center justify-center">
                      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#003856] text-[8px] font-bold text-white">
                        {s.step}
                      </span>
                    </div>
                    <div className="min-w-0 pl-1">
                      <p className="text-[11px] font-semibold text-slate-700">{s.label}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
                        {s.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionToggle>
        )}

        {/* 3: Counter Arguments */}
        {hasCounter && (
          <SectionToggle
            title="Gegenargumente"
            icon="💬"
            count={evidenceGraph!.counterArguments!.length}
          >
            <div className="space-y-1.5 pb-2 pt-1">
              {evidenceGraph!.counterArguments!.map((arg, i) => (
                <div
                  key={`counter-${i}`}
                  className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2"
                >
                  <span className="mt-0.5 text-[11px] text-amber-500">⟵</span>
                  <p className="text-[12px] leading-relaxed text-amber-900">{arg}</p>
                </div>
              ))}
            </div>
          </SectionToggle>
        )}

        {/* 4: Limitations */}
        {hasLimitations && (
          <SectionToggle title="Einschränkungen" icon="⚠️" count={evidenceGraph!.limitations!.length}>
            <div className="space-y-1.5 pb-2 pt-1">
              {evidenceGraph!.limitations!.map((lim, i) => (
                <div
                  key={`limit-${i}`}
                  className="flex items-start gap-2 rounded-lg border border-slate-150 bg-slate-50 px-3 py-2"
                >
                  <span className="mt-0.5 text-[11px] text-slate-400">ℹ</span>
                  <p className="text-[12px] leading-relaxed text-slate-600">{lim}</p>
                </div>
              ))}
            </div>
          </SectionToggle>
        )}

        {/* 5: Confidence Factors */}
        {hasConfidence && (
          <SectionToggle title="Konfidenz-Faktoren" icon="📊">
            <div className="space-y-1.5 pb-2 pt-1">
              <ConfidenceBar label="Normklarheit" value={confidenceFactors!.normClarity} weight="30%" />
              <ConfidenceBar label="Klauselklarheit" value={confidenceFactors!.clauseClarity} weight="25%" />
              <ConfidenceBar label="Vertragskontext" value={confidenceFactors!.contractContext} weight="20%" />
              <ConfidenceBar label="Branchenfit" value={confidenceFactors!.industryFit} weight="15%" />
              <ConfidenceBar label="Präzedenzlage" value={confidenceFactors!.precedent} weight="10%" />
              {confidenceFactors!.limitingFactor && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Limitierender Faktor: <span className="font-medium text-slate-600">{confidenceFactors!.limitingFactor}</span>
                </p>
              )}
            </div>
          </SectionToggle>
        )}
      </div>
    </div>
  )
}
