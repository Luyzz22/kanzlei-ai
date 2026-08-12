import { evaluateGate, type DetectorResult } from "@/lib/hybrid/policy-gate"
import type { TenantAiGovernance } from "@/lib/ai/tenant-ai-governance"

import { isProviderEligible, type ProviderProfileSnapshot } from "./provider-profile"

/**
 * Policy Decision Point — die Entscheidung, ob ein Modellaufruf lokal, extern
 * oder gar nicht laufen darf.
 *
 * Diese Datei ist bewusst **pur**: keine Datenbank, kein Netzwerk, kein
 * `server-only`. Alle Eingaben werden übergeben. Eine Compliance-Entscheidung,
 * die man nicht vollständig durchtesten kann, ist keine Kontrolle.
 *
 * Abgrenzung zu `@/lib/hybrid/policy-gate`: dort heisst `PolicyDecision`
 * GREEN/AMBER/RED und beschreibt das Ergebnis der *Detektorprüfung* eines
 * bereits minimierten Payloads. Hier geht es eine Ebene höher um die
 * *Wegewahl*. Das Gate ist eine Eingabe dieser Entscheidung, nicht ihr Ersatz.
 */

/**
 * Datenklassen nach Compliance-Handoff.
 *
 * 0 — öffentlich oder belastbar anonymisiert
 * 1 — intern, kein Mandatsbezug
 * 2 — personenbezogen ohne Mandatskontext
 * 3 — mandatsbezogen, berufsgeheimnispflichtig (anwaltlicher Standardfall)
 * 4 — Strafverteidigung, M&A, Internal Investigations, Gesundheitsdaten,
 *     Geschäftsgeheimnisse, laufende Verhandlungen
 */
export type SensitivityClass = 0 | 1 | 2 | 3 | 4

export type RoutingAction = "LOCAL" | "EXTERNAL" | "BLOCKED"

export const POLICY_VERSION = "2026-08-11.1" as const

export interface RoutingDecision {
  action: RoutingAction
  /** Maschinenlesbarer Grund; landet im Audit-Log. */
  reason: string
  classification: SensitivityClass
  policyVersion: string
  /** true = Klasse-4-Regel hat entschieden; niemals überstimmbar. */
  hardDeny: boolean
  /** Ergebnis des Detektor-Gates, sofern es konsultiert wurde. */
  gateDecision?: "GREEN" | "AMBER" | "RED"
  gateReasons?: string[]
  /** Fehlende Anbieter-Nachweise — fuer Admin-Workflows, nicht fuer Endnutzer. */
  missingProviderEvidence?: string[]
}

export interface RoutingInput {
  classification: SensitivityClass
  governance: TenantAiGovernance
  /**
   * Freigabeprofil des externen Anbieters. `null`/fehlend bedeutet: keine
   * dokumentierte Prüfung — dann bleibt der Weg lokal. Ein ENV-Flag ersetzt
   * keine Vertragslage (Handoff A2).
   */
  providerProfile?: ProviderProfileSnapshot | null
  /**
   * Lokale Detektorergebnisse für Klasse 2–3. Leer/undefined bedeutet
   * „keine Detektoren gelaufen" — das Gate antwortet dann AMBER und der
   * Weg bleibt lokal. Fail closed by construction.
   */
  detectors?: DetectorResult[]
  /** Geforderte Mindest-Abdeckung der Detektoren, Default 0.98. */
  minCoverage?: number
  /** Referenzzeitpunkt fuer Ablaufpruefungen; injizierbar fuer Tests. */
  now?: Date
}

const DEFAULT_MIN_COVERAGE = 0.98

function isValidClass(value: unknown): value is SensitivityClass {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4
}

