import { NextRequest, NextResponse } from "next/server"
import { fetchRecentActs } from "@/lib/regulatory/eurlex-client"
import { REGULATION_WATCHLIST } from "@/lib/regulatory/watchlist"

/**
 * GET /api/cron/radar-sync
 *
 * Vercel Cron Job — täglich 03:00 Europe/Berlin
 *
 * Aufgaben:
 * 1. EUR-Lex SPARQL queryen für neue Acts der letzten 7 Tage
 * 2. Mit Watchlist abgleichen → Updates zu beobachteten Regulierungen erkennen
 * 3. (Future) Bei Match → betroffene Verträge re-scannen → Notifications dispatchen
 *
 * Auth: Vercel Cron Header (CRON_SECRET) oder Bearer Token
 *
 * vercel.json Config:
 * {
 *   "crons": [
 *     { "path": "/api/cron/radar-sync", "schedule": "0 3 * * *" }
 *   ]
 * }
 */

export async function GET(req: NextRequest) {
  // Vercel Cron auth via Authorization header
  const authHeader = req.headers.get("authorization")
  const expectedToken = process.env.CRON_SECRET
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const startedAt = new Date().toISOString()

  const results: { type: string; count: number; error?: string }[] = []
  const watchedCelex = new Set(REGULATION_WATCHLIST.map(r => r.celex))
  const newUpdatesForWatched: unknown[] = []

  for (const type of ["regulation", "directive", "decision"] as const) {
    try {
      const docs = await fetchRecentActs({ type, sinceDate: sevenDaysAgo, limit: 50 })
      results.push({ type, count: docs.length })

      // Check if any new acts touch our watchlist
      for (const doc of docs) {
        if (watchedCelex.has(doc.celex)) {
          newUpdatesForWatched.push(doc)
        }
      }
    } catch (e) {
      results.push({
        type,
        count: 0,
        error: e instanceof Error ? e.message : "Unknown",
      })
    }
  }

  // TODO Phase 2: Trigger re-scan of affected contracts + dispatch notifications
  // For now: log the matches

  console.log("[Radar Cron] Sync completed", {
    startedAt,
    finishedAt: new Date().toISOString(),
    results,
    watchedHits: newUpdatesForWatched.length,
  })

  return NextResponse.json({
    success: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    sinceDate: sevenDaysAgo,
    results,
    watchedRegulationsTotal: REGULATION_WATCHLIST.length,
    watchedHitsThisSync: newUpdatesForWatched.length,
    nextSync: "tomorrow 03:00 Europe/Berlin",
  })
}
