import type { ReactNode } from "react"

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-gray-100 bg-white pb-16 pt-16 sm:pb-20 sm:pt-20">
      <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-gold-200/30 to-transparent blur-3xl" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">{eyebrow}</p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-[1.15] tracking-tight text-gray-950 sm:text-[2.5rem]">{title}</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-gray-500 sm:text-[16px]">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
