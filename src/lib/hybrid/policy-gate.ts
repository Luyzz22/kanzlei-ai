import {
  CLOUD_SAFE_PAYLOAD_VERSION,
  CloudSafePayload,
  MinimizedFields,
  PolicyDecision,
  signCloudSafePayload,
  SignedCloudSafePayload,
} from "./cloud-safe-payload";

/** Output of one local detector (PII / NER / regex identifier / coverage / deny-list). */
export interface DetectorResult {
  name: string;
  version: string;
  /** true = this detector found something that must NOT reach the cloud. */
  flagged: boolean;
  /**
   * red   = hard secret (health data, mandate/case content, unremovable identifier)
   * amber = ambiguous entity, uncertain OCR, partial redaction
   * none  = nothing relevant found
   */
  severity: "none" | "amber" | "red";
  /** 0..1 coverage/confidence; below policy threshold on a required check => AMBER. */
  confidence: number;
  detail?: string;
}

export interface GateInput {
  jobRef: string;
  tenantScope: string;
  policyVersion: string;
  fields: MinimizedFields;
  detectors: DetectorResult[];
  /** tenant policy may forbid the cloud path entirely. */
  tenantAllowsCloud: boolean;
  /** required minimum coverage, e.g. 0.98. */
  minCoverage: number;
}

export interface GateOutcome {
  decision: PolicyDecision;
  reasons: string[];
  detectorVersions: Record<string, string>;
}

/**
 * Fail-closed policy gate. Default for anything unexpected is AMBER, never GREEN.
 *
 *   tenant forbids cloud .......... RED   (local-only / manual)
 *   any RED detector .............. RED
 *   flag without explicit severity. RED   (treated as hard secret — fail closed)
 *   no detectors ran .............. AMBER (local re-analysis / manual review)
 *   any AMBER / low coverage ...... AMBER
 *   ALL clear + tenant allows ..... GREEN (cloud eligible)
 */
export function evaluateGate(input: GateInput): GateOutcome {
  const reasons: string[] = [];
  const detectorVersions: Record<string, string> = {};
  for (const d of input.detectors) detectorVersions[d.name] = d.version;

  if (!input.tenantAllowsCloud) {
    return { decision: "RED", reasons: ["tenant_cloud_disabled"], detectorVersions };
  }
  if (input.detectors.length === 0) {
    return { decision: "AMBER", reasons: ["no_detectors_ran"], detectorVersions };
  }

  let red = false;
  let amber = false;
  for (const d of input.detectors) {
    if (d.severity === "red" || (d.flagged && d.severity === "none")) {
      red = true;
      reasons.push(`red:${d.name}`);
    } else if (d.severity === "amber" || d.flagged) {
      amber = true;
      reasons.push(`amber:${d.name}`);
    }
    if (d.confidence < input.minCoverage) {
      amber = true;
      reasons.push(`low_coverage:${d.name}`);
    }
  }

  if (red) return { decision: "RED", reasons, detectorVersions };
  if (amber) return { decision: "AMBER", reasons, detectorVersions };
  return { decision: "GREEN", reasons: ["all_clear"], detectorVersions };
}

/**
 * Builds + signs a CloudSafePayload ONLY when the gate is GREEN.
 * Throws on any non-GREEN decision — the cloud path cannot be entered otherwise.
 */
export function buildSignedPayload(
  input: GateInput,
  outcome: GateOutcome,
  tenantSigningKey: Buffer,
): SignedCloudSafePayload {
  if (outcome.decision !== "GREEN") {
    throw new Error(`refuse_to_build_payload:decision=${outcome.decision}`);
  }
  const body: CloudSafePayload = {
    version: CLOUD_SAFE_PAYLOAD_VERSION,
    jobRef: input.jobRef,
    tenantScope: input.tenantScope,
    decision: "GREEN",
    policyVersion: input.policyVersion,
    detectorVersions: outcome.detectorVersions,
    payload: input.fields,
    issuedAt: new Date().toISOString(),
  };
  return signCloudSafePayload(body, tenantSigningKey);
}