/**
 * Trifft die Wegeentscheidung.
 *
 * Reihenfolge ist bedeutsam — die harten Verbote stehen vorn und sind durch
 * keine Tenant-Einstellung, kein ENV und keinen Override erreichbar:
 *
 *   ungültige Klasse ............ LOCAL    (fail closed)
 *   Klasse 4 .................... LOCAL    (hartes Egress-Verbot)
 *   Klasse 3, kein Cloud-Opt-in . LOCAL
 *   Klasse 2–3 + Opt-in ......... Detektor-Gate: GREEN → EXTERNAL, sonst LOCAL
 *   Klasse 0–1 .................. EXTERNAL (kein Berufsgeheimnis betroffen)
 */
export function decideRouting(input: RoutingInput): RoutingDecision {
  const base = { policyVersion: POLICY_VERSION, hardDeny: false }

  if (!isValidClass(input.classification)) {
    return {
      ...base,
      action: "LOCAL",
      reason: "INVALID_CLASSIFICATION",
      classification: 4,
      hardDeny: true
    }
  }

  const classification = input.classification

  // Klasse 4: hartes Egress-Verbot. Bewusst vor jeder Tenant-Prüfung —
  // eine Kanzlei kann sich das nicht freischalten.
  if (classification === 4) {
    return {
      ...base,
      action: "LOCAL",
      reason: "CLASS_4_HARD_EGRESS_DENY",
      classification,
      hardDeny: true
    }
  }

  // Jeder externe Weg — auch für harmlose Klassen — setzt ein geprüftes,
  // nicht abgelaufenes Anbieterprofil voraus.
  const providerCheck = isProviderEligible(
    input.providerProfile ?? null,
    classification,
    input.now
  )

  if (classification <= 1) {
    if (!providerCheck.eligible) {
      return {
        ...base,
        action: "LOCAL",
        reason: providerCheck.reason,
        classification,
        missingProviderEvidence: providerCheck.missing
      }
    }
    return { ...base, action: "EXTERNAL", reason: "CLASS_0_1_NO_SECRET", classification }
  }

  // Klasse 2–3: externer Weg nur mit ausdrücklicher Freigabe des Tenants.
  if (!input.governance.allowThirdCountryLlmTransfer) {
    return {
      ...base,
      action: "LOCAL",
      reason: "TENANT_POLICY_LOCAL_ONLY",
      classification
    }
  }

  // Detektor-Gate. Ohne gelaufene Detektoren antwortet evaluateGate mit AMBER,
  // der Weg bleibt also lokal — das ist beabsichtigt, nicht ein Versehen.
  const outcome = evaluateGate({
    jobRef: "routing",
    tenantScope: "routing",
    policyVersion: POLICY_VERSION,
    // `evaluateGate` wertet ausschliesslich detectors/tenantAllowsCloud/
    // minCoverage aus; `fields` wird erst von `buildSignedPayload` gelesen.
    // Hier steht deshalb ein Platzhalter — es wird nichts serialisiert.
    fields: { redactedText: "", documentKind: "other" },
    detectors: input.detectors ?? [],
    tenantAllowsCloud: true,
    minCoverage: input.minCoverage ?? DEFAULT_MIN_COVERAGE
  })

  if (outcome.decision !== "GREEN") {
    return {
      ...base,
      action: "LOCAL",
      reason:
        outcome.decision === "RED"
          ? "RESIDUAL_SECRET_DETECTED"
          : "RESIDUAL_REIDENTIFICATION_RISK",
      classification,
      gateDecision: outcome.decision,
      gateReasons: outcome.reasons
    }
  }

  // Detektoren sagen „unbedenklich" — das genügt nicht. Der Anbieter muss für
  // genau diese Datenklasse freigegeben sein, mit den ab Klasse 2 technischen
  // und ab Klasse 3 vertraglichen Nachweisen.
  if (!providerCheck.eligible) {
    return {
      ...base,
      action: "LOCAL",
      reason: providerCheck.reason,
      classification,
      gateDecision: "GREEN",
      gateReasons: outcome.reasons,
      missingProviderEvidence: providerCheck.missing
    }
  }

  return {
    ...base,
    action: "EXTERNAL",
    reason: "GATE_GREEN",
    classification,
    gateDecision: "GREEN",
    gateReasons: outcome.reasons
  }
}
