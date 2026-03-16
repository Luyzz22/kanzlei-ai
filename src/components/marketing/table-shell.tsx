import type { ReactNode } from "react"

type TableShellProps = {
  children: ReactNode
  title?: string
  description?: string
}

export function TableShell({ children, title, description }: TableShellProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title ? (
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-xs text-slate-600">{description}</p> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}
