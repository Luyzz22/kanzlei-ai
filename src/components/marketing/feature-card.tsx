type FeatureCardProps = {
  title: string
  description: string
  meta?: string
  tone?: "default" | "muted"
}

export function FeatureCard({ title, description, meta, tone = "default" }: FeatureCardProps) {
  const bg = tone === "muted"
    ? "border-gray-100 bg-gray-50/50"
    : "border-gray-100 bg-white"

  return (
    <article className={`group rounded-2xl border p-5 transition-all hover:border-gray-200 hover:shadow-card ${bg}`}>
      <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{description}</p>
      {meta ? <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">{meta}</p> : null}
    </article>
  )
}
