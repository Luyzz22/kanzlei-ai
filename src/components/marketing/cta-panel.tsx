import Link from "next/link"

import { ctaVariantClasses } from "@/config/ui-patterns"

type CtaPanelProps = {
  title: string
  description: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
  variant?: keyof typeof ctaVariantClasses
}

export function CtaPanel({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = "accent"
}: CtaPanelProps) {
  return (
    <section className={`rounded-xl border p-5 sm:p-6 ${ctaVariantClasses[variant]}`}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-90">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={primaryHref} className="inline-flex rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          {primaryLabel}
        </Link>
        {secondaryLabel && secondaryHref ? (
          <Link href={secondaryHref} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
