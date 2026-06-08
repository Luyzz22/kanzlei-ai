import { redirect } from "next/navigation"

import { CreateRequirementSetPanel, NormPilotNotice, RequirementSetListPanel } from "@/app/dashboard/normpilot/_components/normpilot-panels"
import { importNormPilotRequirementSetJsonAction } from "@/app/dashboard/normpilot/actions"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { listNormPilotRequirementSets } from "@/lib/normpilot/requirement-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

const sampleImport = {
  requirementSet: {
    title: "Synthetischer Audit Evidence Sprint",
    frameworkLabel: "Kundeneigene Checkliste",
    scopeLabel: "Produktionsnahe Nachweisarbeit",
    versionLabel: "2026-06"
  },
  items: [
    {
      code: "QMS-001",
      title: "Pruefbericht auffindbar",
      customerText: "Kundeneigene Kurzanforderung ohne Norm-Volltext.",
      criticality: "MEDIUM"
    },
    {
      code: "QMS-002",
      title: "Schulungsnachweis fuer Prueftaetigkeiten",
      customerText: "Kundeneigene Kurzanforderung ohne personenbezogene Pflichtfelder.",
      criticality: "HIGH"
    }
  ]
}

function serverAction(action: (formData: FormData) => Promise<void>): string {
  return action as unknown as string
}

export default async function NormPilotDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/dashboard/normpilot")

  const tenantContext = await resolveTenantContextForUser(session.user.id)
  if (tenantContext.status !== "single") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-[22px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
        <p className="mt-2 text-[14px] text-gray-500">NormPilot benoetigt einen eindeutigen Mandantenkontext.</p>
      </main>
    )
  }

  const sets = await listNormPilotRequirementSets(tenantContext.tenantId)

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-blue-700">NormPilot</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-gray-950">Audit Evidence Sprint</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-gray-500">
            Requirement Sets, Evidence Matrix, Gaps, Actions und Evidence Pack Export als mandantengetrennter Entwurfsworkflow.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <NormPilotNotice />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <RequirementSetListPanel sets={sets} />
        <div className="space-y-5">
          <CreateRequirementSetPanel />
          <form action={serverAction(importNormPilotRequirementSetJsonAction)} className="border border-gray-200 bg-white p-4">
            <h2 className="text-[15px] font-semibold text-gray-950">JSON-Import</h2>
            <textarea
              className="mt-3 min-h-[220px] w-full border border-gray-200 p-3 font-mono text-[12px]"
              name="payload"
              defaultValue={JSON.stringify(sampleImport, null, 2)}
            />
            <button className="mt-3 bg-gray-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">
              Importieren
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
