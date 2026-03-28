type SectionIntroProps = {
  eyebrow?: string
  title: string
  description: string
  align?: "left" | "center"
}

export function SectionIntro({ eyebrow, title, description, align = "left" }: SectionIntroProps) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start"

  return (
    <header className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-700">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
    </header>
  )
}
