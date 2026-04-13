"use client"

import Link from "next/link"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <span className="text-[28px]">⚠️</span>
        </div>
        <h1 className="mt-5 text-[1.5rem] font-semibold text-gray-950">Ein Fehler ist aufgetreten</h1>
        <p className="mt-2 text-[14px] text-gray-500">Die Anwendung hat einen unerwarteten Fehler festgestellt. Unser Team wurde automatisch benachrichtigt.</p>

        {error.digest && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 font-mono text-[11px] text-gray-400">Error-ID: {error.digest}</p>
        )}

        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">Erneut versuchen</button>
          <Link href="/dashboard" className="rounded-full border border-gray-200 bg-white px-6 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50">Zum Dashboard</Link>
        </div>

        <div className="mt-6 text-[12px] text-gray-400">
          Problem besteht weiterhin? <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">Support kontaktieren</Link>
        </div>
      </div>
    </main>
  )
}
