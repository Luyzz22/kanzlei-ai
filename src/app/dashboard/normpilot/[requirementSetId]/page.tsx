import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import {
  CorrectiveActionPanel,
  EvidenceMatrixPanel,
  EvidenceSourcePanel,
  ExportPreviewPanel,
  GapPanel,
  MockSprintPanel,
  NormPilotBadge,
  NormPilotNotice,
  RequirementItemsPanel
} from "@/app/dashboard/normpilot/_components/normpilot-panels"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { listNormPilotCorrectiveActions } from "@/lib/normpilot/action-core"
import { listNormPilotEvidenceSources } from "@/lib/normpilot/evidence-core"
import {
  buildNormPilotEvidencePackManifest,
  buildNormPilotEvidencePackMarkdown
} from "@/lib/normpilot/export-core"
import { listNormPilotGaps } from "@/lib/normpilot/gap-core"
import { listNormPilotEvidenceMatrix } from "@/lib/normpilot/matrix-core"
import { getNormPilotRequirementSetDetail } from "@/lib/normpilot/requirement-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NormPilotRequirementSetPage({
  params
}: {
  params: { requirementSetId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect(`/login?next=/dashboard/normpilot/${params.requirementSetId}`)

  const tenantContext = await resolveTenantContextForUser(session.user.id)
  if (tenantContext.status !== "single") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-[22px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
        <p className="mt-2 text-[14px] text-gray-500">NormPilot benoetigt einen eindeutigen Mandantenkontext.</p>
      </main>
    )
  }

  const [detail, sources, matrix, gaps, actions, manifest] = await Promise.all([
    getNormPilotRequirementSetDetail(tenantContext.tenantId, params.requirementSetId),
    listNormPilotEvidenceSources(tenantContext.tenantId),
    listNormPilotEvidenceMatrix(tenantContext.tenantId, params.requirementSetId),
    listNormPilotGaps(tenantContext.tenantId, params.requirementSetId),
    listNormPilotCorrectiveActions(tenantContext.tenantId, params.requirementSetId),
    buildNormPilotEvidencePackManifest(tenantContext.tenantId, params.requirementSetId)
  ])

  if (!detail) notFound()

  const markdown = manifest ? buildNormPilotEvidencePackMarkdown(manifest) : null

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-[13px] font-medium text-blue-700 hover:text-blue-900" href="/dashboard/normpilot">
            Zurueck zu NormPilot
          </Link>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-gray-950">{detail.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-gray-500">
            <NormPilotBadge value={detail.reviewState} />
            <span>{detail.frameworkLabel ?? "Kundeneigene Checkliste"}</span>
            <span>{detail.scopeLabel ?? "Scope offen"}</span>
            <span>{detail.versionLabel ?? "Version offen"}</span>
          </div>
        </div>
        <MockSprintPanel requirementSetId={detail.id} />
      </div>

      <div className="mt-6">
        <NormPilotNotice />
      </div>

      <div className="mt-6 grid gap-5">
        <RequirementItemsPanel detail={detail} />
        <EvidenceSourcePanel requirementSetId={detail.id} sources={sources} />
        <EvidenceMatrixPanel requirementSetId={detail.id} items={detail.items} sources={sources} matrix={matrix} />
        <GapPanel requirementSetId={detail.id} items={detail.items} gaps={gaps} />
        <CorrectiveActionPanel requirementSetId={detail.id} items={detail.items} gaps={gaps} actions={actions} />
        <ExportPreviewPanel requirementSetId={detail.id} markdown={markdown} exportCount={detail.exports.length} />
      </div>
    </main>
  )
}
