import Link from "next/link"

import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"
import { getPromptGovernanceAdminSnapshot } from "@/lib/admin/prompt-governance-admin-core"
import { requireAdminAccess } from "@/lib/admin/guards"
import { PromptDefinitionStatus, PromptTaskStage } from "@prisma/client"

const stageLabel: Record<PromptTaskStage, string> = {
  EXTRACTION: "Extraktion",
  RISK_AND_GUIDANCE: "Risiko & Empfehlungen"
}

const defStatusLabel: Record<PromptDefinitionStatus, string> = {
  DRAFT: "Entwurf",
  ACTIVE: "Aktiv",
  DEPRECATED: "Veraltet"
}

export default async function AdminPromptGovernancePage() {
  const guard = await requireAdminAccess()

  if (!guard.ok) {
    return (
      <AdminEmptyState
        title="KI- & Prompt-Governance"
        description={
          guard.status === 401
            ? "Bitte melden Sie sich an."
            : "Zugriff nur für Plattform-Administratoren."
        }
        backHref={guard.status === 401 ? "/login" : "/dashboard/admin"}
        backLabel={guard.status === 401 ? "Zur Anmeldung" : "Zurück zum Admin Center"}
      />
    )
  }

  const { definitions, releases, evalRuns } = await getPromptGovernanceAdminSnapshot()

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · KI"
        title="Prompt-Governance & Eval-Läufe"
        description="Globale Prompt-Definitionen und aktive Releases (optional mandantenspezifisch). Evaluierungsläufe sind interne Nachweise ohne Mandantenisolation — nur für Admins sichtbar."
      />

      <InfoPanel title="Hinweis" tone="muted">
        <p className="text-sm text-slate-700">
          Prompt-Texte liegen im Code unter{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">src/lib/ai/prompt-registry/</code>. Die Datenbank
          versioniert Keys und steuert Aktivierung über Releases. Eval-Reports entstehen per{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">pnpm eval:contracts</code> (optional{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">--persist</code>
          ).
        </p>
        <p className="mt-2 text-sm text-slate-700">
          <Link href="/dashboard/admin" className="font-medium text-slate-900 underline">
            Zurück zum Admin Center
          </Link>
        </p>
      </InfoPanel>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-950">PromptDefinition</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Zweck</th>
              </tr>
            </thead>
            <tbody>
              {definitions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-500">
                    Keine Einträge. Nach Migration und Seed erscheinen Baseline-Definitionen.
                  </td>
                </tr>
              ) : (
                definitions.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{d.key}</td>
                    <td className="px-3 py-2 font-mono text-xs">{d.version}</td>
                    <td className="px-3 py-2">{defStatusLabel[d.status]}</td>
                    <td className="max-w-md px-3 py-2 text-slate-700">{d.purpose}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-950">PromptRelease</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Stufe</th>
                <th className="px-3 py-2">Muster</th>
                <th className="px-3 py-2">Mandant</th>
                <th className="px-3 py-2">Definition</th>
                <th className="px-3 py-2">Aktiv</th>
              </tr>
            </thead>
            <tbody>
              {releases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-slate-500">
                    Keine Releases. Ohne Release greift die Registry-Default-Auflösung.
                  </td>
                </tr>
              ) : (
                releases.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">{stageLabel[r.taskStage]}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.contractTypePattern}</td>
                    <td className="px-3 py-2">
                      {r.tenant ? `${r.tenant.name} (${r.tenant.slug})` : "Global"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.promptDefinition.key}@{r.promptDefinition.version}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge label={r.active ? "Ja" : "Nein"} tone={r.active ? "success" : "neutral"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-950">Letzte Eval-Läufe</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Zeit</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Evaluator</th>
                <th className="px-3 py-2">Zeilen</th>
                <th className="px-3 py-2">Bestanden</th>
              </tr>
            </thead>
            <tbody>
              {evalRuns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-slate-500">
                    Noch keine persistierten Läufe. Start mit{" "}
                    <code className="rounded bg-slate-100 px-1 text-xs">EVAL_PERSIST_DB=1 pnpm eval:contracts -- --persist</code>.
                  </td>
                </tr>
              ) : (
                evalRuns.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {e.createdAt.toLocaleString("de-DE")}
                    </td>
                    <td className="px-3 py-2">{e.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.evaluatorName}</td>
                    <td className="px-3 py-2">{e._count.results}</td>
                    <td className="px-3 py-2">
                      <StatusBadge label={e.passed ? "Ja" : "Nein"} tone={e.passed ? "success" : "risk"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
