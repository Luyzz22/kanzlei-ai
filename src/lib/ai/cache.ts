interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key)
    return null
  }
  return entry.value as T
}

export function setCached<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export async function getRedisCached<T>(): Promise<T | null> {
  // Optionaler Redis-Hook für Produktionsbetrieb (z. B. Upstash/ElastiCache)
  return null
}
