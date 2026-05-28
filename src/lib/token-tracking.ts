import "server-only"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type TokenSource = "analysis" | "copilot" | "ocr"

export async function trackTokenUsage(params: {
  tenantId: string
  userId: string
  source: TokenSource
  provider: string
  inputTokens: number
  outputTokens: number
  costCentsUsd?: number
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.tenantTokenUsage.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        source: params.source,
        provider: params.provider,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costCentsUsd: params.costCentsUsd ?? 0,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull
      }
    })
  } catch {
    // Non-critical — token tracking must not break the main flow
  }
}
