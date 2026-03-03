import { ModelType } from "@/types/ai"

const pricingPer1kTokens: Record<ModelType, number> = {
  [ModelType.CLAUDE_SONNET_4]: 0.015,
  [ModelType.GEMINI_2_5_PRO]: 0.01,
  [ModelType.GPT_4O_MINI]: 0.0015
}

interface AggregateKey {
  userId: string
  period: string
}

interface AggregateEntry {
  tokens: number
  cost: number
}

const usageStats = new Map<string, AggregateEntry>()

function makeKey(key: AggregateKey): string {
  return `${key.userId}:${key.period}`
}

export function calculateCost(model: ModelType, tokensUsed: number): number {
  const unitPrice = pricingPer1kTokens[model]
  return Number(((tokensUsed / 1000) * unitPrice).toFixed(6))
}

export function trackUsage(params: {
  userId: string
  model: ModelType
  tokensUsed: number
  createdAt?: Date
}): AggregateEntry {
  const date = params.createdAt ?? new Date()
  const period = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
  const key = makeKey({ userId: params.userId, period })
  const current = usageStats.get(key) ?? { tokens: 0, cost: 0 }
  const cost = calculateCost(params.model, params.tokensUsed)

  const next = {
    tokens: current.tokens + params.tokensUsed,
    cost: Number((current.cost + cost).toFixed(6))
  }

  usageStats.set(key, next)
  return next
}

export function getUsageStats(userId: string, period: string): AggregateEntry {
  return usageStats.get(makeKey({ userId, period })) ?? { tokens: 0, cost: 0 }
}
