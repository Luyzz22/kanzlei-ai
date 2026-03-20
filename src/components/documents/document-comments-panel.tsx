import { DocumentCommentForm } from "@/components/documents/document-comment-form"
import { getDocumentCommentSectionLabel } from "@/config/document-comments"
import {
  type DocumentCommentListItem,
  getDocumentCommentInputConstraints
} from "@/lib/documents/comments-core"

type DocumentCommentsPanelProps = {
  documentId: string
  comments: DocumentCommentListItem[]
  canWrite: boolean
}

export function DocumentCommentsPanel({ documentId, comments, canWrite }: DocumentCommentsPanelProps) {
  const constraints = getDocumentCommentInputConstraints()

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Kommentare &amp; Hinweise</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tenant-gebundene, audit-nahe Dokumenthinweise zur Nachvollziehbarkeit von Review- und Bearbeitungskontexten.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {canWrite ? (
          <DocumentCommentForm
            documentId={documentId}
            minBodyLength={constraints.minBodyLength}
            maxBodyLength={constraints.maxBodyLength}
            maxAnchorLength={constraints.maxAnchorLength}
          />
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Für diese Aktion fehlt die erforderliche Berechtigung.
          </div>
        )}

        {comments.length ? (
          <ol className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{comment.authorLabel}</p>
                  <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString("de-DE")}</p>
                </div>

                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Bereich: {getDocumentCommentSectionLabel(comment.sectionKey)}</p>

                {comment.anchorText ? (
                  <p className="mt-2 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">Referenztext: {comment.anchorText}</p>
                ) : null}

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{comment.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Für dieses Dokument liegen derzeit noch keine Kommentare vor.
          </div>
        )}
      </div>
    </section>
  )
}
