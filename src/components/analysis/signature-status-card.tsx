"use client"

import { SignatureStatus, getSignatureStatusLabel, RiskFinding } from "@/lib/risk-engine/multi-dimensional"

interface Props {
  status: SignatureStatus
  signatureBlockers: RiskFinding[]
}

export function SignatureStatusCard({ status, signatureBlockers }: Props) {
  const meta = getSignatureStatusLabel(status)

  const colorClasses: Record<string, { bg: string; border: string; text: string; iconBg: string; iconText: string }> = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", iconBg: "bg-emerald-600", iconText: "text-white" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", iconBg: "bg-blue-600", iconText: "text-white" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", iconBg: "bg-amber-600", iconText: "text-white" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", iconBg: "bg-red-600", iconText: "text-white" }
  }

  const c = colorClasses[meta.color]

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6`}>
      <div className="flex items-start gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${c.iconBg} text-[24px] font-bold ${c.iconText}`}>
          {meta.icon}
        </span>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Unterschrifts-Status</p>
          <h2 className={`mt-1 text-[20px] font-semibold ${c.text}`}>{meta.label}</h2>
          <p className={`mt-1 text-[13px] ${c.text} opacity-80`}>{meta.description}</p>

          {signatureBlockers.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${c.text}`}>
                {signatureBlockers.length} Signature Blocker
              </p>
              {signatureBlockers.slice(0, 3).map((b) => (
                <div key={b.id} className="rounded-lg bg-white/60 p-3">
                  <p className={`text-[13px] font-medium ${c.text}`}>{b.title}</p>
                  <p className="mt-0.5 text-[12px] text-gray-600">{b.recommendedAction}</p>
                </div>
              ))}
              {signatureBlockers.length > 3 && (
                <p className="text-[11px] text-gray-500">+ {signatureBlockers.length - 3} weitere</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
