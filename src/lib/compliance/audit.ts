import "server-only"

import { prisma } from "@/lib/prisma"
import { writeAuditEventTx } from "@/lib/audit-write"
import { log } from "@/lib/security/secure-logging"
import type { ModelType } from "@/types/ai"

import type { RoutingDecision } from "./policy-decision"

/**
 * Auditierbarer Trail für Policy-Entscheidungen (Handoff Phase D).
 *
 * Bisher landeten die Entscheidungen des Gateways nur in flüchtigen
 * Anwendungslogs. Für die Betreiberpflichten nach Art. 26 EU-AI-Act
 * (Aufbewahrung automatisch erzeugter Protokolle über mindestens sechs Monate)
 * genügt das nicht — und für eine Aufsichtsanfrage ebenso wenig.
 *
 * Geschrieben wird über den vorhandenen `writeAuditEventTx`, der die
 * Hash-Kette (`prevHash`/`eventHash`) pflegt. Kein zweiter Audit-Pfad.
 *
 * ## Was hier NICHT hineingehört
 *
 * Kein Prompt, kein Dokument, kein Chunk, keine Antwort, kein Mandantenname.
 * Der Trail beantwortet „wer hat wann welche Entscheidung für welche
 * Datenklasse bekommen" — nicht „worum ging es". Genau das verlangt der
 * Handoff (Invariante 4) und genau daran scheitern typische
 * Observability-Stacks.
 */

export const POLICY_AUDIT_ACTION = "ai.policy_decision" as const
export const POLICY_AUDIT_RESOURCE = "ai_request" as const

export interface PolicyAuditInput {
  decision: RoutingDecision
  tenantId: string
  actorId: string
  useCase: string
  matterId?: string
  /** Der freigegebene Transport — null, wenn der Aufruf blockiert wurde. */
  modelType: ModelType | null
  /** true = Entscheidung wurde nur beobachtet, nicht erzwungen. */
  observedOnly: boolean
  /** Warum blockiert wurde, sofern blockiert (z. B. "no_local_model"). */
  blockDetail?: string
  /** Detektor-Name → Version, für die Nachvollziehbarkeit der Bewertung. */
  detectorVersions?: Record<string, string>
}

/**
 * Form der Audit-Metadaten.
 *
 * Bewusst als `type` mit konkreten Feldern statt `Record<string, unknown>`:
 * Prismas `InputJsonValue` ist eine rekursive Union über JSON-fähige Werte,
 * und `unknown` erfüllt sie nicht. Der präzise Typ dokumentiert zugleich, was
 * im Trail stehen darf — jedes Feld hier ist JSON-serialisierbar und
 * klartextfrei.
 */
export type PolicyAuditMetadata = {
  useCase: string
  classification: number
  action: string
  reason: string
  hardDeny: boolean
  gateDecision: string | null
  gateReasons: string[]
  policyVersion: string
  modelType: string | null
  observedOnly: boolean
  blockDetail: string | null
  detectorVersions: Record<string, string>
}

/**
 * Baut die Audit-Metadaten.
 *
 * Bewusst als eigene, **pure** Funktion: so lässt sich testen, dass hier kein
 * Klartext hineingerät, ohne eine Datenbank zu brauchen.
 */
export function buildPolicyAuditMetadata(input: PolicyAuditInput): PolicyAuditMetadata {
  return {
    useCase: input.useCase,
    classification: input.decision.classification,
    action: input.decision.action,
    reason: input.decision.reason,
    hardDeny: input.decision.hardDeny,
    gateDecision: input.decision.gateDecision ?? null,
    gateReasons: input.decision.gateReasons ?? [],
    policyVersion: input.decision.policyVersion,
    modelType: input.modelType,
    observedOnly: input.observedOnly,
    blockDetail: input.blockDetail ?? null,
    detectorVersions: input.detectorVersions ?? {}
  }
}

/**
 * Schreibt eine Policy-Entscheidung in den Audit-Trail.
 *
 * **Blockiert den Aufruf nicht, wenn das Schreiben scheitert.** Diese Wahl ist
 * bewusst und begründet: die Entscheidung selbst wird unabhängig vom Protokoll
 * durchgesetzt — ein Klasse-4-Deny bleibt ein Deny, auch wenn die Datenbank
 * gerade nicht erreichbar ist. Würde ein DB-Ausfall jeden KI-Aufruf abbrechen,
 * tauschte man ein Nachweisproblem gegen ein Verfügbarkeitsproblem.
 *
 * Fehlschläge werden auf `error` protokolliert, damit die Lücke sichtbar ist.
 * Für den Go-Live mit `AI_POLICY_ENFORCE=true` ist zu entscheiden, ob der
 * Trail dann verpflichtend wird — das ist eine Betreiber-, keine
 * Engineering-Entscheidung.
 */
export async function recordPolicyDecision(input: PolicyAuditInput): Promise<void> {
  try {
    await writeAuditEventTx(prisma, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: POLICY_AUDIT_ACTION,
      resourceType: POLICY_AUDIT_RESOURCE,
      resourceId: input.matterId ?? null,
      metadata: buildPolicyAuditMetadata(input)
    })
  } catch (error) {
    log.error("gateway.audit_write_failed", {
      useCase: input.useCase,
      tenantId: input.tenantId,
      classification: input.decision.classification,
      action: input.decision.action,
      code: error instanceof Error ? error.name : "UNKNOWN"
    })
  }
}
