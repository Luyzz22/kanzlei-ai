type ProcessStep = {
  title: string
  description: string
}

type ProcessFlowProps = {
  steps: ProcessStep[]
}

export function ProcessFlow({ steps }: ProcessFlowProps) {
  return (
    <ol className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step.title} className="relative border-l border-gray-200 py-2 pl-7 lg:border-l-0 lg:border-t lg:pl-0 lg:pr-6 lg:pt-7">
          <div className="absolute -left-3 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-700 text-[10px] font-bold text-white lg:-top-3 lg:left-0">
            {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="text-[14px] font-semibold text-gray-900">{step.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{step.description}</p>
        </li>
      ))}
    </ol>
  )
}
