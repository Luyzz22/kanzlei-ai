import Link from "next/link"

type AdminEmptyStateProps = {
  title: string
  description: string
  backHref?: string
  backLabel?: string
}

export function AdminEmptyState({
  title,
  description,
  backHref = "/dashboard/admin",
  backLabel = "Zurück zum Admin Center"
}: AdminEmptyStateProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
      <Link
        href={backHref}
        className="mt-4 inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
      >
        {backLabel}
      </Link>
    </section>
  )
}
