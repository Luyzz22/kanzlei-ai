import { sectionSurfaceClasses } from "@/config/ui-patterns"

type FeatureCardProps = {
  title: string
  description: string
  meta?: string
  tone?: keyof typeof sectionSurfaceClasses
}

export function FeatureCard({ title, description, meta, tone = "default" }: FeatureCardProps) {
  return (
    <article className={`${sectionSurfaceClasses[tone]} p-5`}>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{description}</p>
      {meta ? <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{meta}</p> : null}
    </article>
  )
}
