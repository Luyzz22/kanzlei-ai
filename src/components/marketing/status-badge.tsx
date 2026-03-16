import { badgeToneClasses, type BadgeTone } from "@/config/ui-patterns"

type StatusBadgeProps = {
  label: string
  tone?: BadgeTone
  className?: string
}

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeToneClasses[tone]} ${className ?? ""}`}>{label}</span>
}
