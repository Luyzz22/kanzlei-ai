export type BadgeTone = "neutral" | "info" | "success" | "warning" | "risk"

export const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
  info: "border-[#003856]/20 bg-[#003856]/[0.04] text-[#003856]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  risk: "border-rose-200 bg-rose-50 text-rose-700"
}

export const sectionSurfaceClasses = {
  default: "rounded-2xl border border-gray-100 bg-white",
  muted: "rounded-2xl border border-gray-100 bg-gray-50/50",
  accent: "rounded-2xl border border-[#003856]/10 bg-[#003856]/[0.02]",
  dark: "rounded-2xl border border-gray-800 bg-gray-950 text-gray-100"
} as const

export const ctaVariantClasses = {
  default: "border-gray-100 bg-white text-gray-900",
  accent: "border-[#003856]/10 bg-[#003856]/[0.02] text-gray-950"
} as const
