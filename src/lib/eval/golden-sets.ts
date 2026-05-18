/**
 * Golden Sets für Continuous Evaluation (Phase 2A)
 *
 * Kuratierte Erwartungshaltungen pro Vertragstyp.
 * Jedes Golden Set definiert:
 * - Welche Finding-Kategorien MÜSSEN gefunden werden (mandatory)
 * - Welche Severity ist mindestens erwartet
 * - Welche Kategorien sollten NICHT fälschlich gefunden werden (forbidden)
 *
 * Wird gegen reale Analysen abgeglichen: Pass = alle mandatory gefunden, keine forbidden.
 */

export interface GoldenSetExpectation {
  /** Finding-Kategorie (muss mit AI-Output matchen) */
  category: string
  /** Minimale erwartete Severity */
  minSeverity: "niedrig" | "mittel" | "hoch"
  /** Beschreibung warum dieses Finding erwartet wird */
  rationale: string
}

export interface GoldenSet {
  id: string
  contractType: string
  displayName: string
  description: string
  /** Finding-Kategorien die GEFUNDEN werden MÜSSEN */
  mandatoryFindings: GoldenSetExpectation[]
  /** Finding-Kategorien die NICHT gefunden werden SOLLTEN (False Positives) */
  forbiddenCategories: string[]
  /** Minimale Gesamtkonfidenz die erwartet wird */
  minConfidence: number
}

