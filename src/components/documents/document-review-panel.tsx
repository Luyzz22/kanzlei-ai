"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  createReviewFindingAction,
  createReviewNoteAction,
  resolveReviewFindingAction,
  type ReviewWorkbenchFormState,
  updateReviewMetaAction
} from "@/app/workspace/dokumente/[id]/actions"
import { StatusBadge } from "@/components/marketing/status-badge"
type DocumentFindingSeverityValue = "NIEDRIG" | "MITTEL" | "HOCH"
type DocumentFindingStatusValue = "OFFEN" | "GEKLAERT" | "AKZEPTIERT"
type ReviewReadinessState = "OFFEN" | "IN_PRUEFUNG" | "ENTSCHEIDUNGSVORBEREITUNG" | "FREIGABEREIF" | "ABGESCHLOSSEN"
type DocumentReviewNoteListItem = {
  id: string
  title: string | null
  body: string
  createdAt: Date
  authorLabel: string
}
type DocumentFindingListItem = {
  id: string
  title: string
  description: string
  severity: DocumentFindingSeverityValue
  status: DocumentFindingStatusValue
  createdAt: Date
  createdByLabel: string
}
type ReviewAssignableMember = { userId: string; label: string }

const reviewInputConstraints = {
  noteBodyMinLength: 5,
  noteBodyMaxLength: 4000,
  noteTitleMaxLength: 160,
  findingTitleMinLength: 3,
  findingTitleMaxLength: 180,
  findingDescriptionMinLength: 5,
  findingDescriptionMaxLength: 4000
}

function getReviewReadinessTone(state: ReviewReadinessState): "warning" | "info" | "success" | "neutral" {
  if (state === "OFFEN") return "warning"
  if (state === "IN_PRUEFUNG" || state === "ENTSCHEIDUNGSVORBEREITUNG") return "info"
  if (state === "FREIGABEREIF") return "success"
  return "neutral"
}

type DocumentReviewPanelProps = {
  documentId: string
  notes: DocumentReviewNoteListItem[]
  findings: DocumentFindingListItem[]
  reviewSummary: {
    reviewOwnerId: string | null
    reviewOwnerLabel: string | null
    reviewDueAt: Date | null
    openFindingsCount: number
    closedFindingsCount: number
    readiness: ReviewReadinessState
    readinessLabel: string
    canManageReviewMeta: boolean
    canCreateDecisionMemo: boolean
    canResolveFindings: boolean
    decisionMemo: {
      id: string
      title: string | null
      body: string
      createdAt: Date
      authorLabel: string
    } | null
  }
  assignableMembers: ReviewAssignableMember[]
}

const initialState: ReviewWorkbenchFormState = { status: "idle" }

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  )
}

