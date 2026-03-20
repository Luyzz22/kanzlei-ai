import Link from "next/link"

import { StatusBadge } from "@/components/marketing/status-badge"
import { type DocumentActivityItem } from "@/lib/documents/document-activity-core"

type DocumentActivityTimelineProps = {
  activities: DocumentActivityItem[]
}

const categoryTone: Record<DocumentActivityItem["category"], "warning" | "info" | "success" | "neutral"> = {
  Intake: "warning",
  Review: "info",
  Freigabe: "success",
  Archivierung: "neutral",
  Audit: "neutral"
}

export function DocumentActivityTimeline({ activities }: DocumentActivityTimelineProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Aktivitäten &amp; Verlauf</h2>
          <p className="mt-1 text-sm text-slate-600">
            Integrierter read-only Verlauf zu Intake, Verarbeitung, Prüfung, Freigabe und Archivierung.
          </p>
        </div>
        <Link href="/dashboard/audit" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
          Zum Audit-Protokoll
        </Link>
      </div>

      {activities.length ? (
        <ol className="mt-5 space-y-3">
          {activities.map((activity) => (
            <li key={activity.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge label={activity.category} tone={categoryTone[activity.category]} />
                  <p className="text-xs text-slate-500">{new Date(activity.timestamp).toLocaleString("de-DE")}</p>
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{activity.action}</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{activity.title}</p>
              <p className="mt-1 text-sm text-slate-700">{activity.context}</p>
              <p className="mt-2 text-xs text-slate-600">Bearbeitungskontext: {activity.actorLabel}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Für dieses Dokument sind aktuell keine weiteren audit-nahen Aktivitäten protokolliert.
        </div>
      )}
    </section>
  )
}
