import test from "node:test"
import assert from "node:assert/strict"

import { formatStageFailureMessage } from "@/lib/ai/pipeline-failure-messages"

test("formatStageFailureMessage: AUTH", () => {
  const msg = formatStageFailureMessage([
    {
      wasSuccessful: false,
      errorCode: "AUTH",
      model: "claude-sonnet-4-5-20250929"
    }
  ])
  assert.match(msg, /ANTHROPIC_API_KEY/)
})

test("formatStageFailureMessage: MODEL_NOT_FOUND", () => {
  const msg = formatStageFailureMessage([
    {
      wasSuccessful: false,
      errorCode: "MODEL_NOT_FOUND",
      model: "claude-sonnet-4-6-20260217"
    }
  ])
  assert.match(msg, /4-5-20250929/)
})
