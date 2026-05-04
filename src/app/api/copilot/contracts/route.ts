export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant zugeordnet" }, { status: 403 })
  }

  const runs = await prisma.analysisRun.findMany({
    where: { tenantId: ctx.tenantId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 30,
    select: {
      id: true,
      riskScore01: true,
      completedAt: true,
      aggregateConfidence: true,
      document: {
        select: {
          id: true,
          title: true,
          documentType: true,
          organizationName: true,
        }
      },
      extraction: {
        select: {
          contractType: true,
          parties: true,
          term: true,
          legalTopics: true,
          structuredData: true,
          deadlines: true,
        }
      },
      findings: {
        select: {
          category: true,
          title: true,
          description: true,
          severity: true,
          confidence: true,
          clauseRef: true,
          sourceSpan: true,
          suggestedRevision: true,
        },
        orderBy: { createdAt: "asc" }
      }
    }
  })

  const contracts = runs.map(run => ({
    runId: run.id,
    documentId: run.document.id,
    title: run.document.title,
    documentType: run.document.documentType,
    organizationName: run.document.organizationName,
    contractType: run.extraction?.contractType ?? run.document.documentType,
    riskScore: run.riskScore01,
    confidence: run.aggregateConfidence,
    completedAt: run.completedAt?.toISOString() ?? null,
    extraction: run.extraction,
    findings: run.findings,
  }))

  return NextResponse.json({ contracts })
}
