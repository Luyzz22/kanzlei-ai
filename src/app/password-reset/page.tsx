import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Passwort zurücksetzen" }

export default function PasswordResetPage() {
  return (
    <main className="flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px] text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003856]">
          <span className="text-[14px] font-bold text-white">KA</span>
        </div>
        <h1 className="mt-5 text-[1.5rem] font-semibold tracking-tight text-gray-950">Passwort zurücksetzen</h1>
        <p className="mt-2 text-[14px] text-gray-500">Bitte kontaktieren Sie Ihren Administrator oder unser Support-Team für eine Passwort-Zurücksetzung.</p>
        <div className="mt-8 space-y-3">
          <Link href="mailto:ki@sbsdeutschland.de" className="block rounded-full bg-[#003856] py-3.5 text-[14px] font-medium text-white hover:bg-[#002a42]">📧 ki@sbsdeutschland.de</Link>
          <Link href="/login" className="block rounded-full border border-gray-200 bg-white py-3.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50">← Zurück zum Login</Link>
        </div>
        <p className="mt-6 text-[11px] text-gray-400">Enterprise-Kunden mit SSO: Bitte nutzen Sie Ihren Identity Provider für die Passwort-Verwaltung.</p>
      </div>
    </main>
  )
}
