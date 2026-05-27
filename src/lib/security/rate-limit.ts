/**
 * Rate Limiter — Serverless-compatible sliding-window implementation
 *
 * In-memory per Lambda instance. Provides strong burst protection within a
 * single warm function. Across cold starts it resets, which is acceptable for
 * serverless — Vercel also applies its own DDoS layer at the edge.
 *
 * For globally-exact rate limiting across all instances, replace the backing
 * store with Upstash Redis (drop-in: change `store` to a Redis client).
 *
 * DSGVO Art. 32, NIS2 Art. 21, ISO 27001 A.12
 */

export type RateLimitConfig = {
  /** Maximum number of requests allowed within the window. */
  limit: number
  /** Window duration in milliseconds. */
  windowMs: number
}

/** Auth: 5 attempts per 15 minutes — brute-force protection */
export const AUTH_LIMIT: RateLimitConfig = { limit: 5, windowMs: 15 * 60 * 1000 }

/** Analysis start: 10 per hour per tenant — LLM cost protection */
export const ANALYSIS_LIMIT: RateLimitConfig = { limit: 10, windowMs: 60 * 60 * 1000 }

/** Upload: 20 per hour per user — upload spam protection */
export const UPLOAD_LIMIT: RateLimitConfig = { limit: 20, windowMs: 60 * 60 * 1000 }

/** Copilot: 30 questions per hour per user — LLM cost protection */
export const COPILOT_LIMIT: RateLimitConfig = { limit: 30, windowMs: 60 * 60 * 1000 }

/** Global API: 100 per minute per IP — general DDoS protection */
export const API_LIMIT: RateLimitConfig = { limit: 100, windowMs: 60 * 1000 }

type BucketEntry = {
  count: number
  resetAt: number
}

// Bounded in-memory store — evicts expired entries on every check
const store = new Map<string, BucketEntry>()

// Maximum entries to avoid unbounded memory growth in long-lived instances
const MAX_STORE_SIZE = 10_000

function evictExpired(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
    if (store.size < MAX_STORE_SIZE / 2) break
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number }

/**
 * Checks and increments the rate limit counter for a given key.
 *
 * @param key    Unique identifier (e.g. "api:1.2.3.4", "auth:user@example.com")
 * @param config Limit and window configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()

  // Periodic eviction to keep store bounded
  if (store.size > MAX_STORE_SIZE) evictExpired()

  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    // New or expired window — start fresh
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true }
  }

  if (existing.count >= config.limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now }
  }

  existing.count++
  return { allowed: true }
}

/**
 * Returns a human-readable Retry-After value in seconds (ceiling).
 */
export function retryAfterSeconds(retryAfterMs: number): string {
  return String(Math.ceil(retryAfterMs / 1000))
}
