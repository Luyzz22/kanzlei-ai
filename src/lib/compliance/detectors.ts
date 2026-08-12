import { pseudonymizeDocumentText } from "@/lib/ai/privacy-redaction"
import type { DetectorResult } from "@/lib/hybrid/policy-gate"

/**
 * Lokale Detektoren für den Policy Decision Point.
 *
 * Bis hierher gab es **keine** Stelle, die `DetectorResult[]` erzeugt —
 * `evaluateGate()` bekam immer eine leere Liste und antwortete deshalb
 * ausnahmslos `AMBER`. Fail-closed, aber blind.
 *
 * Diese Datei ist wie `policy-decision.ts` bewusst **pur**: kein Netzwerk,
 * keine DB, kein Modell. Die deterministischen Prüfungen brauchen keine GPU
 * und können deshalb vor der souveränen Zone ausgeliefert werden. Der
 * ML-gestützte Teil (NER auf Personen/Organisationen) fehlt noch und meldet
 * das offen — siehe `nerCoverageDetector`.
 *
 * Versionen sind mit `redaction_pipeline/config.py::DETECTOR_VERSIONS`
 * abgeglichen; `scripts/check-deny-terms-sync.mjs` erzwingt, dass die
 * Begriffslisten nicht auseinanderlaufen.
 */

/**
 * Gesundheits-/Diagnosebegriffe — § 203 StGB, Art. 9 DSGVO (besondere
 * Kategorien). Treffer bedeutet hartes Geheimnis, nie Cloud.
 *
 * Gespiegelt aus `redaction_pipeline/deny_terms.py::HEALTH_TERMS`.
 */
export const HEALTH_TERMS = [
  "diagnose",
  "befund",
  "icd-10",
  "icd10",
  "karzinom",
  "tumor",
  "depression",
  "hiv",
  "schwangerschaft",
  "arbeitsunfähig",
  "arbeitsunfähigkeit",
  "psychotherapie",
  "medikation",
  "krankschreibung",
  "schwerbehinderung",
  "suchterkrankung"
] as const

/**
 * Mandats-/Verfahrensgegenstand — anwaltliches Berufsgeheimnis.
 *
 * Gespiegelt aus `redaction_pipeline/deny_terms.py::MANDATE_TERMS`.
 */
export const MANDATE_TERMS = [
  "verfahrensgegenstand",
  "tatvorwurf",
  "beschuldigte",
  "beschuldigter",
  "ermittlungsverfahren",
  "anklageschrift",
  "scheidung",
  "insolvenzverfahren",
  "strafbefehl",
  "haftbefehl",
  "vergleichsverhandlung",
  "mandatsgegenstand"
] as const

/** Muss zu `redaction_pipeline/config.py::DETECTOR_VERSIONS` passen. */
export const DETECTOR_VERSIONS = {
  pii_regex: "1.2.0",
  health_terms: "1.0.0",
  mandate_terms: "1.0.0",
  ner_persons_orgs: "1.0.0"
} as const

function findTerms(textLower: string, terms: readonly string[]): string[] {
  return terms.filter((t) => textLower.includes(t)).sort()
}

/**
 * Direkte Identifikatoren (IBAN, Steuer-ID, USt-ID, E-Mail, Telefon).
 *
 * Nutzt bewusst die vorhandene Redaction statt eigene Patterns — zwei
 * Regex-Sätze für dieselbe Sache würden auseinanderlaufen.
 *
 * Treffer sind **amber**, nicht rot: Identifikatoren lassen sich
 * pseudonymisieren. Dass sie hier noch auftauchen, heisst aber, dass der Text
 * so nicht nach draussen darf.
 */
export function identifierDetector(text: string): DetectorResult {
  const result = pseudonymizeDocumentText(text)
  const types = [...new Set(result.replacements.map((r) => r.type))].sort()

  return {
    name: "pii_regex",
    version: DETECTOR_VERSIONS.pii_regex,
    flagged: types.length > 0,
    severity: types.length > 0 ? "amber" : "none",
    confidence: 1,
    detail: types.length > 0 ? `identifier_types:${types.join(",")}` : undefined
  }
}

/** Gesundheitsbegriffe — Treffer ist ein hartes Geheimnis (rot). */
export function healthTermDetector(text: string): DetectorResult {
  const hits = findTerms(text.toLowerCase(), HEALTH_TERMS)
  return {
    name: "health_terms",
    version: DETECTOR_VERSIONS.health_terms,
    flagged: hits.length > 0,
    severity: hits.length > 0 ? "red" : "none",
    confidence: 1,
    detail: hits.length > 0 ? `terms:${hits.length}` : undefined
  }
}

/** Mandats-/Verfahrensbegriffe — Treffer ist ein hartes Geheimnis (rot). */
export function mandateTermDetector(text: string): DetectorResult {
  const hits = findTerms(text.toLowerCase(), MANDATE_TERMS)
  return {
    name: "mandate_terms",
    version: DETECTOR_VERSIONS.mandate_terms,
    flagged: hits.length > 0,
    severity: hits.length > 0 ? "red" : "none",
    confidence: 1,
    detail: hits.length > 0 ? `terms:${hits.length}` : undefined
  }
}

/**
 * Abdeckungs-Melder für die noch fehlende NER-Schicht.
 *
 * Reguläre Ausdrücke finden Kontonummern, aber keine Personen- und
 * Firmennamen und keine indirekte Re-Identifizierbarkeit aus Rollen, Beträgen
 * und Zeitpunkten. Genau davor warnt das Rechtsgutachten: Pseudonymisierung
 * mindert Risiko, sie schafft keine Freigabe.
 *
 * Solange kein lokales Modell die NER übernimmt, meldet dieser Detektor eine
 * Abdeckung von 0. `evaluateGate()` wertet das als `low_coverage` → AMBER →
 * der Weg bleibt lokal. Das ist der ehrliche Zustand: **Klasse 2–3 darf erst
 * extern, wenn die souveräne Zone steht** (ADR-0002, Ausbaustufe 1).
 *
 * Sobald der lokale Worker NER liefert, ersetzt er diesen Melder — dann
 * steigt die Abdeckung und GREEN wird überhaupt erst erreichbar.
 */
export function nerCoverageDetector(): DetectorResult {
  const nerAvailable = process.env.AI_LOCAL_NER_ENABLED === "true"
  return {
    name: "ner_persons_orgs",
    version: DETECTOR_VERSIONS.ner_persons_orgs,
    flagged: false,
    severity: "none",
    // 0 liegt unter jeder sinnvollen minCoverage → erzwingt AMBER.
    confidence: nerAvailable ? 1 : 0,
    detail: nerAvailable ? undefined : "local_ner_not_deployed"
  }
}

/**
 * Führt alle lokalen Detektoren aus.
 *
 * Reihenfolge ist bedeutungslos — `evaluateGate()` aggregiert über alle
 * Ergebnisse und nimmt das strengste.
 */
export function runLocalDetectors(text: string): DetectorResult[] {
  return [
    identifierDetector(text),
    healthTermDetector(text),
    mandateTermDetector(text),
    nerCoverageDetector()
  ]
}
