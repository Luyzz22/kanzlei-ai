import type { SensitivityClass } from "./policy-decision"

/**
 * Provider-Governance als harte Datenbasis (Compliance-Handoff A2).
 *
 * Bisher entschied ein ENV-Flag darüber, ob ein externer Anbieter benutzt
 * werden darf. Ob mit ihm eine § 43e-BRAO-Vereinbarung besteht, ein AVV
 * unterschrieben ist, ein Transfer Impact Assessment vorliegt — oder ob eine
 * dieser Freigaben abgelaufen ist — wurde nirgends geprüft. Ein Flag ersetzte
 * eine Vertragslage.
 *
 * Diese Datei prüft es. Sie **entscheidet nicht**, ob ein Anbieter rechtlich
 * zulässig ist — das ist ausdrücklich keine Engineering-Entscheidung
 * (Handoff, Abschnitt 8). Sie erzwingt nur, dass jemand Zuständiges die
 * Prüfung dokumentiert hat, und sperrt, solange das nicht der Fall ist.
 *
 * Wie `policy-decision.ts` bewusst **pur**: keine DB, kein Netzwerk. Das
 * Laden übernimmt der Aufrufer.
 */

export type ProviderVerificationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "SUSPENDED"
  | "EXPIRED"

export type ProviderTrustTier = "LOCAL" | "EU_SOVEREIGN" | "EU_CONTROLLED" | "THIRD_COUNTRY"

/**
 * Die für eine Freigabe relevanten Nachweise.
 *
 * Alle Felder sind bewusst **Nachweise, keine Absichten**: `noTrainingVerified`
 * heisst „jemand hat geprüft und dokumentiert", nicht „der Anbieter sagt es
 * auf seiner Webseite".
 */
export interface ProviderProfileSnapshot {
  provider: string
  trustTier: ProviderTrustTier
  verificationStatus: ProviderVerificationStatus
  /** Datenklassen, für die dieses Profil freigegeben wurde. */
  allowedDataClasses: number[]
  euDataBoundaryVerified: boolean
  noTrainingVerified: boolean
  zeroRetentionVerified: boolean
  noHumanAccessVerified: boolean
  abuseMonitoringDisabled: boolean
  supportEuOnlyVerified: boolean
  section43eAgreementSignedAt: Date | null
  dpaSignedAt: Date | null
  tiaApprovedAt: Date | null
  expiresAt: Date | null
}

export interface ProviderEligibility {
  eligible: boolean
  /** Maschinenlesbarer Grund; landet im Audit-Trail. */
  reason: string
  /** Alle fehlenden Nachweise, nicht nur der erste — für Admin-Workflows. */
  missing: string[]
}

/**
 * Nachweise, die ab einer Datenklasse verlangt werden.
 *
 * Klasse 0–1 berührt kein Berufsgeheimnis; dort genügt ein verifiziertes,
 * nicht abgelaufenes Profil. Ab Klasse 2 kommen die datenschutzrechtlichen
 * Nachweise dazu, ab Klasse 3 die berufsrechtliche Vertragskette.
 */
const TECHNICAL_EVIDENCE: Array<keyof ProviderProfileSnapshot> = [
  "euDataBoundaryVerified",
  "noTrainingVerified",
  "zeroRetentionVerified",
  "noHumanAccessVerified"
]

const CONTRACT_EVIDENCE: Array<keyof ProviderProfileSnapshot> = [
  "section43eAgreementSignedAt",
  "dpaSignedAt",
  "tiaApprovedAt"
]

/**
 * Prüft, ob ein Profil einen Aufruf dieser Datenklasse trägt.
 *
 * Fail closed: fehlt das Profil, ist es nicht `VERIFIED`, abgelaufen oder
 * fehlt ein für die Klasse nötiger Nachweis, ist die Antwort „nein" — mit
 * Begründung, damit ein Admin weiss, was zu tun ist.
 */
export function isProviderEligible(
  profile: ProviderProfileSnapshot | null,
  classification: SensitivityClass,
  now: Date = new Date()
): ProviderEligibility {
  if (!profile) {
    return {
      eligible: false,
      reason: "PROVIDER_PROFILE_MISSING",
      missing: ["profile"]
    }
  }

  if (profile.verificationStatus !== "VERIFIED") {
    return {
      eligible: false,
      reason: `PROVIDER_NOT_VERIFIED:${profile.verificationStatus}`,
      missing: ["verificationStatus"]
    }
  }

  if (profile.expiresAt !== null && profile.expiresAt.getTime() <= now.getTime()) {
    // Abgelaufene Evidenz ist keine Evidenz. Genau dafür gibt es das Feld:
    // eine einmal erteilte Freigabe darf nicht unbefristet weitergelten.
    return {
      eligible: false,
      reason: "PROVIDER_EVIDENCE_EXPIRED",
      missing: ["expiresAt"]
    }
  }

  if (!profile.allowedDataClasses.includes(classification)) {
    return {
      eligible: false,
      reason: `PROVIDER_CLASS_NOT_ALLOWED:${classification}`,
      missing: ["allowedDataClasses"]
    }
  }

  const missing: string[] = []

  if (classification >= 2) {
    for (const key of TECHNICAL_EVIDENCE) {
      if (profile[key] !== true) missing.push(String(key))
    }
  }

  if (classification >= 3) {
    for (const key of CONTRACT_EVIDENCE) {
      if (profile[key] === null || profile[key] === undefined) missing.push(String(key))
    }
  }

  if (missing.length > 0) {
    return { eligible: false, reason: "PROVIDER_EVIDENCE_INCOMPLETE", missing }
  }

  return { eligible: true, reason: "PROVIDER_VERIFIED", missing: [] }
}

/**
 * Prüft, ob ein Profil demnächst abläuft — für Admin-Warnungen, bevor der
 * Betrieb unangekündigt stehenbleibt.
 */
export function expiresWithin(
  profile: ProviderProfileSnapshot | null,
  days: number,
  now: Date = new Date()
): boolean {
  if (!profile?.expiresAt) return false
  const deadline = now.getTime() + days * 24 * 60 * 60 * 1000
  return profile.expiresAt.getTime() <= deadline
}
