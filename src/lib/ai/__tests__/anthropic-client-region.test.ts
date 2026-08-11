import test from "node:test"
import assert from "node:assert/strict"

import {
  BedrockRegionPolicyError,
  EU_BEDROCK_REGIONS,
  resolveBedrockRegion
} from "@/lib/ai/anthropic-client"

function withEnv(env: Record<string, string | undefined>, run: () => void) {
  const previous = {
    AWS_BEDROCK_REGION: process.env.AWS_BEDROCK_REGION,
    AWS_REGION: process.env.AWS_REGION
  }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  try {
    run()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test("EU-Region wird akzeptiert", () => {
  withEnv({ AWS_BEDROCK_REGION: "eu-central-1", AWS_REGION: undefined }, () => {
    assert.equal(resolveBedrockRegion(), "eu-central-1")
  })
})

test("fehlende Region blockiert statt auf US-Default zurückzufallen", () => {
  withEnv({ AWS_BEDROCK_REGION: undefined, AWS_REGION: undefined }, () => {
    assert.throws(() => resolveBedrockRegion(), BedrockRegionPolicyError)
  })
})

test("us-east-1 wird abgelehnt — kein stiller US-Egress", () => {
  withEnv({ AWS_BEDROCK_REGION: "us-east-1", AWS_REGION: undefined }, () => {
    assert.throws(() => resolveBedrockRegion(), BedrockRegionPolicyError)
  })
})

test("AWS_REGION als Fallback nur, wenn es eine EU-Region ist", () => {
  withEnv({ AWS_BEDROCK_REGION: undefined, AWS_REGION: "eu-west-1" }, () => {
    assert.equal(resolveBedrockRegion(), "eu-west-1")
  })
  withEnv({ AWS_BEDROCK_REGION: undefined, AWS_REGION: "us-west-2" }, () => {
    assert.throws(() => resolveBedrockRegion(), BedrockRegionPolicyError)
  })
})

test("London und Zürich zählen nicht als EU-Mitgliedstaat", () => {
  for (const region of ["eu-west-2", "eu-central-2"]) {
    withEnv({ AWS_BEDROCK_REGION: region, AWS_REGION: undefined }, () => {
      assert.throws(
        () => resolveBedrockRegion(),
        BedrockRegionPolicyError,
        `${region} darf nicht per eu-Präfix durchrutschen`
      )
    })
  }
})

test("Allowlist enthält ausschliesslich EU-Mitgliedstaat-Regionen", () => {
  assert.ok(EU_BEDROCK_REGIONS.includes("eu-central-1"))
  assert.equal((EU_BEDROCK_REGIONS as readonly string[]).includes("eu-west-2"), false)
  assert.equal((EU_BEDROCK_REGIONS as readonly string[]).includes("eu-central-2"), false)
})
