"use client"

import { MultiDimensionalRiskScore, getDimensionLabel } from "@/lib/risk-engine/multi-dimensional"
import { RiskDimension } from "@/lib/contract-types/registry"

interface Props {
  score: MultiDimensionalRiskScore
}

export function RiskDimensionsDisplay({ score }: Props) {
  const dimensions: { key: RiskDimension; value: number }[] = [
    { key: "legal", value: score.legal },
    { key: "compliance", value: score.compliance },
    { key: "financial", value: score.financial },
    { key: "operational", value: score.operational }
  ]

  const colorForScore = (v: number) => {
    if (v >= 75) return { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" }
    if (v >= 50) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" }
    if (v >= 25) return { bar: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" }
    return { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" }
  }

  const overallColor = colorForScore(score.weighted)

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border ${overallColor.border} ${overallColor.bg} p-5`}>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Gewichteter Gesamt-Risikoscore</p>
            <p className={`mt-1 text-[36px] font-semibold leading-none ${overallColor.text}`}>{score.weighted}<span className="text-[16px] text-gray-400">/100</span></p>
          </div>
          <p className="text-[11px] text-gray-500">Gewichtung: Legal 40 / Compliance 30 / Financial 20 / Operational 10</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {dimensions.map((d) => {
          const meta = getDimensionLabel(d.key)
          const c = colorForScore(d.value)
          return (
            <div key={d.key} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{meta.emoji}</span>
                  <p className="text-[13px] font-semibold text-gray-900">{meta.label}</p>
                </div>
                <span className={`text-[16px] font-semibold ${c.text}`}>{d.value}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${d.value}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">{meta.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
