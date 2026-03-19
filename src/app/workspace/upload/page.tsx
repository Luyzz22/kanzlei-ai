import { InfoPanel } from "@/components/marketing/info-panel"
import { PageShell } from "@/components/marketing/page-shell"
import { SectionIntro } from "@/components/marketing/section-intro"

import { UploadIntakeForm } from "@/app/workspace/upload/upload-intake-form"

export default function WorkspaceUploadPage() {
  return (
    <PageShell width="default" className="space-y-6">
      <SectionIntro
        eyebrow="Workspace · Intake"
        title="Dokumenteingang für den Arbeitskontext erfassen"
        description="Diese Seite bildet die erste produktive Intake-Basis für den tenant-gebundenen Dokumenteingang. Nach dem Anlegen steht der Eintrag als nachvollziehbarer Datensatz für nachgelagerte Prüf- und Freigabeschritte bereit."
      />

      <UploadIntakeForm />

      <InfoPanel title="Hinweis zum aktuellen Umfang" tone="muted">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Die Intake-Erfassung speichert Metadaten und Status tenant-gebunden in der Datenbank.</li>
          <li>Hochgeladene Dateien werden tenant-gebunden intern abgelegt und per Storage-Key referenziert.</li>
          <li>Der Status startet mit „Eingegangen“ und ist für spätere Review-Prozesse vorbereitet.</li>
          <li>Weitere Verarbeitung wie Parsing oder Vorschau folgt in einem nachgelagerten Ausbau.</li>
        </ul>
      </InfoPanel>
    </PageShell>
  )
}
