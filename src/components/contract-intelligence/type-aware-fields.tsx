"use client"

import type { ContractField } from "@/lib/contract-intelligence/schemas"
import { resolveFieldStatus } from "@/lib/contract-intelligence/schemas"

interface Props {
  fields: ContractField[]
  values: Record<string, string | null | undefined>
}

const STATUS_STYLES = {
  present:      { bg: "bg-white",      border: "border-gray-100",   text: "text-gray-900",   badge: "bg-emerald-100 text-emerald-700", badgeLabel: "✓ Vorhanden" },
  missing:      { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-900",    badge: "bg-red-100 text-red-700",         badgeLabel: "⚠ Fehlt" },
  not_provided: { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-900",  badge: "bg-amber-100 text-amber-700",     badgeLabel: "Nicht angegeben" },
  n_a:          { bg: "bg-gray-50",    border: "border-gray-200",   text: "text-gray-500",   badge: "bg-gray-200 text-gray-600",       badgeLabel: "N/A" },
  incomplete:   { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-900",  badge: "bg-amber-100 text-amber-700",     badgeLabel: "Unvollstaendig" },
} as const

export function TypeAwareFieldsList({ fields, values }: Props) {
  // Group by category
  const grouped = fields.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {} as Record<string, ContractField[]>)

  const categoryLabels: Record<string, string> = {
    term: "Vertragslaufzeit",
    termination: "Kuendigung",
    liability: "Haftung",
    ip: "Geistiges Eigentum",
    data_protection: "Datenschutz",
    compliance: "Compliance",
    commercial: "Kommerziell",
    confidentiality: "Vertraulichkeit",
  }

  // Don't show categories with only N/A fields
  const visibleCategories = Object.entries(grouped).filter(([, catFields]) =>
    catFields.some(f => f.applicability !== "not_applicable")
  )

  if (visibleCategories.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
        <p className="text-[14px] text-gray-500">Keine vertragstyp-spezifischen Felder definiert.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {visibleCategories.map(([category, catFields]) => (
        <div key={category}>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{categoryLabels[category] ?? category}</h4>
          <div className="space-y-2">
            {catFields.map((field) => {
              const { status, displayValue } = resolveFieldStatus(field, values[field.key])
              const styles = STATUS_STYLES[status]
              return (
                <div key={field.key} className={`rounded-xl border ${styles.border} ${styles.bg} px-4 py-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] font-medium ${styles.text}`}>{field.shortLabel}</p>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${styles.badge}`}>{styles.badgeLabel}</span>
                      </div>
                      <p className={`mt-0.5 text-[12px] ${status === "present" ? "text-gray-600" : status === "n_a" ? "text-gray-400 italic" : "text-gray-500"}`}>
                        {status === "present" ? displayValue : displayValue}
                      </p>
                      {field.marketStandard && status === "present" && (
                        <p className="mt-1 text-[10px] text-gray-400">Marktstandard: {field.marketStandard}</p>
                      )}
                      {field.marketStandard && (status === "missing" || status === "not_provided") && (
                        <p className="mt-1 text-[10px] text-amber-700"><span className="font-medium">Marktueblich:</span> {field.marketStandard}</p>
                      )}
                    </div>
                    {status === "missing" && field.applicability === "required" && (
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Pflicht</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-[11px] text-blue-700">
          <span className="font-semibold">Vertragstyp-spezifische Anzeige:</span> Felder die fuer diesen Vertragstyp irrelevant sind (z.B. AVV bei NDA) werden ausgeblendet. Fehlende Pflichtfelder werden hervorgehoben.
        </p>
      </div>
    </div>
  )
}
