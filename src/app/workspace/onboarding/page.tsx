"use client"

import { useState } from "react"
import Link from "next/link"

const steps = [
  {
    emoji: "👋",
    title: "Willkommen bei KanzleiAI",
    desc: "Die Enterprise-Plattform fuer KI-gestuetzte Vertragsanalyse. In 3 Schritten sind Sie startklar.",
    action: null
  },
  {
    emoji: "📤",
    title: "Ersten Vertrag analysieren",
    desc: "Laden Sie einen Vertrag hoch — PDF oder Text. Die KI erkennt Sprache und Typ automatisch und liefert in unter 3 Sekunden Risiko-Score, Findings und Formulierungsvorschlaege.",
    action: { label: "Schnellanalyse oeffnen", href: "/workspace/analyse" }
  },
  {
    emoji: "🤖",
    title: "Copilot ausprobieren",
    desc: "Stellen Sie dem KI-Assistenten Fragen zu Ihrem analysierten Vertrag. Kuendigungsfristen, Haftungsklauseln, BGB-Referenzen — alles im Kontext.",
    action: { label: "Copilot oeffnen", href: "/workspace/copilot" }
  },
  {
    emoji: "⚖️",
    title: "AGB vergleichen",
    desc: "Laden Sie Lieferanten-AGB und Ihre eigenen Einkaufsbedingungen hoch. Die KI vergleicht Klausel fuer Klausel und identifiziert Abweichungen.",
    action: { label: "Vergleich starten", href: "/workspace/vergleich" }
  },
]

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0)

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i <= current ? "w-10 bg-[#003856]" : "w-6 bg-gray-200"}`} />
        ))}
      </div>

      {/* Content */}
      <div className="mt-12 text-center">
        <span className="text-[48px]">{steps[current].emoji}</span>
        <h1 className="mt-5 text-[1.75rem] font-semibold tracking-tight text-gray-950">{steps[current].title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-gray-500">{steps[current].desc}</p>

        {steps[current].action && (
          <Link href={steps[current].action!.href} className="mt-8 inline-block rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">{steps[current].action!.label} →</Link>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:invisible">← Zurueck</button>

        <span className="text-[12px] text-gray-400">{current + 1} / {steps.length}</span>

        {current < steps.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)} className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">Weiter →</button>
        ) : (
          <Link href="/dashboard" className="rounded-full bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700">Zum Dashboard ✓</Link>
        )}
      </div>

      {/* Skip */}
      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-[12px] text-gray-400 hover:text-gray-600">Onboarding ueberspringen</Link>
      </div>
    </div>
  )
}
