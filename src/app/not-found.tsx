import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="text-center">
        <span className="text-[48px]">⚖️</span>
        <h1 className="mt-4 text-[2rem] font-semibold text-gray-950">Seite nicht gefunden</h1>
        <p className="mt-2 text-[15px] text-gray-500">Die angeforderte Seite existiert nicht oder wurde verschoben.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">Zur Startseite</Link>
          <Link href="/hilfe" className="rounded-full border border-gray-200 bg-white px-6 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50">Hilfe</Link>
        </div>
      </div>
    </main>
  )
}
