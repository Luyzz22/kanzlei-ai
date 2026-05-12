import { notFound, redirect } from "next/navigation"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { getWorkbenchAiContractAnalysis } from "@/lib/documents/analysis-run-core"
import { serializeWorkbenchAiContractAnalysis } from "@/lib/documents/workbench-core"
import { prisma } from "@/lib/prisma"

import { ExportClient } from "./export-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = { params: { id: string } }

export default async function ExportPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const tenantContext = await resolveTenantContextForUser(session.user.id)
  if (tenantContext.status !== "single") redirect("/dashboard")

  const doc = await prisma.document.findFirst({
    where: { id: params.id, tenantId: tenantContext.tenantId },
    select: { id: true, title: true, filename: true }
  })
  if (!doc) notFound()

  const rawAnalysis = await getWorkbenchAiContractAnalysis(
    tenantContext.tenantId,
    session.user.id,
    params.id
  )
  const analysis = serializeWorkbenchAiContractAnalysis(rawAnalysis)
  if (!analysis) notFound()

  return (
    <ExportClient
      documentTitle={doc.title ?? doc.filename ?? "Vertrag"}
      documentId={doc.id}
      analysis={analysis}
    />
  )
}
