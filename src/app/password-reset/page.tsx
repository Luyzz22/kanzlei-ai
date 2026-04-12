"use client"

import { useState } from "react"
import Link from "next/link"

export default function PasswordResetPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.includes("@")) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setSent(true)
    setLoading(false)
  }

  return (
    <main className="flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003856]">
            <span className="text-[14px] font-bold text-white">KA</span>
          </div>
          <h1 className="mt-5 text-[1.5rem] font-semibold tracking-tight text-gray-950">Passwort zuruecksetzen</h1>
          <p className="mt-2 text-[14px] text-gray-500">{sent ? "Pruefung erfolgreich. Falls ein Konto existiert, erhalten Sie eine E-Mail." : "Geben Sie Ihre E-Mail-Adresse ein, um einen Reset-Link zu erhalten."}</p>
        </div>

        {!sent ? (
          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">E-Mail-Adresse</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="name@unternehmen.de" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" autoFocus />
            </div>
            <button onClick={handleSubmit} disabled={!email.includes("@") || loading} className="w-full rounded-full bg-[#003856] py-3.5 text-[14px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Wird gesendet...
                </span>
              ) : "Reset-Link senden"}
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <span className="text-[28px]">✅</span>
            <p className="mt-2 text-[14px] font-medium text-emerald-900">E-Mail gesendet</p>
            <p className="mt-1 text-[13px] text-emerald-700">Falls ein Konto mit <strong>{email}</strong> existiert, erhalten Sie in Kuerze eine E-Mail mit einem Link zur Passwortzuruecksetzung.</p>
          </div>
        )}

        <div className="mt-6 space-y-3 text-center">
          <Link href="/login" className="block text-[14px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zum Login</Link>
          <p className="text-[11px] text-gray-400">Enterprise-Kunden mit SSO nutzen bitte Ihren Identity Provider.</p>
        </div>
      </div>
    </main>
  )
}
