import { UploadIntakeForm } from "@/app/workspace/upload/upload-intake-form"

export default function WorkspaceUploadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📤 Workspace</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Dokument hochladen</h1>
      <p className="mt-2 text-[14px] text-gray-500">Erfassen Sie ein Dokument für die Verarbeitung im Workspace. Der Eingang wird mandantengebunden gespeichert.</p>

      <div className="mt-8">
        <UploadIntakeForm />
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-[13px] font-medium text-gray-700">💡 Tipp</p>
        <p className="mt-1 text-[12px] text-gray-500">Für eine schnelle KI-Analyse ohne Workspace-Erfassung nutzen Sie die <a href="/workspace/analyse" className="font-medium text-[#003856] hover:text-[#00507a]">⚡ Schnellanalyse</a>.</p>
      </div>
    </div>
  )
}
