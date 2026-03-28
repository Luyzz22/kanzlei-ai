type StatusBadgeProps = {
  label: string
  tone?: "neutral" | "info" | "success" | "warning" | "risk"
  className?: string
}

const toneClasses = {
  neutral: "border-gray-200 bg-gray-50 text-gray-600",
  info: "border-gold-200 bg-gold-50 text-gold-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  risk: "border-rose-200 bg-rose-50 text-rose-700",
}

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-medium ${toneClasses[tone]} ${className ?? ""}`}>
      {label}
    </span>
  )
}