function FormFeedback({ state }: { state: ReviewWorkbenchFormState }) {
  if (!state.message) return null
  return <p className={`text-xs ${state.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
}

function severityLabel(value: DocumentFindingSeverityValue): string {
  if (value === "HOCH") return "Hoch"
  if (value === "NIEDRIG") return "Niedrig"
  return "Mittel"
}

function statusLabel(value: DocumentFindingStatusValue): string {
  if (value === "GEKLAERT") return "Geklärt"
  if (value === "AKZEPTIERT") return "Akzeptiert"
  return "Offen"
}

export function DocumentReviewPanel({ documentId, notes, findings, reviewSummary, assignableMembers }: DocumentReviewPanelProps) {
  const [metaState, metaAction] = useFormState(updateReviewMetaAction, initialState)
  const [noteState, noteAction] = useFormState(createReviewNoteAction, initialState)
  const [findingState, findingAction] = useFormState(createReviewFindingAction, initialState)
  const [memoState, memoAction] = useFormState(createReviewNoteAction, initialState)

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review &amp; Entscheidung</h2>
        <p className="mt-1 text-sm text-slate-600">Strukturierte Review-Notizen, Prüfhinweise, Verantwortlichkeit und Entscheidungsvermerke im tenant-gebundenen Governance-Kontext.</p>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Review-Verantwortung</p>
          <p className="font-medium text-slate-900">{reviewSummary.reviewOwnerLabel ?? "Nicht zugewiesen"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Fälligkeit</p>
          <p className="font-medium text-slate-900">{reviewSummary.reviewDueAt ? new Date(reviewSummary.reviewDueAt).toLocaleDateString("de-DE") : "Nicht gesetzt"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Offene Findings</p>
          <p className="font-medium text-slate-900">{reviewSummary.openFindingsCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Freigabereife</p>
          <div className="mt-1">
            <StatusBadge label={reviewSummary.readinessLabel} tone={getReviewReadinessTone(reviewSummary.readiness)} />
          </div>
        </div>
      </div>

      {reviewSummary.canManageReviewMeta ? (
        <form action={metaAction} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <input type="hidden" name="documentId" value={documentId} />
          <p className="text-sm font-medium text-slate-900">Review-Verantwortung &amp; Fälligkeit aktualisieren</p>
          <div className="grid gap-3 md:grid-cols-2">
            <select name="reviewOwnerId" defaultValue={reviewSummary.reviewOwnerId ?? ""} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">Keine Zuweisung</option>
              {assignableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.label}
                </option>
              ))}
            </select>
            <input
              name="reviewDueAt"
              type="date"
              defaultValue={reviewSummary.reviewDueAt ? new Date(reviewSummary.reviewDueAt).toISOString().slice(0, 10) : ""}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <SubmitButton idleLabel="Metadaten speichern" pendingLabel="Speichern …" />
          <FormFeedback state={metaState} />
        </form>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Für diese Aktion fehlt die erforderliche Berechtigung.</div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-semibold text-slate-900">Review-Notizen</h3>
          <form action={noteAction} className="space-y-2">
            <input type="hidden" name="documentId" value={documentId} />
            <input name="title" maxLength={reviewInputConstraints.noteTitleMaxLength} placeholder="Titel (optional)" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            <input name="sectionKey" maxLength={64} placeholder="Bereichsbezug (optional)" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            <textarea
              name="body"
              minLength={reviewInputConstraints.noteBodyMinLength}
              maxLength={reviewInputConstraints.noteBodyMaxLength}
              required
              rows={4}
              placeholder="Sachliche Review-Notiz erfassen"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <SubmitButton idleLabel="Review-Notiz speichern" pendingLabel="Speichern …" />
            <FormFeedback state={noteState} />
          </form>

          {notes.length ? (
            <ol className="space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-sm font-medium text-slate-900">{note.title ?? "Review-Notiz"}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
                  <p className="mt-2 text-xs text-slate-500">{note.authorLabel} · {new Date(note.createdAt).toLocaleString("de-DE")}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-600">Für dieses Dokument liegen derzeit noch keine Review-Notizen vor.</p>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-semibold text-slate-900">Findings / Prüfhinweise</h3>
          <form action={findingAction} className="space-y-2">
            <input type="hidden" name="documentId" value={documentId} />
            <input name="title" required minLength={reviewInputConstraints.findingTitleMinLength} maxLength={reviewInputConstraints.findingTitleMaxLength} placeholder="Titel des Prüfhinweises" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            <textarea
              name="description"
              required
              rows={4}
              minLength={reviewInputConstraints.findingDescriptionMinLength}
              maxLength={reviewInputConstraints.findingDescriptionMaxLength}
              placeholder="Beschreibung des Befunds"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <div className="grid gap-2 md:grid-cols-2">
              <select name="severity" defaultValue="MITTEL" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="NIEDRIG">Niedrig</option>
                <option value="MITTEL">Mittel</option>
                <option value="HOCH">Hoch</option>
              </select>
              <input name="sectionKey" maxLength={64} placeholder="Bereichsbezug (optional)" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            </div>
            <SubmitButton idleLabel="Prüfhinweis speichern" pendingLabel="Speichern …" />
            <FormFeedback state={findingState} />
          </form>

          {findings.length ? (
            <ol className="space-y-2">
              {findings.map((finding) => (
                <li key={finding.id} className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{finding.title}</p>
                    <p className="text-xs text-slate-500">{severityLabel(finding.severity)} · {statusLabel(finding.status)}</p>
                  </div>
                  <p className="text-sm text-slate-700">{finding.description}</p>
                  <p className="text-xs text-slate-500">Erfasst durch {finding.createdByLabel} · {new Date(finding.createdAt).toLocaleString("de-DE")}</p>
                  {reviewSummary.canResolveFindings && finding.status === "OFFEN" ? (
                    <div className="flex gap-2">
                      <FindingStatusAction documentId={documentId} findingId={finding.id} nextStatus="GEKLAERT" label="Als geklärt markieren" />
                      <FindingStatusAction documentId={documentId} findingId={finding.id} nextStatus="AKZEPTIERT" label="Als akzeptiert markieren" />
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-600">Es sind aktuell keine offenen Prüfhinweise hinterlegt.</p>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-base font-semibold text-slate-900">Freigabevermerk / Entscheidungsvermerk</h3>
        {reviewSummary.decisionMemo ? (
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-medium text-slate-900">{reviewSummary.decisionMemo.title ?? "Entscheidungsvermerk"}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{reviewSummary.decisionMemo.body}</p>
            <p className="mt-2 text-xs text-slate-500">{reviewSummary.decisionMemo.authorLabel} · {new Date(reviewSummary.decisionMemo.createdAt).toLocaleString("de-DE")}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Für dieses Dokument liegt derzeit kein Freigabevermerk vor.</p>
        )}

        {reviewSummary.canCreateDecisionMemo ? (
          <form action={memoAction} className="space-y-2">
            <input type="hidden" name="documentId" value={documentId} />
            <input type="hidden" name="noteType" value="DECISION_MEMO" />
            <input name="title" maxLength={reviewInputConstraints.noteTitleMaxLength} placeholder="Titel (optional)" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            <textarea name="body" rows={5} required minLength={reviewInputConstraints.noteBodyMinLength} maxLength={reviewInputConstraints.noteBodyMaxLength} placeholder="Formaler Freigabe- oder Entscheidungsvermerk" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
            <SubmitButton idleLabel="Freigabevermerk speichern" pendingLabel="Speichern …" />
            <FormFeedback state={memoState} />
          </form>
        ) : null}
      </div>
    </section>
  )
}

function FindingStatusAction({
  documentId,
  findingId,
  nextStatus,
  label
}: {
  documentId: string
  findingId: string
  nextStatus: "GEKLAERT" | "AKZEPTIERT"
  label: string
}) {
  const [state, action] = useFormState(resolveReviewFindingAction, initialState)

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="findingId" value={findingId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <button type="submit" className="inline-flex rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
        {label}
      </button>
      <FormFeedback state={state} />
    </form>
  )
}
