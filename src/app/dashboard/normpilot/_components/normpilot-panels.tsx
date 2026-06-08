import Link from "next/link"

import {
  createNormPilotCorrectiveActionAction,
  createNormPilotEvidenceMappingAction,
  createNormPilotEvidencePackExportAction,
  createNormPilotEvidenceSourceAction,
  createNormPilotGapAction,
  createNormPilotRequirementSetAction,
  createNormPilotRequirementItemAction,
  runNormPilotMockSprintAction,
  transitionNormPilotReviewStateAction
} from "@/app/dashboard/normpilot/actions"
import { NORMPILOT_AI_NOTICE, NORMPILOT_NORM_LICENSE_NOTICE } from "@/lib/normpilot/constants"
import type {
  getNormPilotRequirementSetDetail,
  listNormPilotRequirementSets
} from "@/lib/normpilot/requirement-core"
import type { listNormPilotEvidenceSources } from "@/lib/normpilot/evidence-core"
import type { listNormPilotEvidenceMatrix } from "@/lib/normpilot/matrix-core"
import type { listNormPilotGaps } from "@/lib/normpilot/gap-core"
import type { listNormPilotCorrectiveActions } from "@/lib/normpilot/action-core"

type RequirementSetList = Awaited<ReturnType<typeof listNormPilotRequirementSets>>
type RequirementSetDetail = NonNullable<Awaited<ReturnType<typeof getNormPilotRequirementSetDetail>>>
type EvidenceSources = Awaited<ReturnType<typeof listNormPilotEvidenceSources>>
type EvidenceMatrix = Awaited<ReturnType<typeof listNormPilotEvidenceMatrix>>
type Gaps = Awaited<ReturnType<typeof listNormPilotGaps>>
type CorrectiveActions = Awaited<ReturnType<typeof listNormPilotCorrectiveActions>>

type ServerAction = (formData: FormData) => Promise<void>

function serverAction(action: ServerAction): string {
  return action as unknown as string
}

function badgeTone(value: string): string {
  if (value === "FREIGEGEBEN" || value === "COVERED" || value === "DONE") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (value === "ZURUECKGEWIESEN" || value === "MISSING" || value === "CRITICAL" || value === "HIGH") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  if (value === "IN_PRUEFUNG" || value === "PARTIAL" || value === "MEDIUM") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-gray-200 bg-gray-50 text-gray-700"
}

