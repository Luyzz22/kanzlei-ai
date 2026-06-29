import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * CloudSafePayload — the ONLY data structure permitted to cross the local→cloud
 * boundary. By construction it never carries the original document, page images,
 * attachments, document metadata, the re-identification mapping, or a speaking
 * tenant/mandate identifier.
 *
 * It is produced and signed exclusively by the PolicyGate (see policy-gate.ts).
 * Provider adapters MUST reject any payload that is not GREEN and not
 * signature-verified (see providers.ts).
 */

export const CLOUD_SAFE_PAYLOAD_VERSION = "1.0.0" as const;

export const PolicyDecisionEnum = z.enum(["GREEN", "AMBER", "RED"]);
export type PolicyDecision = z.infer<typeof PolicyDecisionEnum>;

/**
 * Minimized, redacted structured fields. No raw secrets. `redactedText` has been
 * coordinate-/text-redacted locally before this object exists. A supplier name or
 * tax id is only ever present if explicit tenant policy released it.
 */
export const MinimizedFieldsSchema = z
  .object({
    redactedText: z.string(),
    documentKind: z.enum(["invoice", "contract", "other"]),
    language: z.string().min(2).max(8).optional(),
  })
  .strict();
export type MinimizedFields = z.infer<typeof MinimizedFieldsSchema>;

export const CloudSafePayloadSchema = z
  .object({
    version: z.literal(CLOUD_SAFE_PAYLOAD_VERSION),
    // opaque, non-speaking correlation id — NOT the tenant id, NOT a mandate id
    jobRef: z.string().regex(/^job_[a-zA-Z0-9]{16,}$/),
    // hashed/opaque tenant scope — no PII, no speaking name
    tenantScope: z.string().regex(/^t_[a-f0-9]{8,}$/),
    // by construction only GREEN may ever be serialized into a payload
    decision: z.literal("GREEN"),
    policyVersion: z.string().min(1),
    detectorVersions: z.record(z.string(), z.string()),
    payload: MinimizedFieldsSchema,
    issuedAt: z.string().datetime(),
  })
  .strict();
export type CloudSafePayload = z.infer<typeof CloudSafePayloadSchema>;

export interface SignedCloudSafePayload {
  body: CloudSafePayload;
  /** base64 HMAC-SHA256 over canonical JSON of `body`, keyed per tenant. */
  signature: string;
}

/** Deterministic canonical JSON (recursively sorted keys) for stable signing. */
function canonical(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/** Validates, then signs. Never signs a malformed or over-broad payload. */
export function signCloudSafePayload(
  body: CloudSafePayload,
  tenantSigningKey: Buffer,
): SignedCloudSafePayload {
  CloudSafePayloadSchema.parse(body);
  const signature = createHmac("sha256", tenantSigningKey)
    .update(canonical(body))
    .digest("base64");
  return { body, signature };
}

export type VerifyResult =
  | { ok: true; body: CloudSafePayload }
  | { ok: false; reason: string };

/** Re-validates schema AND signature in constant time. */
export function verifyCloudSafePayload(
  signed: SignedCloudSafePayload,
  tenantSigningKey: Buffer,
): VerifyResult {
  const parsed = CloudSafePayloadSchema.safeParse(signed.body);
  if (!parsed.success) return { ok: false, reason: "schema_invalid" };

  const expected = createHmac("sha256", tenantSigningKey)
    .update(canonical(parsed.data))
    .digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(signed.signature, "base64");
  } catch {
    return { ok: false, reason: "signature_unparseable" };
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true, body: parsed.data };
}
