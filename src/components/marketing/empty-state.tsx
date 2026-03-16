import Link from "next/link"

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-4">
          <Link href={actionHref} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </section>
  )
}