export function NormPilotBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${badgeTone(value)}`}>
      {value}
    </span>
  )
}

export function NormPilotNotice() {
  return (
    <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
      <p>{NORMPILOT_AI_NOTICE}</p>
      <p className="mt-1">{NORMPILOT_NORM_LICENSE_NOTICE}</p>
    </div>
  )
}

export function RequirementSetListPanel({ sets }: { sets: RequirementSetList }) {
  return (
    <div className="border border-gray-200 bg-white">
      <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_auto] border-b border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-500">
        <span>Requirement Set</span>
        <span>Status</span>
        <span>Items</span>
        <span>Gaps</span>
        <span />
      </div>
      {sets.map((set) => (
        <div key={set.id} className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_auto] items-center border-b border-gray-100 px-4 py-3 text-[13px] last:border-b-0">
          <div>
            <p className="font-medium text-gray-950">{set.title}</p>
            <p className="text-gray-500">{set.frameworkLabel ?? "Kundeneigene Checkliste"}</p>
          </div>
          <NormPilotBadge value={set.reviewState} />
          <span>{set._count.items}</span>
          <span>{set._count.gapFindings}</span>
          <Link className="text-[13px] font-medium text-blue-700 hover:text-blue-900" href={`/dashboard/normpilot/${set.id}`}>
            Oeffnen
          </Link>
        </div>
      ))}
      {sets.length === 0 ? <p className="px-4 py-6 text-[13px] text-gray-500">Noch keine Requirement Sets.</p> : null}
    </div>
  )
}

export function CreateRequirementSetPanel() {
  return (
    <form action={serverAction(createNormPilotRequirementSetAction)} className="border border-gray-200 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-gray-950">Requirement Set anlegen</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="title" placeholder="Titel" required />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="frameworkLabel" placeholder="Framework" />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="scopeLabel" placeholder="Scope" />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="versionLabel" placeholder="Version" />
      </div>
      <button className="mt-4 bg-gray-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">
        Anlegen
      </button>
    </form>
  )
}

export function RequirementItemsPanel({ detail }: { detail: RequirementSetDetail }) {
  return (
    <section className="border border-gray-200 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-gray-950">Requirement Items</h2>
      <div className="mt-3 divide-y divide-gray-100">
        {detail.items.map((item) => (
          <div key={item.id} className="grid gap-2 py-3 text-[13px] sm:grid-cols-[0.4fr_1.2fr_auto] sm:items-center">
            <span className="font-mono text-gray-700">{item.code}</span>
            <span className="font-medium text-gray-950">{item.title}</span>
            <NormPilotBadge value={item.reviewState} />
          </div>
        ))}
      </div>
      <form action={serverAction(createNormPilotRequirementItemAction)} className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-[0.4fr_1fr_0.5fr_auto]">
        <input type="hidden" name="requirementSetId" value={detail.id} />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="code" placeholder="Code" required />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="title" placeholder="Titel" required />
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="criticality" defaultValue="MEDIUM">
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
        <button className="bg-gray-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">
          Hinzufuegen
        </button>
      </form>
    </section>
  )
}

export function EvidenceMatrixPanel({
  requirementSetId,
  items,
  sources,
  matrix
}: {
  requirementSetId: string
  items: RequirementSetDetail["items"]
  sources: EvidenceSources
  matrix: EvidenceMatrix
}) {
  return (
    <section className="border border-gray-200 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-gray-950">Evidence Matrix</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
          <thead className="border-b border-gray-200 text-[12px] text-gray-500">
            <tr>
              <th className="py-2">Requirement</th>
              <th className="py-2">Evidence</th>
              <th className="py-2">Status</th>
              <th className="py-2">Review</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="py-2">{row.requirementItem.code}</td>
                <td className="py-2">{row.evidenceSource?.title ?? "Nicht zugeordnet"}</td>
                <td className="py-2"><NormPilotBadge value={row.status} /></td>
                <td className="py-2"><ReviewButtons requirementSetId={requirementSetId} resourceId={row.id} resourceType="evidence_mapping" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={serverAction(createNormPilotEvidenceMappingAction)} className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_1fr_0.7fr_auto]">
        <input type="hidden" name="requirementSetId" value={requirementSetId} />
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="requirementItemId" required>
          {items.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
        </select>
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="evidenceSourceId">
          <option value="">Keine Quelle</option>
          {sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}
        </select>
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="status" defaultValue="NEEDS_REVIEW">
          <option>COVERED</option>
          <option>PARTIAL</option>
          <option>MISSING</option>
          <option>CONFLICTING</option>
          <option>NOT_APPLICABLE</option>
          <option>NEEDS_REVIEW</option>
        </select>
        <button className="bg-gray-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">Speichern</button>
      </form>
    </section>
  )
}

export function EvidenceSourcePanel({ requirementSetId, sources }: { requirementSetId: string; sources: EvidenceSources }) {
  return (
    <section className="border border-gray-200 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-gray-950">Evidence Sources</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {sources.map((source) => <span key={source.id} className="border border-gray-200 px-2 py-1 text-[12px]">{source.sourceType}: {source.title}</span>)}
      </div>
      <form action={serverAction(createNormPilotEvidenceSourceAction)} className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-[0.4fr_1fr_auto]">
        <input type="hidden" name="requirementSetId" value={requirementSetId} />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="sourceType" placeholder="pdf" required />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="title" placeholder="Titel" required />
        <button className="bg-gray-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">Quelle anlegen</button>
      </form>
    </section>
  )
}

export function GapPanel({ requirementSetId, items, gaps }: { requirementSetId: string; items: RequirementSetDetail["items"]; gaps: Gaps }) {
  return (
    <section className="border border-gray-200 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-gray-950">Gap-Liste</h2>
      <div className="mt-3 divide-y divide-gray-100">
        {gaps.map((gap) => (
          <div key={gap.id} className="py-3 text-[13px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-gray-950">{gap.title}</p>
              <div className="flex gap-2"><NormPilotBadge value={gap.severity} /><ReviewButtons requirementSetId={requirementSetId} resourceId={gap.id} resourceType="gap_finding" /></div>
            </div>
            <p className="mt-1 text-gray-600">{gap.recommendation ?? gap.description}</p>
          </div>
        ))}
      </div>
      <form action={serverAction(createNormPilotGapAction)} className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_0.5fr_1fr_auto]">
        <input type="hidden" name="requirementSetId" value={requirementSetId} />
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="requirementItemId">
          <option value="">Ohne Requirement</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
        </select>
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="severity" defaultValue="MEDIUM">
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="title" placeholder="Gap Titel" required />
        <input type="hidden" name="description" value="Manuell erfasster NormPilot-Gap ohne Norm-Volltext." />
        <button className="bg-gray-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">Gap</button>
      </form>
    </section>
  )
}

export function CorrectiveActionPanel({
  requirementSetId,
  items,
  gaps,
  actions
}: {
  requirementSetId: string
  items: RequirementSetDetail["items"]
  gaps: Gaps
  actions: CorrectiveActions
}) {
  return (
    <section className="border border-gray-200 bg-white p-4">
      <h2 className="text-[15px] font-semibold text-gray-950">Corrective Actions</h2>
      <div className="mt-3 divide-y divide-gray-100">
        {actions.map((action) => (
          <div key={action.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[13px]">
            <div>
              <p className="font-medium text-gray-950">{action.title}</p>
              <p className="text-gray-500">{action.ownerRole ?? "Owner-Rolle offen"} · {action.status}</p>
            </div>
            <ReviewButtons requirementSetId={requirementSetId} resourceId={action.id} resourceType="corrective_action" />
          </div>
        ))}
      </div>
      <form action={serverAction(createNormPilotCorrectiveActionAction)} className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_1fr_0.6fr_auto]">
        <input type="hidden" name="requirementSetId" value={requirementSetId} />
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="requirementItemId">
          <option value="">Ohne Requirement</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
        </select>
        <select className="border border-gray-200 px-3 py-2 text-[13px]" name="gapFindingId">
          <option value="">Ohne Gap</option>
          {gaps.map((gap) => <option key={gap.id} value={gap.id}>{gap.title}</option>)}
        </select>
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="ownerRole" placeholder="QM" />
        <input className="border border-gray-200 px-3 py-2 text-[13px]" name="title" placeholder="Massnahme" required />
        <input type="hidden" name="acceptanceCriteria" value="Nachweis ist quellengebunden ergaenzt und reviewed." />
        <button className="bg-gray-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">Action</button>
      </form>
    </section>
  )
}

export function ExportPreviewPanel({
  requirementSetId,
  markdown,
  exportCount
}: {
  requirementSetId: string
  markdown: string | null
  exportCount: number
}) {
  return (
    <section className="border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-gray-950">Export Preview</h2>
        <div className="flex gap-2">
          <form action={serverAction(createNormPilotEvidencePackExportAction)}>
            <input type="hidden" name="requirementSetId" value={requirementSetId} />
            <input type="hidden" name="format" value="MARKDOWN" />
            <button className="border border-gray-300 px-3 py-2 text-[13px] font-medium" type="submit">Markdown speichern</button>
          </form>
          <form action={serverAction(createNormPilotEvidencePackExportAction)}>
            <input type="hidden" name="requirementSetId" value={requirementSetId} />
            <input type="hidden" name="format" value="CSV" />
            <button className="border border-gray-300 px-3 py-2 text-[13px] font-medium" type="submit">CSV speichern</button>
          </form>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-gray-500">Persistierte Exporte: {exportCount}</p>
      <pre className="mt-4 max-h-[360px] overflow-auto border border-gray-100 bg-gray-50 p-3 text-[12px] leading-relaxed text-gray-800">
        {markdown ?? "Noch kein Export-Manifest verfuegbar."}
      </pre>
    </section>
  )
}

export function MockSprintPanel({ requirementSetId }: { requirementSetId: string }) {
  return (
    <form action={serverAction(runNormPilotMockSprintAction)} className="border border-blue-200 bg-blue-50 p-4">
      <input type="hidden" name="requirementSetId" value={requirementSetId} />
      <p className="text-[13px] font-medium text-blue-950">Mock Sprint: deterministische Entwurfsdaten, keine Provider Calls.</p>
      <button className="mt-3 bg-blue-950 px-4 py-2 text-[13px] font-medium text-white" type="submit">
        Mock Sprint persistieren
      </button>
    </form>
  )
}

function ReviewButtons({
  requirementSetId,
  resourceId,
  resourceType
}: {
  requirementSetId: string
  resourceId: string
  resourceType: "evidence_mapping" | "gap_finding" | "corrective_action"
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {(["IN_PRUEFUNG", "FREIGEGEBEN", "ZURUECKGEWIESEN"] as const).map((nextState) => (
        <form key={nextState} action={serverAction(transitionNormPilotReviewStateAction)}>
          <input type="hidden" name="requirementSetId" value={requirementSetId} />
          <input type="hidden" name="resourceId" value={resourceId} />
          <input type="hidden" name="resourceType" value={resourceType} />
          <input type="hidden" name="nextState" value={nextState} />
          <button className="border border-gray-200 px-2 py-1 text-[11px] text-gray-700" type="submit">
            {nextState}
          </button>
        </form>
      ))}
    </div>
  )
}
