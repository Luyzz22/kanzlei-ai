/**
 * Privacy Redaction — Deterministische PII-Pseudonymisierung
 *
 * Erkennt und ersetzt personenbezogene Daten vor LLM-Transfer:
 * - E-Mail-Adressen → [EMAIL_1], [EMAIL_2], ...
 * - Telefonnummern → [PHONE_1], [PHONE_2], ...
 * - IBAN → [IBAN_1], ...
 * - Steuer-ID → [TAX_ID_1], ...
 * - USt-IdNr → [VAT_ID_1], ...
 *
 * KEINE aggressive Personennamen-Ersetzung — das würde Vertragslogik
 * zerstören (Parteien, Vertretungsberechtigte, Unterzeichner).
 *
 * DSGVO Art. 5 Abs. 1 lit. c (Datenminimierung)
 * DSGVO Art. 25 (Datenschutz durch Technikgestaltung)
 * DSGVO Art. 32 (Sicherheit der Verarbeitung)
 * DSGVO Art. 44 ff. (Drittlandtransfer)
 * § 203 StGB
 *
 * Keine externen Dependencies.
 * Reine, unit-testbare Funktionen.
 * Deterministische Placeholder pro Dokument (idempotent bei gleichem Input).
 */

export type RedactionType = "email" | "phone" | "iban" | "tax_id" | "vat_id"

export type RedactionReplacement = {
  type: RedactionType
  placeholder: string
  /** Originalwert — wird NICHT geloggt, nur für Re-Hydration intern gehalten. */
  original: string
}

export type RedactionResult = {
  redactedText: string
  applied: boolean
  replacements: RedactionReplacement[]
  /** Kompakte Zusammenfassung ohne PII für Logging. */
  summary: string
}

// ── Patterns ─────────────────────────────────────────────────────────────

/**
 * E-Mail: RFC 5322 simplified — deckt 99%+ der realen Adressen ab.
 */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

/**
 * Telefon: Deutsche Formate (+49, 0xxx, mit/ohne Leerzeichen/Bindestriche).
 * Mindestens 6 Ziffern um false-positives bei Paragraphennummern zu vermeiden.
 */
const PHONE_PATTERN =
  /(?:\+49|0049|0)\s*[\-/]?\s*\(?\d{2,5}\)?\s*[\-/]?\s*\d{2,}(?:\s*[\-/]?\s*\d+){0,4}/g

/**
 * IBAN: DE + 20 Zeichen (mit optionalen Leerzeichen).
 * Erweitert für AT, CH, LU, NL etc.
 */
const IBAN_PATTERN =
  /\b[A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{0,4}\s?\d{0,2}\b/g

/**
 * Deutsche Steuer-ID: 11 Ziffern, optional mit Leerzeichen/Schrägstrichen.
 * Pattern ist konservativ — nur wenn klar als Steuer-ID erkennbar.
 */
const TAX_ID_PATTERN =
  /\b(?:Steuer[\-\s]?(?:ID|Nr|Nummer|Identifikationsnummer)[\s:]*)\d{2,3}[\s/]?\d{3,4}[\s/]?\d{3,5}\b/gi

/**
 * USt-IdNr: DE + 9 Ziffern, AT + U + 8 Ziffern.
 */
const VAT_ID_PATTERN = /\b(?:DE\s?\d{9}|ATU\s?\d{8}|CHE[\-\s]?\d{3}\.\d{3}\.\d{3})\b/g

// ── Core ─────────────────────────────────────────────────────────────────

type PatternEntry = {
  type: RedactionType
  pattern: RegExp
  prefix: string
}

const PATTERNS: PatternEntry[] = [
  { type: "email", pattern: EMAIL_PATTERN, prefix: "EMAIL" },
  { type: "phone", pattern: PHONE_PATTERN, prefix: "PHONE" },
  { type: "iban", pattern: IBAN_PATTERN, prefix: "IBAN" },
  { type: "vat_id", pattern: VAT_ID_PATTERN, prefix: "VAT_ID" },
  { type: "tax_id", pattern: TAX_ID_PATTERN, prefix: "TAX_ID" },
]

/**
 * Pseudonymisiert personenbezogene Daten in Vertragstext.
 *
 * - Deterministische Placeholder: [EMAIL_1], [IBAN_1] etc.
 * - Gleiche Originalwerte bekommen gleichen Placeholder (idempotent).
 * - Reihenfolge: erstes Auftreten im Text bestimmt Nummerierung.
 *
 * @param text Roher Vertragstext
 * @returns RedactionResult mit redactedText + Replacement-Map
 */
export function pseudonymizeDocumentText(text: string): RedactionResult {
  const replacements: RedactionReplacement[] = []
  // Map von Original → Placeholder für Deduplizierung
  const seen = new Map<string, string>()
  const counters: Record<string, number> = {}

  let redacted = text

  for (const { type, pattern, prefix } of PATTERNS) {
    // Pattern muss jedes Mal frisch sein wegen global flag + lastIndex
    const regex = new RegExp(pattern.source, pattern.flags)
    const matches = [...text.matchAll(regex)]

    for (const match of matches) {
      const original = match[0]
      if (seen.has(original)) continue

      counters[prefix] = (counters[prefix] ?? 0) + 1
      const placeholder = `[${prefix}_${counters[prefix]}]`
      seen.set(original, placeholder)

      replacements.push({ type, placeholder, original })
    }
  }

  // Replacements anwenden — längste zuerst um Substring-Kollisionen zu vermeiden
  const sortedReplacements = [...replacements].sort(
    (a, b) => b.original.length - a.original.length
  )
  for (const r of sortedReplacements) {
    // Escape regex special chars im Original
    const escaped = r.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    redacted = redacted.replace(new RegExp(escaped, "g"), r.placeholder)
  }

  const applied = replacements.length > 0
  const typeCounts = replacements.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const summary = applied
    ? `Redacted: ${Object.entries(typeCounts)
        .map(([k, v]) => `${v}× ${k}`)
        .join(", ")}`
    : "not applied"

  return { redactedText: redacted, applied, replacements, summary }
}

/**
 * Re-Hydration: Placeholder im LLM-Output durch Originalwerte ersetzen.
 * Wird nach dem LLM-Call angewandt, damit der User den echten Text sieht.
 */
export function rehydrateText(
  text: string,
  replacements: RedactionReplacement[]
): string {
  let result = text
  for (const r of replacements) {
    result = result.replaceAll(r.placeholder, r.original)
  }
  return result
}
