/**
 * AI Act Art. 50 KI-Kennzeichnung (Phase 2A, Item 2.4)
 *
 * Verpflichtende Kennzeichnung KI-generierter Inhalte.
 * Muss in jeder AI-Ausgabe erscheinen: Analyse-Ergebnisse,
 * Vergleiche, Playbook-Vorschläge, Radar-Matches.
 *
 * Deadline: 02.08.2026
 */

type AiTransparencyBadgeProps = {
  /** Welches KI-System hat den Output erzeugt */
  system?: string
  /** Compact-Modus für inline-Nutzung */
  compact?: boolean
  /** Zusätzliche CSS-Klassen */
  className?: string
}

export function AiTransparencyBadge({
  system = "KanzleiAI",
  compact = false,
  className = ""
}: AiTransparencyBadgeProps) {
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500 ${className}`}>
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
          <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor">i</text>
        </svg>
        KI-generiert · {system}
      </span>
    )
  }

  return (
    <div className={`flex items-start gap-2.5 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3.5 py-2.5 ${className}`}>
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white">
        <svg className="h-3 w-3 text-slate-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 4v5M8 11v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-600">
          KI-generierter Inhalt
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
          Dieser Inhalt wurde von {system} unter Einsatz künstlicher Intelligenz erzeugt
          (Art.&nbsp;50 VO&nbsp;(EU)&nbsp;2024/1689). Die Ergebnisse sind Entscheidungshilfen
          und ersetzen keine eigenständige juristische Prüfung.
        </p>
      </div>
    </div>
  )
}
