import { describe, it, expect } from "vitest";
import {
  evaluateGate,
  buildSignedPayload,
  type GateInput,
  type DetectorResult,
} from "../policy-gate";
import { verifyCloudSafePayload } from "../cloud-safe-payload";
import { AzureOpenAIProvider, type ProviderGovernance } from "../providers";

const KEY = Buffer.from("test-tenant-key-0123456789abcdef");

function input(detectors: DetectorResult[], over: Partial<GateInput> = {}): GateInput {
  return {
    jobRef: "job_abcdef0123456789",
    tenantScope: "t_deadbeef",
    policyVersion: "p1",
    fields: { redactedText: "Rechnung …", documentKind: "invoice" },
    detectors,
    tenantAllowsCloud: true,
    minCoverage: 0.98,
    ...over,
  };
}

describe("policy gate — fail closed", () => {
  it("RED on any hard secret", () => {
    expect(
      evaluateGate(input([{ name: "ner", version: "1", flagged: true, severity: "red", confidence: 1 }]))
        .decision,
    ).toBe("RED");
  });

  it("RED when tenant forbids cloud", () => {
    expect(
      evaluateGate(
        input([{ name: "ner", version: "1", flagged: false, severity: "none", confidence: 1 }], {
          tenantAllowsCloud: false,
        }),
      ).decision,
    ).toBe("RED");
  });

  it("AMBER when no detectors ran", () => {
    expect(evaluateGate(input([])).decision).toBe("AMBER");
  });

  it("AMBER on low coverage", () => {
    expect(
      evaluateGate(input([{ name: "pii", version: "1", flagged: false, severity: "none", confidence: 0.5 }]))
        .decision,
    ).toBe("AMBER");
  });

  it("flag without explicit severity is treated as RED (fail closed)", () => {
    expect(
      evaluateGate(input([{ name: "x", version: "1", flagged: true, severity: "none", confidence: 1 }]))
        .decision,
    ).toBe("RED");
  });

  it("GREEN only when all clear", () => {
    expect(
      evaluateGate(input([{ name: "pii", version: "1", flagged: false, severity: "none", confidence: 1 }]))
        .decision,
    ).toBe("GREEN");
  });
});

describe("signed payload", () => {
  const greenInput = input([{ name: "pii", version: "1", flagged: false, severity: "none", confidence: 1 }]);

  it("refuses to build unless GREEN", () => {
    const i = input([{ name: "x", version: "1", flagged: true, severity: "red", confidence: 1 }]);
    expect(() => buildSignedPayload(i, evaluateGate(i), KEY)).toThrow(/refuse_to_build_payload/);
  });

  it("builds + verifies a GREEN payload", () => {
    const signed = buildSignedPayload(greenInput, evaluateGate(greenInput), KEY);
    expect(verifyCloudSafePayload(signed, KEY).ok).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const signed = buildSignedPayload(greenInput, evaluateGate(greenInput), KEY);
    signed.body.payload.redactedText = "leaked secret";
    expect(verifyCloudSafePayload(signed, KEY).ok).toBe(false);
  });

  it("rejects a wrong tenant key", () => {
    const signed = buildSignedPayload(greenInput, evaluateGate(greenInput), KEY);
    expect(verifyCloudSafePayload(signed, Buffer.from("another-key-aaaaaaaaaaaaaaaaaaaa")).ok).toBe(false);
  });
});

describe("provider boundary", () => {
  const gov: ProviderGovernance = {
    endpointHost: "my-resource.openai.azure.com",
    region: "swedencentral",
    modelId: "gpt-4o-2024-11-20",
    contentLoggingEnabled: false,
    deploymentMode: "standard-regional",
  };
  const greenInput = input([{ name: "pii", version: "1", flagged: false, severity: "none", confidence: 1 }]);

  it("rejects construction when content logging is on", () => {
    expect(() => new AzureOpenAIProvider({ ...gov, contentLoggingEnabled: true })).toThrow(
      /content_logging_must_be_off/,
    );
  });

  it("rejects a global deployment mode", () => {
    expect(() => new AzureOpenAIProvider({ ...gov, deploymentMode: "global-standard" })).toThrow(
      /global_deployment_forbidden/,
    );
  });

  it("rejects an unsigned/forged payload before any egress", async () => {
    const p = new AzureOpenAIProvider(gov);
    const forged = { body: buildSignedPayload(greenInput, evaluateGate(greenInput), KEY).body, signature: "AAAA" };
    await expect(p.invoke(forged, KEY)).rejects.toThrow(/payload_rejected/);
  });

  it("passes a valid GREEN payload through to the (unwired) call", async () => {
    const p = new AzureOpenAIProvider(gov);
    const signed = buildSignedPayload(greenInput, evaluateGate(greenInput), KEY);
    await expect(p.invoke(signed, KEY)).rejects.toThrow(/not_implemented:wire_azure_call/);
  });
});
