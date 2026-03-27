import Link from "next/link"

type CtaPanelProps = {
  title: string
  description: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
  variant?: "default" | "accent"
}

export function CtaPanel({ title, description, primaryLabel, primaryHref, secondaryLabel, secondaryHref }: CtaPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-gray-50/30 p-6 sm:p-8 text-center">
      <h2 className="text-[20px] font-semibold tracking-tight text-gray-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-gray-500">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className="inline-flex rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98]"
        >
          {primaryLabel}
        </Link>
        {secondaryLabel && secondaryHref ? (
          <Link
            href={secondaryHref}
            className="inline-flex rounded-full border border-gray-200 bg-white px-6 py-3 text-[14px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