export const GOLDEN_SETS: GoldenSet[] = [
  {
    id: "gs-ndavertrag",
    contractType: "NDA / Geheimhaltungsvertrag",
    displayName: "NDA / Geheimhaltung",
    description: "Standard-NDA mit typischen Risikobereichen: Vertragsstrafe, Rückgabepflichten, Laufzeit",
    mandatoryFindings: [
      { category: "Vertragsstrafe", minSeverity: "mittel", rationale: "Pauschale Vertragsstrafen in NDAs sind nach § 343 BGB regelmäßig problematisch" },
      { category: "Laufzeit / Kündigungsfrist", minSeverity: "niedrig", rationale: "Unbefristete oder sehr lange Geheimhaltungspflichten sind unüblich" },
      { category: "Definition vertraulicher Informationen", minSeverity: "niedrig", rationale: "Zu weite oder zu enge Definitionen sind ein häufiges Risiko" }
    ],
    forbiddenCategories: ["Gewährleistung", "Lieferverzug", "Produkthaftung"],
    minConfidence: 0.7
  },
  {
    id: "gs-dienstvertrag",
    contractType: "Dienstvertrag / Service Agreement",
    displayName: "Dienstvertrag",
    description: "IT-/Beratungs-Dienstvertrag mit SLA, Haftung, IP-Rechten",
    mandatoryFindings: [
      { category: "Haftungsbeschränkung", minSeverity: "mittel", rationale: "Haftungsbeschränkungen in Dienstverträgen sind Standard und müssen geprüft werden" },
      { category: "Leistungsbeschreibung / SLA", minSeverity: "niedrig", rationale: "Unklare SLAs führen zu Streit über Vertragserfüllung" },
      { category: "Geistiges Eigentum / IP", minSeverity: "mittel", rationale: "IP-Übertragung vs. Lizenz ist in Dienstverträgen kritisch" }
    ],
    forbiddenCategories: ["Gewährleistung für Sachen", "Lieferverzug"],
    minConfidence: 0.7
  },
  {
    id: "gs-kaufvertrag",
    contractType: "Kaufvertrag / Liefervertrag",
    displayName: "Kauf-/Liefervertrag",
    description: "Warenliefervertrag mit Gewährleistung, Lieferverzug, Eigentumsvorbehalten",
    mandatoryFindings: [
      { category: "Gewährleistung", minSeverity: "mittel", rationale: "Gewährleistungsausschlüsse oder -verkürzungen sind nach § 309 Nr. 8 BGB problematisch" },
      { category: "Haftungsbeschränkung", minSeverity: "mittel", rationale: "Haftungsbeschränkungen im Kaufrecht sind ein Kernrisiko" },
      { category: "Lieferverzug / Lieferfristen", minSeverity: "niedrig", rationale: "Fehlende oder unklare Verzugsregelungen sind typisch" }
    ],
    forbiddenCategories: ["SLA", "Geistiges Eigentum / IP"],
    minConfidence: 0.65
  },
  {
    id: "gs-mietvertrag",
    contractType: "Mietvertrag / Nutzungsvertrag",
    displayName: "Mietvertrag",
    description: "Gewerbemietvertrag mit Instandhaltung, Nebenkostenklauseln, Optionen",
    mandatoryFindings: [
      { category: "Kündigungsfrist / Laufzeit", minSeverity: "niedrig", rationale: "Lange Bindungsfristen und automatische Verlängerung sind risikoreich" },
      { category: "Instandhaltung / Schönheitsreparaturen", minSeverity: "niedrig", rationale: "Übertragung der Instandhaltungspflicht auf den Mieter ist häufig streitig" },
      { category: "Nebenkosten / Betriebskosten", minSeverity: "niedrig", rationale: "Intransparente Nebenkostenregelungen sind ein häufiges Streitthema" }
    ],
    forbiddenCategories: ["IP-Rechte", "Produkthaftung", "SLA"],
    minConfidence: 0.6
  },
  {
    id: "gs-arbeitsvertrag",
    contractType: "Arbeitsvertrag",
    displayName: "Arbeitsvertrag",
    description: "Standardarbeitsvertrag mit Wettbewerbsverbot, Überstunden, Kündigungsfristen",
    mandatoryFindings: [
      { category: "Wettbewerbsverbot / Nachvertragliches Wettbewerbsverbot", minSeverity: "mittel", rationale: "Nachvertragliche Wettbewerbsverbote erfordern Karenzentschädigung nach § 74 HGB" },
      { category: "Kündigungsfrist / Probezeit", minSeverity: "niedrig", rationale: "Abweichungen von gesetzlichen Kündigungsfristen müssen geprüft werden" },
      { category: "Vertraulichkeit / Geheimhaltung", minSeverity: "niedrig", rationale: "Zu weite Geheimhaltungsklauseln in Arbeitsverträgen sind problematisch" }
    ],
    forbiddenCategories: ["Lieferverzug", "Gewährleistung für Sachen", "Produkthaftung"],
    minConfidence: 0.65
  },
  {
    id: "gs-lizenzvertrag",
    contractType: "Lizenzvertrag / Softwarevertrag",
    displayName: "Lizenz-/Softwarevertrag",
    description: "SaaS/Software-Lizenzvertrag mit Nutzungsrechten, SLA, Datenschutz",
    mandatoryFindings: [
      { category: "Nutzungsrechte / Lizenzumfang", minSeverity: "mittel", rationale: "Einschränkungen der Nutzungsrechte sind ein Kernrisiko bei Softwareverträgen" },
      { category: "Haftungsbeschränkung", minSeverity: "mittel", rationale: "Haftungsausschlüsse bei Softwarefehlern sind regelmäßig prüfpflichtig" },
      { category: "Datenschutz / AV-Vertrag", minSeverity: "hoch", rationale: "Art. 28 DSGVO verlangt einen AVV bei Verarbeitung personenbezogener Daten" }
    ],
    forbiddenCategories: ["Lieferverzug", "Eigentumsvorbehalt"],
    minConfidence: 0.7
  },
  {
    id: "gs-rahmenvertrag",
    contractType: "Rahmenvertrag / MSA",
    displayName: "Rahmenvertrag / MSA",
    description: "Master Service Agreement mit Einzelabrufen, Preisanpassung, Laufzeit",
    mandatoryFindings: [
      { category: "Preisanpassung / Preiseskalation", minSeverity: "niedrig", rationale: "Einseitige Preisanpassungsklauseln sind nach § 307 BGB risikoreich" },
      { category: "Laufzeit / Kündigungsfrist", minSeverity: "niedrig", rationale: "Lange Bindungen mit automatischer Verlängerung erfordern Prüfung" },
      { category: "Haftungsbeschränkung", minSeverity: "mittel", rationale: "Haftungslimits im Rahmenvertrag gelten für alle Einzelabrufe" }
    ],
    forbiddenCategories: ["Produkthaftung"],
    minConfidence: 0.65
  },
  {
    id: "gs-dsgvo-avv",
    contractType: "Auftragsverarbeitungsvertrag (AVV)",
    displayName: "AVV / DPA",
    description: "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO mit TOMs, Sub-Auftragsverarbeiter",
    mandatoryFindings: [
      { category: "Technische und organisatorische Maßnahmen (TOMs)", minSeverity: "mittel", rationale: "Art. 32 DSGVO verlangt angemessene TOMs — pauschale Verweise sind unzureichend" },
      { category: "Sub-Auftragsverarbeiter", minSeverity: "mittel", rationale: "Art. 28 Abs. 2 DSGVO verlangt Genehmigungspflicht für Sub-Auftragsverarbeiter" },
      { category: "Löschung / Rückgabe", minSeverity: "niedrig", rationale: "Art. 28 Abs. 3 lit. g DSGVO verlangt Löschung nach Vertragsende" }
    ],
    forbiddenCategories: ["Lieferverzug", "Gewährleistung für Sachen", "Vertragsstrafe"],
    minConfidence: 0.75
  }
]

