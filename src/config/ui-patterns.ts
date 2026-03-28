export type BadgeTone = "neutral" | "info" | "success" | "warning" | "risk"

export const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
  info: "border-gold-200 bg-gold-50 text-gold-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  risk: "border-rose-200 bg-rose-50 text-rose-700"
}

export const sectionSurfaceClasses = {
  default: "rounded-2xl border border-gray-100 bg-white",
  muted: "rounded-2xl border border-gray-100 bg-gray-50/50",
  accent: "rounded-2xl border border-gold-100 bg-gold-50/50",
  dark: "rounded-2xl border border-gray-800 bg-gray-950 text-gray-100"
} as const

export const ctaVariantClasses = {
  default: "border-gray-100 bg-white text-gray-900",
  accent: "border-gold-100 bg-gold-50/50 text-gray-950"
} as const
