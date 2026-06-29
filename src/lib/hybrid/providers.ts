import { SignedCloudSafePayload, verifyCloudSafePayload } from "./cloud-safe-payload";

/**
 * Governance the provider adapter enforces at construction and call time.
 * These map 1:1 to the go-live evidence gates (region pinning, logging off,
 * versioned model id, no global deployment).
 */
export interface ProviderGovernance {
  /** allowlisted egress host (hostname only, no scheme, no path). */
  endpointHost: string;
  /** pinned region, e.g. "swedencentral" (Azure EU) or "eu-central-1" (Bedrock). */
  region: string;
  /** pinned, versioned model id; never a floating alias. */
  modelId: string;
  /** MUST be false in production; asserted at construction. */
  contentLoggingEnabled: boolean;
  /**
   * Azure:   "standard-regional" | "eu-datazone"
   * Bedrock: "in-region" | "eu-geo"
   * Anything containing "global" is rejected.
   */
  deploymentMode: string;
}

export interface CloudResult {
  /** strict JSON string per the invoice/contract schema; validated by the caller. */
  rawJson: string;
  modelId: string;
  providerRoute: string;
}

export interface CloudProvider {
  readonly route: string;
  /**
   * The ONLY entry point. Verifies signature, asserts GREEN, enforces governance,
   * then performs the minimal cloud call using only `body.payload`.
   * Never accepts an original document, image, or mapping (guaranteed by type).
   */
  invoke(signed: SignedCloudSafePayload, tenantSigningKey: Buffer): Promise<CloudResult>;
}

abstract class BaseRegionalProvider implements CloudProvider {
  abstract readonly route: string;

  protected constructor(protected readonly gov: ProviderGovernance) {
    if (gov.contentLoggingEnabled) {
      throw new Error("governance_violation:content_logging_must_be_off");
    }
    if (gov.deploymentMode.toLowerCase().includes("global")) {
      throw new Error("governance_violation:global_deployment_forbidden");
    }
    if (!/^[a-z0-9.-]+$/i.test(gov.endpointHost)) {
      throw new Error("governance_violation:endpoint_host_invalid");
    }
  }

  /** Verify signature + GREEN before any network egress. Throws on any doubt. */
  protected assertEligible(signed: SignedCloudSafePayload, key: Buffer): void {
    const v = verifyCloudSafePayload(signed, key);
    if (!v.ok) throw new Error(`payload_rejected:${v.reason}`);
    if (v.body.decision !== "GREEN") throw new Error("payload_rejected:not_green");
  }

  abstract invoke(signed: SignedCloudSafePayload, key: Buffer): Promise<CloudResult>;
}

export class AzureOpenAIProvider extends BaseRegionalProvider {
  readonly route = "azure-openai-primary";
  constructor(gov: ProviderGovernance) {
    super(gov);
  }

  async invoke(signed: SignedCloudSafePayload, key: Buffer): Promise<CloudResult> {
    this.assertEligible(signed, key);
    // WIRE HERE: HTTPS call to `this.gov.endpointHost` (egress-allowlisted),
    // region + model pinned, ContentLogging asserted false at deploy time.
    // Only `signed.body.payload.redactedText` is sent. No original document.
    throw new Error("not_implemented:wire_azure_call");
  }
}

export class BedrockProvider extends BaseRegionalProvider {
  readonly route = "bedrock-fallback";
  constructor(gov: ProviderGovernance) {
    super(gov);
  }

  async invoke(signed: SignedCloudSafePayload, key: Buffer): Promise<CloudResult> {
    this.assertEligible(signed, key);
    // WIRE HERE: model invocation logging OFF; in-region or eu-geo profile only
    // (global profile rejected at construction). Versioned model id pinned.
    throw new Error("not_implemented:wire_bedrock_call");
  }
}

/**
 * Routing rule: Azure -> Bedrock fallback is permitted ONLY because the same
 * signed, GREEN payload is independently re-verified by the Bedrock adapter.
 * A failed primary call NEVER downgrades policy or sends a non-GREEN payload
 * elsewhere; a policy/governance failure is never retried on the fallback.
 */
export async function routeWithFallback(
  signed: SignedCloudSafePayload,
  key: Buffer,
  primary: CloudProvider,
  fallback: CloudProvider,
): Promise<CloudResult> {
  try {
    return await primary.invoke(signed, key);
  } catch (err) {
    const msg = String(err instanceof Error ? err.message : err);
    if (msg.startsWith("payload_rejected") || msg.startsWith("governance_violation")) {
      throw err; // never fall back on a policy/governance failure
    }
    return await fallback.invoke(signed, key);
  }
}
