import type { ReactNode } from "react"

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950 px-6 py-8 text-slate-100 shadow-sm sm:px-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{description}</p>
        </div>
        {children}
      </div>
    </section>
  )
}
