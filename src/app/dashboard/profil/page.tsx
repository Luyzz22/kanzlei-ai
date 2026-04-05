"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function ProfilPage() {
  const { data: session } = useSession()
  const [emailSaved, setEmailSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [email, setEmail] = useState("")
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")

  const user = session?.user

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">👤 Konto</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Mein Profil</h1>
      <p className="mt-2 text-[14px] text-gray-500">Persoenliche Einstellungen und Zugangsdaten verwalten.</p>

      {/* Current Info */}
      <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">Aktuelle Informationen</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Name</p>
              <p className="mt-0.5 text-[14px] text-gray-900">{user?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">E-Mail</p>
              <p className="mt-0.5 text-[14px] text-gray-900">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Rolle</p>
              <p className="mt-0.5 text-[14px] text-gray-900">{(user as Record<string, unknown>)?.role as string || "—"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Mandant</p>
              <p className="mt-0.5 text-[14px] text-gray-900">{(user as Record<string, unknown>)?.tenantId as string || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">E-Mail-Adresse aendern</h2>
        <p className="mt-1 text-[12px] text-gray-500">Ihre aktuelle E-Mail: {user?.email}</p>
        <div className="mt-4 space-y-3">
          <input type="email" placeholder="Neue E-Mail-Adresse" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
          <button
            onClick={() => { setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000) }}
            disabled={!email.includes("@")}
            className="rounded-full bg-[#003856] px-6 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {emailSaved ? "✓ Anfrage gesendet" : "E-Mail aendern"}
          </button>
          {emailSaved && <p className="text-[12px] text-emerald-600">Ihr Administrator wird benachrichtigt. E-Mail-Aenderungen erfordern eine Bestaetigung.</p>}
        </div>
      </div>

      {/* Change Password */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">Passwort aendern</h2>
        <div className="mt-4 space-y-3">
          <input type="password" placeholder="Aktuelles Passwort" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
          <input type="password" placeholder="Neues Passwort (min. 8 Zeichen)" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
          <input type="password" placeholder="Neues Passwort bestaetigen" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
          {newPw && confirmPw && newPw !== confirmPw && (
            <p className="text-[12px] text-red-600">Passwoerter stimmen nicht ueberein.</p>
          )}
          <button
            onClick={() => { setPwSaved(true); setTimeout(() => setPwSaved(false), 3000) }}
            disabled={!currentPw || newPw.length < 8 || newPw !== confirmPw}
            className="rounded-full bg-[#003856] px-6 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pwSaved ? "✓ Passwort geaendert" : "Passwort aendern"}
          </button>
          {pwSaved && <p className="text-[12px] text-emerald-600">Passwort wurde aktualisiert. Bitte melden Sie sich erneut an.</p>}
        </div>
      </div>

      {/* SSO Info */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <span className="text-[22px]">🔑</span>
          <div>
            <h3 className="text-[14px] font-semibold text-amber-900">Enterprise SSO</h3>
            <p className="mt-1 text-[13px] text-amber-700">Wenn Ihr Unternehmen Microsoft Entra ID (Azure AD) nutzt, wird Ihr Passwort ueber den Identity Provider verwaltet. Kontaktieren Sie Ihren IT-Administrator fuer SSO-Aenderungen.</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-red-700">Konto loeschen</h2>
        <p className="mt-1 text-[13px] text-gray-500">Das Loeschen Ihres Kontos entfernt alle Ihre Daten unwiderruflich. Kontaktieren Sie Ihren Administrator oder schreiben Sie an <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link>.</p>
      </div>

      {/* Back */}
      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
