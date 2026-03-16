import type { ReactNode } from "react"

import { sectionSurfaceClasses } from "@/config/ui-patterns"

type InfoPanelProps = {
  title: string
  children: ReactNode
  tone?: keyof typeof sectionSurfaceClasses
}

export function InfoPanel({ title, children, tone = "default" }: InfoPanelProps) {
  return (
    <section className={`${sectionSurfaceClasses[tone]} p-5 sm:p-6`}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}
