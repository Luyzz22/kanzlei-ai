import "server-only"

import { prisma } from "@/lib/prisma"

export async function getPromptGovernanceAdminSnapshot() {
  const [definitions, releases, evalRuns] = await Promise.all([
    prisma.promptDefinition.findMany({
      orderBy: [{ key: "asc" }, { version: "desc" }],
      take: 200
    }),
    prisma.promptRelease.findMany({
      include: {
        promptDefinition: true,
        tenant: { select: { id: true, name: true, slug: true } }
      },
      orderBy: { effectiveFrom: "desc" },
      take: 150
    }),
    prisma.evalRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        name: true,
        evaluatorName: true,
        createdAt: true,
        completedAt: true,
        passed: true,
        _count: { select: { results: true } }
      }
    })
  ])

  return { definitions, releases, evalRuns }
}
