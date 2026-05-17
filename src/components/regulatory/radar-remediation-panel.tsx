"use client"

import { useState } from "react"
import type { RemediationAction } from "@/lib/regulatory/watchlist"

type ActionStatus = "offen" | "in-arbeit" | "erledigt"

const priorityStyle: Record<string, { bg: string; text: string }> = {
  kritisch: { bg: "bg-rose-100", text: "text-rose-700" },
  hoch: { bg: "bg-amber-100", text: "text-amber-700" },
  mittel: { bg: "bg-blue-100", text: "text-blue-700" }
}

export function RadarRemediationPanel({
  actions,
  enforcementDate
}: {
  regulationId: string
  actions: RemediationAction[]
  enforcementDate: string
}) {
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>(() => {
    const init: Record<string, ActionStatus> = {}
    actions.forEach(a => { init[a.id] = "offen" })
    return init
  })
  const [expandedAction, setExpandedAction] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const doneCount = Object.values(statuses).filter(s => s === "erledigt").length
  const totalCount = actions.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const statusCycle: ActionStatus[] = ["offen", "in-arbeit", "erledigt"]
  const statusConfig: Record<ActionStatus, { label: string; color: string; icon: string }> = {
    offen: { label: "Offen", color: "bg-slate-200 text-slate-600", icon: "○" },
    "in-arbeit": { label: "In Arbeit", color: "bg-amber-100 text-amber-700", icon: "◐" },
    erledigt: { label: "Erledigt", color: "bg-emerald-100 text-emerald-700", icon: "✓" }
  }

  const cycleStatus = (actionId: string) => {
    setStatuses(prev => {
      const current = prev[actionId]
      const idx = statusCycle.indexOf(current)
      const next = statusCycle[(idx + 1) % statusCycle.length]
      return { ...prev, [actionId]: next }
    })
  }

  const copyClause = (actionId: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(actionId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const enfDate = new Date(enforcementDate)
  const now = new Date()
  const daysLeft = Math.ceil((enfDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="mt-4 border-t border-stone-200/50 pt-4">
      {/* Remediation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#003856]">
            Remediation-Maßnahmen
          </span>
          <span className="rounded-full bg-[#003856]/10 px-2 py-0.5 text-[10px] font-medium text-[#003856]">
            {doneCount}/{totalCount}
          </span>
        </div>
        {daysLeft > 0 && (
          <span className={`text-[10px] font-medium ${daysLeft <= 30 ? "text-rose-600" : daysLeft <= 90 ? "text-amber-600" : "text-slate-500"}`}>
            {daysLeft} Tage bis Enforcement
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`rounded-full transition-all duration-500 ${progressPct === 100 ? "bg-emerald-500" : "bg-[#003856]"}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Actions */}
      <div className="mt-3 space-y-2">
        {actions.map(action => {
          const status = statuses[action.id]
          const sc = statusConfig[status]
          const ps = priorityStyle[action.priority] ?? priorityStyle.mittel
          const isExpanded = expandedAction === action.id
          const dueDate = new Date(now.getTime() + action.suggestedDays * 86400000)

          return (
            <div
              key={action.id}
              className={`rounded-lg border transition-colors ${status === "erledigt" ? "border-emerald-200 bg-emerald-50/30" : "border-stone-200 bg-white"}`}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                {/* Status Toggle */}
                <button
                  onClick={() => cycleStatus(action.id)}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${sc.color}`}
                  title={`Status: ${sc.label} — Klicken zum Wechseln`}
                >
                  {sc.icon} {sc.label}
                </button>

                {/* Title + Description */}
                <button
                  type="button"
                  onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className={`text-[12px] font-semibold ${status === "erledigt" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{action.description}</p>
                </button>

                {/* Priority + Due */}
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${ps.bg} ${ps.text}`}>
                  {action.priority}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                  bis {dueDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                </span>

                {/* Expand */}
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded: Clause Amendment */}
              {isExpanded && action.clauseAmendment && (
                <div className="border-t border-stone-100 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#003856]">
                      Nachtragsklausel-Vorlage
                    </p>
                    <button
                      onClick={() => copyClause(action.id, action.clauseAmendment!)}
                      className="rounded border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      {copiedId === action.id ? "✓ Kopiert" : "📋 Kopieren"}
                    </button>
                  </div>
                  <div className="mt-2 rounded-lg border border-[#003856]/10 bg-[#003856]/5 p-3">
                    <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-700">
                      {action.clauseAmendment}
                    </p>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Diese Klausel ist ein Formulierungsvorschlag und ersetzt keine juristische Prüfung.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
