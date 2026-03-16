type ProcessStep = {
  title: string
  description: string
}

type ProcessFlowProps = {
  steps: ProcessStep[]
}

export function ProcessFlow({ steps }: ProcessFlowProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {steps.map((step, index) => (
        <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Schritt {index + 1}</p>
          <h3 className="mt-2 text-sm font-semibold text-slate-950">{step.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{step.description}</p>
        </li>
      ))}
    </ol>
  )
}
