import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRecentActs, EurLexResource } from "@/lib/regulatory/eurlex-client"
import { REGULATION_WATCHLIST, getRegulationLink } from "@/lib/regulatory/watchlist"

/**
 * GET /api/radar/feed
 *
 * Liefert die kuratierte Watchlist + optional live-Updates aus EUR-Lex.
 *
 * Query Params:
 * - live=true: Holt zusätzlich aktuelle EU-Rechtsakte aus EUR-Lex SPARQL
 * - type=regulation|directive|decision: Filter für Live-Feed
 * - since=YYYY-MM-DD: Datum ab dem nach Updates gesucht wird (default: 30 Tage zurück)
 *
 * Caching: Edge-Cache 1h via revalidate
 *
 * EU AI Act: Limited Risk — rein informativer Feed, kein automatischer Eingriff
 */

export const revalidate = 3600 // 1h cache

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const live = url.searchParams.get("live") === "true"
  const typeParam = url.searchParams.get("type") as EurLexResource | null
  const sinceParam = url.searchParams.get("since")

  // Default: last 30 days
  const sinceDate = sinceParam ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const watchlist = REGULATION_WATCHLIST.map(r => ({
    ...r,
    link: getRegulationLink(r),
  }))

  let liveUpdates: unknown[] = []
  let liveError: string | null = null

  if (live) {
    try {
      const type = (typeParam ?? "regulation") as EurLexResource
      const docs = await fetchRecentActs({ type, sinceDate, limit: 25 })
      liveUpdates = docs
    } catch (e) {
      liveError = e instanceof Error ? e.message : "Unknown EUR-Lex error"
      // Don't fail the whole request if live fails — return curated list
    }
  }

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    source: "EUR-Lex CELLAR SPARQL + curated watchlist",
    watchlist: {
      count: watchlist.length,
      regulations: watchlist,
    },
    live: live ? {
      enabled: true,
      sinceDate,
      type: typeParam ?? "regulation",
      count: liveUpdates.length,
      updates: liveUpdates,
      error: liveError,
    } : { enabled: false },
    disclaimer: "Quellen: EUR-Lex (publications.europa.eu), gesetze-im-internet.de. Keine Rechtsberatung — Daten dienen der Information.",
  })
}
