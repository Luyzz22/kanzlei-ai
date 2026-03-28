import type { ReactNode } from "react"

type InfoPanelProps = {
  title: string
  children: ReactNode
  tone?: "default" | "muted" | "accent" | "dark"
}

const toneClasses = {
  default: "border-gray-100 bg-white",
  muted: "border-gray-100 bg-gray-50/50",
  accent: "border-gold-100 bg-gold-50/50",
  dark: "border-gray-800 bg-gray-950 text-gray-100",
}

export function InfoPanel({ title, children, tone = "default" }: InfoPanelProps) {
  return (
    <section className={`rounded-2xl border p-6 sm:p-8 ${toneClasses[tone]}`}>
      <h2 className={`text-[18px] font-semibold tracking-tight ${tone === "dark" ? "text-white" : "text-gray-900"}`}>{title}</h2>
      <div className={`mt-4 text-[14px] leading-relaxed ${tone === "dark" ? "text-gray-300" : "text-gray-500"}`}>{children}</div>
    </section>
  )
}
