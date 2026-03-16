import { StatusBadge } from "@/components/marketing/status-badge"

type HeroVisualSlideProps = {
  variant: "workspace" | "analyse" | "review" | "audit"
}

export function HeroVisualSlide({ variant }: HeroVisualSlideProps) {
  if (variant === "workspace") {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Dokumenten-Workspace</p>
        <ul className="space-y-2">
          {[
            ["Mandat-2026-01.pdf", "In Bearbeitung"],
            ["Liefervertrag-Nachtrag.docx", "Review offen"],
            ["Datenschutzvereinbarung.pdf", "Nachweis bereit"]
          ].map(([doc, status]) => (
            <li key={doc} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-700">{doc}</span>
              <StatusBadge label={status} tone="info" />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (variant === "analyse") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Prüfkontext</p>
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">Klausel: Haftungsbegrenzung</p>
            <p className="text-xs text-amber-800">Hinweis: Schwellenwert weicht vom internen Prüfschema ab.</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">Klausel: Laufzeit</p>
            <p className="text-xs text-blue-800">Kontext vorhanden: Referenzvertrag 2025/07.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md border border-slate-200 p-2">8 Hinweise</div>
            <div className="rounded-md border border-slate-200 p-2">3 Risiken</div>
            <div className="rounded-md border border-slate-200 p-2">12 geprüft</div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "review") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Freigabeprozess</p>
        <div className="mt-3 space-y-3">
          {[
            ["1", "Juristische Prüfung", "Abgeschlossen"],
            ["2", "Fachbereich Review", "In Bearbeitung"],
            ["3", "Freigabe durch Leitung", "Geplant"]
          ].map(([step, title, state], index) => (
            <div key={title} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-700">{step}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="text-xs text-slate-600">{state}</p>
              </div>
              <StatusBadge label={index === 0 ? "Ok" : index === 1 ? "Aktiv" : "Wartend"} tone={index === 0 ? "success" : index === 1 ? "warning" : "neutral"} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Audit & Governance</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-900">Audit-Protokolle</p>
          <p className="mt-1 text-xs text-slate-600">Jede Freigabe und jede Rollenänderung wird nachvollziehbar dokumentiert.</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-900">Mandantenkontext</p>
          <p className="mt-1 text-xs text-slate-600">Getrennte Arbeitsräume mit klarer Rollen- und Zugriffstrennung.</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
          <p className="text-sm font-medium text-slate-900">Nachweisübersicht</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge label="Review-Protokoll" tone="neutral" />
            <StatusBadge label="Versionierung" tone="info" />
            <StatusBadge label="Freigabehistorie" tone="success" />
          </div>
        </div>
      </div>
    </div>
  )
}
