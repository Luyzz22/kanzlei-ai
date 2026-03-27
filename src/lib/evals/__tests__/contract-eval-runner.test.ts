import test from "node:test"
import assert from "node:assert/strict"

import {
  buildSyntheticEvalPipelineSuccess,
  scoreContractEvalCase,
  type ContractEvalCaseFile
} from "@/lib/evals/contract-eval-runner"

test("Synthetic Eval-Payload erfüllt Sample-Erwartungen", () => {
  const evalCase: ContractEvalCaseFile = {
    id: "t",
    documentText: "x",
    expected: {
      contractTypeIncludes: "Miet",
      minParties: 1,
      minLegalTopics: 1,
      minFindings: 1,
      findingTitleIncludes: ["Kündigung"]
    }
  }
  const pipeline = buildSyntheticEvalPipelineSuccess(evalCase.documentText)
  const metrics = scoreContractEvalCase(evalCase, pipeline, 12)
  assert.equal(metrics.schemaValidExtraction, true)
  assert.equal(metrics.schemaValidRisk, true)
  assert.equal(metrics.passed, true)
})
