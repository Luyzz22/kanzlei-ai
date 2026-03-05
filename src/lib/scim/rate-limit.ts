type RateBucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateBucket>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 120

export function checkScimRateLimit(ip: string | null) {
  const key = ip ?? "unknown"
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true as const, remaining: MAX_REQUESTS - 1 }
  }

  if (current.count >= MAX_REQUESTS) {
    return { ok: false as const, retryAfterSec: Math.ceil((current.resetAt - now) / 1000) }
  }

  current.count += 1
  buckets.set(key, current)
  return { ok: true as const, remaining: MAX_REQUESTS - current.count }
}
