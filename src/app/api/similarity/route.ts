export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

/**
 * Similarity / Precedent Search (PoC)
 *
 * Text-basierte Ähnlichkeitssuche über alle analysierten Findings des Tenants.
 * Findet ähnliche Klauseln/Findings und zeigt die historische Entscheidung.
 *
 * Algorithmus: TF-IDF-ähnliches Keyword-Matching auf title + description + category.
 * Production-Upgrade: Embedding-basiert (OpenAI/Cohere) + pgvector.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })

  const { query, limit = 10 } = await req.json()
  if (!query || typeof query !== "string" || query.length < 3) {
    return NextResponse.json({ error: "query muss mindestens 3 Zeichen lang sein" }, { status: 400 })
  }

  // Tokenize query into keywords (simple: split + lowercase + filter short)
  const keywords = query
    .toLowerCase()
    .replace(/[^\wäöüß\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3)
    .slice(0, 15)

  if (keywords.length === 0) {
    return NextResponse.json({ results: [], query, keywords: [] })
  }

  // Build Prisma OR conditions for keyword matching
  const orConditions = keywords.flatMap(kw => [
    { title: { contains: kw, mode: "insensitive" as const } },
    { description: { contains: kw, mode: "insensitive" as const } },
    { category: { contains: kw, mode: "insensitive" as const } }
  ])

  const findings = await prisma.analysisFinding.findMany({
    where: {
      tenantId: ctx.tenantId,
      OR: orConditions
    },
    select: {
      id: true,
      category: true,
      title: true,
      description: true,
      severity: true,
      confidence: true,
      clauseRef: true,
      sourceSpan: true,
      suggestedRevision: true,
      createdAt: true,
      document: { select: { id: true, filename: true } },
      analysisRun: { select: { contractClassification: true, riskPromptVersion: true } },
      reviews: {
        select: {
          decision: true,
          comment: true,
          modifiedSuggestedRevision: true,
          reviewer: { select: { name: true } },
          reviewedAt: true
        },
        orderBy: { reviewedAt: "desc" },
        take: 1
      }
    },
    take: 50
  })

  // Score each finding by keyword match count
  const scored = findings.map(f => {
    const text = `${f.title} ${f.description} ${f.category}`.toLowerCase()
    let matchCount = 0
    const matchedKeywords: string[] = []
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matchCount++
        matchedKeywords.push(kw)
      }
    }
    const score = keywords.length > 0 ? Math.round((matchCount / keywords.length) * 100) : 0
    return { ...f, similarityScore: score, matchedKeywords }
  })
    .filter(f => f.similarityScore > 0)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, Math.min(limit, 20))

  // Format results
  const results = scored.map(f => ({
    id: f.id,
    similarityScore: f.similarityScore,
    matchedKeywords: f.matchedKeywords,
    category: f.category,
    title: f.title,
    description: f.description,
    severity: f.severity,
    confidence: f.confidence,
    clauseRef: f.clauseRef,
    sourceSpan: f.sourceSpan,
    suggestedRevision: f.suggestedRevision,
    contractType: f.analysisRun?.contractClassification ?? null,
    documentName: f.document?.filename ?? null,
    documentId: f.document?.id ?? null,
    createdAt: f.createdAt.toISOString(),
    review: f.reviews[0] ? {
      decision: f.reviews[0].decision,
      comment: f.reviews[0].comment,
      modifiedRevision: f.reviews[0].modifiedSuggestedRevision,
      reviewer: f.reviews[0].reviewer?.name ?? null,
      date: f.reviews[0].reviewedAt.toISOString()
    } : null
  }))

  return NextResponse.json({
    query,
    keywords,
    totalResults: results.length,
    results
  })
}
