"use client"

import type { RiskAssessment, RiskCategory } from "@/lib/contract-intelligence/risk-engine"
import { getCategoryLabel } from "@/lib/contract-intelligence/risk-engine"

const CATEGORY_META: Record<RiskCategory, { emoji: string; color: string; bg: string }> = {
  legal:       { emoji: "⚖️", color: "text-purple-700", bg: "bg-purple-100" },
  financial:   { emoji: "💶", color: "text-emerald-700", bg: "bg-emerald-100" },
  operational: { emoji: "⚙️", color: "text-blue-700",   bg: "bg-blue-100" },
  compliance:  { emoji: "📋", color: "text-amber-700",  bg: "bg-amber-100" },
}

function ScoreBar({ score, label, sublabel }: { score: number; label: string; sublabel: string }) {
  const color = score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : score >= 20 ? "bg-blue-500" : "bg-emerald-500"
  const textColor = score >= 70 ? "text-red-700" : score >= 40 ? "text-amber-700" : score >= 20 ? "text-blue-700" : "text-emerald-700"

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-medium text-gray-500">{label}</p>
        <span className={`text-[28px] font-semibold ${textColor}`}>{score}<span className="text-[14px] text-gray-400">/100</span></span>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">{sublabel}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-gray-300">
        <span>0 Niedrig</span><span>100 Kritisch</span>
      </div>
    </div>
  )
}

export function RiskDashboard({ assessment }: { assessment: RiskAssessment }) {
  return (
    <div>
      {/* Two-Axis Headline Scores */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreBar
          score={assessment.legalBlockingScore}
          label="Legal Blocking Risk"
          sublabel="Verhindert Unterschrift bei hohen Werten"
        />
        <ScoreBar
          score={assessment.economicOperationalScore}
          label="Economic / Operational Risk"
          sublabel="Kosten- und Reibungsrisiko"
        />
      </div>

      {/* Risk by Category */}
      <div className="mt-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Risiko nach Kategorie</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(assessment.byCategory) as RiskCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat]
            const score = assessment.byCategory[cat]
            return (
              <div key={cat} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg} text-[14px]`}>{meta.emoji}</span>
                    <span className="text-[12px] font-medium text-gray-700">{getCategoryLabel(cat)}</span>
                  </div>
                  <span className={`text-[18px] font-semibold ${meta.color}`}>{score}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : score >= 20 ? "bg-blue-500" : "bg-emerald-500"}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
