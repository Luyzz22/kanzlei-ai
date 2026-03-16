import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"

import { UploadIntakeForm } from "@/app/workspace/upload/upload-intake-form"

export default function WorkspaceUploadPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Workspace · Intake"
        title="Dokumenteingang für den Arbeitskontext erfassen"
        description="Diese Seite bildet die erste produktive Intake-Basis für den tenant-gebundenen Dokumenteingang. Nach dem Anlegen steht der Eintrag als nachvollziehbarer Datensatz für nachgelagerte Prüf- und Freigabeschritte bereit."
      />

      <UploadIntakeForm />

      <InfoPanel title="Hinweis zum aktuellen Umfang" tone="muted">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Die Intake-Erfassung speichert Metadaten und Status tenant-gebunden in der Datenbank.</li>
          <li>Der Status startet mit „Eingegangen“ und ist für spätere Review-Prozesse vorbereitet.</li>
          <li>Dateiinhalt wird in diesem Schritt noch nicht persistiert; optionale Dateimetadaten werden erfasst.</li>
        </ul>
      </InfoPanel>
    </main>
  )
}
