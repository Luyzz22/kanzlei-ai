"use client"

import type { RiskAssessment } from "@/lib/contract-intelligence/risk-engine"

export function SignatureStatusBanner({ assessment }: { assessment: RiskAssessment }) {
  const config = {
    signable: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      titleColor: "text-emerald-900",
      bodyColor: "text-emerald-800",
      icon: "✓",
      title: "Unterschriftsbereit",
      sub: "Vertrag ist im Wesentlichen unterschriftsfaehig"
    },
    amendments_required: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      titleColor: "text-amber-900",
      bodyColor: "text-amber-800",
      icon: "!",
      title: "Nachverhandlung empfohlen",
      sub: "Vertrag mit Anpassungen unterschriftsfaehig"
    },
    not_signable: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-700",
      titleColor: "text-red-900",
      bodyColor: "text-red-800",
      icon: "✕",
      title: "Nicht unterschreibbar ohne Nachverhandlung",
      sub: "Kritische Maengel verhindern Vertragsabschluss"
    }
  }[assessment.signatureStatus]

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-5`}>
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.iconBg} text-[24px] font-bold ${config.iconColor}`}>
          {config.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-[16px] font-semibold ${config.titleColor}`}>{config.title}</h3>
            <span className={`rounded-full ${config.iconBg} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.iconColor}`}>
              {assessment.signatureStatus === "not_signable" ? "BLOCKED" : assessment.signatureStatus === "amendments_required" ? "AMENDMENTS" : "READY"}
            </span>
          </div>
          <p className={`mt-1 text-[13px] ${config.bodyColor}`}>{config.sub}</p>
          <p className={`mt-2 text-[13px] leading-relaxed ${config.bodyColor}`}>{assessment.overallRecommendation}</p>

          {assessment.signatureBlockers.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${config.iconColor}`}>Blocker</p>
              {assessment.signatureBlockers.map((blocker, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${config.iconBg} text-[10px] font-bold ${config.iconColor}`}>{i + 1}</span>
                  <span className={`text-[12px] ${config.bodyColor}`}>{blocker}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
