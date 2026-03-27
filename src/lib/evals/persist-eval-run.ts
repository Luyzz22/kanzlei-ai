import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type EvalResultRowInput = {
  caseId: string
  providerLabel: string | null
  modelLabel: string | null
  promptVersion: string | null
  metrics: Record<string, unknown>
  passed: boolean
  latencyMs: number | null
  costEstimate: number | null
}

export async function persistContractEvalRun(input: {
  name: string
  evaluatorName: string
  overallPassed: boolean
  reportJson: Prisma.InputJsonValue
  configSnapshot?: Prisma.InputJsonValue
  rows: EvalResultRowInput[]
}): Promise<{ id: string }> {
  const run = await prisma.evalRun.create({
    data: {
      name: input.name.slice(0, 200),
      evaluatorName: input.evaluatorName.slice(0, 64),
      passed: input.overallPassed,
      completedAt: new Date(),
      reportJson: input.reportJson,
      configSnapshot: input.configSnapshot ?? undefined
    }
  })

  if (input.rows.length > 0) {
    await prisma.evalResultRow.createMany({
      data: input.rows.map((r) => ({
        evalRunId: run.id,
        caseId: r.caseId.slice(0, 120),
        providerLabel: r.providerLabel,
        modelLabel: r.modelLabel,
        promptVersion: r.promptVersion,
        metricsJson: r.metrics as Prisma.InputJsonValue,
        passed: r.passed,
        latencyMs: r.latencyMs,
        costEstimate: r.costEstimate
      }))
    })
  }

  return { id: run.id }
}
