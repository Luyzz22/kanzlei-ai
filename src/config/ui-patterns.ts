export type BadgeTone = "neutral" | "info" | "success" | "warning" | "risk"

export const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: "border-slate-300 bg-slate-50 text-slate-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  risk: "border-rose-200 bg-rose-50 text-rose-700"
}

export const sectionSurfaceClasses = {
  default: "rounded-xl border border-slate-200 bg-white",
  muted: "rounded-xl border border-slate-200 bg-slate-50/70",
  accent: "rounded-xl border border-blue-200 bg-blue-50/70",
  dark: "rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
} as const

export const ctaVariantClasses = {
  default: "border-slate-200 bg-white text-slate-900",
  accent: "border-blue-200 bg-blue-50 text-blue-950"
} as const
