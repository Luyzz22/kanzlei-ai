"use client"

import { useMemo, useState } from "react"

import { StatusBadge } from "@/components/marketing/status-badge"

const reifegradHinweis = {
  niedrig: {
    titel: "Grundlage zuerst stabilisieren",
    text: "Starten Sie mit klaren Intake-Feldern, Rollenverantwortung und Review-Schritten. Danach KI-Hinweise kontrolliert aktivieren.",
    emoji: "🧭"
  },
  mittel: {
    titel: "Kontrollierte Skalierung",
    text: "Ihr Setup ist arbeitsfähig. Als nächster Schritt eignen sich standardisierte Freigabevorlagen und erweiterte Audit-Nachweise.",
    emoji: "🔍"
  },
  hoch: {
    titel: "Enterprise-ready Ausbaustufe",
    text: "Die Struktur ist belastbar für größere Rollensets. Fokus: feinere Governance-Policies und teamübergreifende Qualitätssicherung.",
    emoji: "✅"
  }
} as const

export function AiGuidanceWidget() {
  const [reviewTiefe, setReviewTiefe] = useState(3)
  const [governanceTiefe, setGovernanceTiefe] = useState(3)

  const einordnung = useMemo(() => {
    const score = reviewTiefe + governanceTiefe
    if (score <= 4) return reifegradHinweis.niedrig
    if (score <= 7) return reifegradHinweis.mittel
    return reifegradHinweis.hoch
  }, [reviewTiefe, governanceTiefe])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-950">🧠 KI-Readiness Widget</h3>
        <StatusBadge label="Interaktive Orientierung" tone="info" />
      </div>
      <p className="mt-2 text-sm text-slate-600">Schnelle Einordnung für den nächsten sinnvollen Ausbau von Review und Governance.</p>

      <div className="mt-4 grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Review-Tiefe</span>
          <input type="range" min={1} max={5} value={reviewTiefe} onChange={(e) => setReviewTiefe(Number(e.target.value))} className="w-full accent-slate-900" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Governance-Tiefe</span>
          <input type="range" min={1} max={5} value={governanceTiefe} onChange={(e) => setGovernanceTiefe(Number(e.target.value))} className="w-full accent-slate-900" />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{einordnung.emoji} {einordnung.titel}</p>
        <p className="mt-1 text-sm text-slate-600">{einordnung.text}</p>
      </div>
    </section>
  )
}