/**
 * Vergleicht eine reale Analyse gegen ein Golden Set.
 * Gibt Pass/Fail und detaillierte Ergebnisse zurück.
 */
export function evaluateAgainstGoldenSet(
  goldenSet: GoldenSet,
  analysisFindings: Array<{ category: string; severity: string; confidence: number | null }>
): {
  passed: boolean
  score: number
  mandatoryHits: number
  mandatoryTotal: number
  forbiddenViolations: string[]
  details: Array<{
    expected: GoldenSetExpectation
    found: boolean
    actualSeverity: string | null
    meetsMinSeverity: boolean
  }>
} {
  const severityRank: Record<string, number> = { niedrig: 1, mittel: 2, hoch: 3, NIEDRIG: 1, MITTEL: 2, HOCH: 3 }

  // Check mandatory findings
  const details = goldenSet.mandatoryFindings.map(expected => {
    const match = analysisFindings.find(f =>
      f.category.toLowerCase().includes(expected.category.toLowerCase()) ||
      expected.category.toLowerCase().includes(f.category.toLowerCase())
    )
    const found = !!match
    const actualSeverity = match?.severity ?? null
    const meetsMinSeverity = found && (severityRank[actualSeverity ?? ""] ?? 0) >= (severityRank[expected.minSeverity] ?? 0)
    return { expected, found, actualSeverity, meetsMinSeverity }
  })

  const mandatoryHits = details.filter(d => d.found).length
  const mandatoryTotal = goldenSet.mandatoryFindings.length
  const severityMet = details.filter(d => d.meetsMinSeverity).length

  // Check forbidden categories
  const forbiddenViolations = goldenSet.forbiddenCategories.filter(forbidden =>
    analysisFindings.some(f =>
      f.category.toLowerCase().includes(forbidden.toLowerCase())
    )
  )

  // Score: 60% mandatory coverage, 20% severity accuracy, 20% no forbidden
  const mandatoryScore = mandatoryTotal > 0 ? mandatoryHits / mandatoryTotal : 1
  const severityScore = mandatoryTotal > 0 ? severityMet / mandatoryTotal : 1
  const forbiddenScore = forbiddenViolations.length === 0 ? 1 : Math.max(0, 1 - forbiddenViolations.length * 0.25)
  const score = Math.round((mandatoryScore * 0.6 + severityScore * 0.2 + forbiddenScore * 0.2) * 100)

  const passed = mandatoryHits >= Math.ceil(mandatoryTotal * 0.8) && forbiddenViolations.length === 0

  return { passed, score, mandatoryHits, mandatoryTotal, forbiddenViolations, details }
}
