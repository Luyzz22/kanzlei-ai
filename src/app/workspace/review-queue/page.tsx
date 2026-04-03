export default function ReviewQueuePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✅ Governance</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Review & Freigabe</h1>
      <p className="mt-2 text-[14px] text-gray-500">Strukturierte Prüf- und Freigabeprozesse für analysierte Verträge.</p>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">✅</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Keine offenen Reviews</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Analysierte Verträge mit identifizierten Risiken erscheinen hier zur strukturierten Prüfung und Freigabe durch berechtigte Nutzer.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-[12px] text-gray-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Ausstehend: 0</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" /> In Prüfung: 0</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Freigegeben: 0</span>
        </div>
      </div>
    </div>
  )
}
