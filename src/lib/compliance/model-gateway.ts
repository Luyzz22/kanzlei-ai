import "server-only"

import { getTenantAiGovernance } from "@/lib/ai/tenant-ai-governance"
import { isModelTypeAvailable } from "@/lib/ai/provider-availability"
import type { DetectorResult } from "@/lib/hybrid/policy-gate"
import { runLocalDetectors } from "./detectors"
import { log } from "@/lib/security/secure-logging"
import { ModelType } from "@/types/ai"

import {
  decideRouting,
  POLICY_VERSION,
  type RoutingDecision,
  type SensitivityClass
} from "./policy-decision"

/**
 * Model Gateway — der einzige Ort, an dem entschieden wird, ob und wohin ein
 * Modellaufruf gehen darf.
 *
 * Jeder Aufruf erzeugt eine `RoutingDecision`, bevor ein Transport angefasst
 * wird, und schreibt einen Audit-Eintrag **ohne Klartext**.
 *
 * ## Durchsetzungsgrad (Stand dieses Standes)
 *
 * - **Klasse 4 wird immer durchgesetzt.** Kein ENV, keine Tenant-Einstellung
 *   und kein Override kann das aufheben. Ist kein lokales Modell konfiguriert,
 *   scheitert der Vorgang — Klasse-4-Inhalte gehen nicht ersatzweise nach aussen.
 * - **Klasse 0–3 wird derzeit nur beobachtet**, solange `AI_POLICY_ENFORCE`
 *   nicht auf `true` steht. Grund ist kein Zögern in der Sache, sondern die
 *   Infrastruktur: die souveräne Zone (Hetzner/On-Prem) existiert noch nicht,
 *   eine Entscheidung „LOCAL" wäre heute nicht ausführbar. Beobachtete
 *   Blockaden werden als `gateway.policy_would_block` protokolliert.
 *
 * Das Umlegen von `AI_POLICY_ENFORCE=true` ist das Go-Live-Tor, sobald lokale
 * Modelle bereitstehen. Bis dahin zeigen die Logs exakt, was dann blockiert
 * würde.
 */

export class PolicyViolationError extends Error {
  readonly code = "POLICY_VIOLATION"
  constructor(
    readonly decision: RoutingDecision,
    message?: string
  ) {
    super(
      message ??
        `Modellaufruf blockiert: ${decision.reason} (Klasse ${decision.classification})`
    )
    this.name = "PolicyViolationError"
  }
}

export interface AuthorizeAiRequestInput {
  /** Datenklasse des zu verarbeitenden Inhalts. Pflicht — keine Vermutung. */
  classification: SensitivityClass
  tenantId: string
  actorId: string
  /** z. B. "copilot", "contract-analysis" — landet im Audit. */
  useCase: string
  matterId?: string
  /**
   * Der zu verarbeitende Text. Wird lokal durch die Detektoren geschickt —
   * er verlässt die Zone dabei nicht und landet **nicht** im Audit-Log.
   *
   * Bewusst hier statt beim Aufrufer: liefe `runLocalDetectors()` in den
   * Routen, könnte ein künftiger Aufrufer es vergessen und bekäme still eine
   * Entscheidung ohne Detektoren.
   */
  content?: string
  /** Bereits vorliegende Detektorergebnisse. Übersteuert `content`. */
  detectors?: DetectorResult[]
}

export interface AuthorizedAiRequest {
  decision: RoutingDecision
  /** Der Transport, der benutzt werden darf. */
  modelType: ModelType
  /** true = Entscheidung wurde nur beobachtet, nicht erzwungen. */
  observedOnly: boolean
}

function enforcementEnabled(): boolean {
  return process.env.AI_POLICY_ENFORCE === "true"
}

/**
 * Prüft einen geplanten Modellaufruf und liefert den zulässigen Transport.
 *
 * Wirft `PolicyViolationError`, wenn der Aufruf nicht stattfinden darf.
 * Streamende Aufrufer nutzen diese Funktion und übernehmen den Transport
 * selbst; nicht-streamende können `executeAiRequest` verwenden.
 */
export async function authorizeAiRequest(
  input: AuthorizeAiRequestInput
): Promise<AuthorizedAiRequest> {
  const governance = await getTenantAiGovernance(input.tenantId)
  const detectors =
    input.detectors ?? (input.content !== undefined ? runLocalDetectors(input.content) : undefined)

  const decision = decideRouting({
    classification: input.classification,
    governance,
    detectors
  })

  const auditBase = {
    useCase: input.useCase,
    tenantId: input.tenantId,
    actorId: input.actorId,
    matterId: input.matterId,
    classification: decision.classification,
    action: decision.action,
    reason: decision.reason,
    hardDeny: decision.hardDeny,
    gateDecision: decision.gateDecision,
    policyVersion: POLICY_VERSION
  }

  const localAvailable = isModelTypeAvailable(ModelType.LLAMA_COMPAT)
  const externalAvailable = isModelTypeAvailable(ModelType.CLAUDE_SONNET_4)

  // ── Klasse 4: unbedingt, unabhängig vom Durchsetzungsmodus ───────────────
  if (decision.hardDeny) {
    if (!localAvailable) {
      log.warn("gateway.policy_blocked", { ...auditBase, detail: "no_local_model" })
      throw new PolicyViolationError(
        decision,
        "Klasse-4-Inhalt erfordert ein lokales Modell. Es ist keines konfiguriert " +
          "(LLAMA_API_KEY + LLAMA_API_BASE). Der Vorgang wird nicht ersatzweise " +
          "extern ausgeführt."
      )
    }
    log.info("gateway.policy_decision", auditBase)
    return { decision, modelType: ModelType.LLAMA_COMPAT, observedOnly: false }
  }

  // ── Klasse 0–3 ───────────────────────────────────────────────────────────
  if (decision.action === "EXTERNAL") {
    if (!externalAvailable) {
      log.warn("gateway.policy_blocked", { ...auditBase, detail: "no_external_model" })
      throw new PolicyViolationError(decision, "Kein zugelassener externer Anbieter konfiguriert.")
    }
    log.info("gateway.policy_decision", auditBase)
    return { decision, modelType: ModelType.CLAUDE_SONNET_4, observedOnly: false }
  }

  // action === "LOCAL" (oder BLOCKED) für Klasse 0–3
  if (localAvailable) {
    log.info("gateway.policy_decision", auditBase)
    return { decision, modelType: ModelType.LLAMA_COMPAT, observedOnly: false }
  }

  if (enforcementEnabled()) {
    log.warn("gateway.policy_blocked", { ...auditBase, detail: "no_local_model" })
    throw new PolicyViolationError(
      decision,
      `Die Policy verlangt lokale Verarbeitung (${decision.reason}), es ist aber ` +
        "kein lokales Modell konfiguriert."
    )
  }

  // Beobachtungsmodus: die Entscheidung wäre LOCAL, ist aber nicht ausführbar.
  // Der Aufruf läuft extern weiter — sichtbar protokolliert, nicht verschwiegen.
  if (!externalAvailable) {
    log.warn("gateway.policy_blocked", { ...auditBase, detail: "no_provider_at_all" })
    throw new PolicyViolationError(decision, "Kein Anbieter konfiguriert.")
  }

  log.warn("gateway.policy_would_block", {
    ...auditBase,
    detail: "local_required_but_unavailable",
    executedVia: "external",
    hint: "AI_POLICY_ENFORCE=true blockiert diesen Fall, sobald lokale Modelle stehen"
  })
  return { decision, modelType: ModelType.CLAUDE_SONNET_4, observedOnly: true }
}
