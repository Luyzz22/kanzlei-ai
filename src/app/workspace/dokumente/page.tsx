import Link from "next/link"

export default function DokumentePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📂 Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Dokumenten-Workspace</h1>
        </div>
        <Link href="/workspace/upload" className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">📤 Hochladen</Link>
      </div>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">📂</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Dokumenten-Workspace</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Hier werden alle hochgeladenen und analysierten Verträge mandantengebunden angezeigt. Nutzen Sie die Schnellanalyse oder den Upload für neue Dokumente.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">⚡ Schnellanalyse</Link>
          <Link href="/workspace/history" className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">📋 Analyseverlauf</Link>
        </div>
      </div>
    </div>
  )
}
