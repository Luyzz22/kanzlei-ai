"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type ProfileData = {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
  createdAt: string
  updatedAt: string
  emailVerified: string | null
  externalId: string | null
  tenantName: string | null
  tenantSlug: string | null
  tenantRole: string | null
  usesPasswordAuth: boolean
  ssoProvider: string | null
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  ANWALT: "Anwalt",
  PARTNER: "Partner",
  ASSISTENT: "Assistent",
  VIEWER: "Betrachter",
  OWNER: "Eigentümer",
  MEMBER: "Mitglied"
}

function roleLabel(role: string): string {
  return roleLabels[role] ?? role
}

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit"
})

function UserInitials({ name, email }: { name: string | null; email: string }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#003856] text-[20px] font-bold text-white shadow-sm">
      {initials}
    </div>
  )
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Password change state
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwChanging, setPwChanging] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : Promise.reject("Fehler"))
      .then(data => setProfile(data.profile))
      .catch(() => setError("Profil konnte nicht geladen werden."))
      .finally(() => setLoading(false))
  }, [])

  async function handlePasswordChange() {
    if (!currentPw || newPw.length < 8 || newPw !== confirmPw) return
    setPwChanging(true)
    setPwMessage(null)
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      })
      const data = await res.json()
      if (res.ok) {
        setPwMessage({ type: "success", text: data.message || "Passwort wurde geändert." })
        setCurrentPw("")
        setNewPw("")
        setConfirmPw("")
      } else {
        setPwMessage({ type: "error", text: data.error || "Passwortänderung fehlgeschlagen." })
      }
    } catch {
      setPwMessage({ type: "error", text: "Netzwerkfehler — bitte erneut versuchen." })
    } finally {
      setPwChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#003856]" />
        <p className="mt-4 text-[13px] text-gray-400">Profil wird geladen …</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="text-[36px]">⚠️</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Profil nicht verfügbar</h1>
        <p className="mt-2 text-[14px] text-gray-500">{error || "Bitte melden Sie sich erneut an."}</p>
      </div>
    )
  }

  const pwValid = currentPw.length > 0 && newPw.length >= 8 && newPw === confirmPw
  const pwMismatch = newPw.length > 0 && confirmPw.length > 0 && newPw !== confirmPw

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">👤 Konto</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Mein Profil</h1>
      <p className="mt-2 text-[14px] text-gray-500">Persönliche Einstellungen und Zugangsdaten verwalten.</p>

      {/* ─── Profile Header ─── */}
      <div className="mt-10 flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6">
        <UserInitials name={profile.name} email={profile.email} />
        <div className="flex-1">
          <h2 className="text-[18px] font-semibold text-gray-950">{profile.name || profile.email}</h2>
          <p className="mt-0.5 text-[13px] text-gray-500">{profile.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#003856] px-2.5 py-0.5 text-[10px] font-semibold text-white">
              {roleLabel(profile.role)}
            </span>
            {profile.tenantRole && profile.tenantRole !== profile.role && (
              <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-semibold text-gold-800">
                {roleLabel(profile.tenantRole)}
              </span>
            )}
            {profile.ssoProvider && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                {profile.ssoProvider}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Account Details ─── */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">Kontoinformationen</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoCell label="Mandant" value={profile.tenantName || "—"} />
          <InfoCell label="Mandanten-Kennung" value={profile.tenantSlug || "—"} mono />
          <InfoCell label="Plattformrolle" value={roleLabel(profile.role)} />
          <InfoCell label="Mandantenrolle" value={profile.tenantRole ? roleLabel(profile.tenantRole) : "—"} />
          <InfoCell label="Konto erstellt" value={dateFmt.format(new Date(profile.createdAt))} />
          <InfoCell label="Letzte Aktualisierung" value={dateFmt.format(new Date(profile.updatedAt))} />
          {profile.emailVerified && (
            <InfoCell label="E-Mail verifiziert" value={dateFmt.format(new Date(profile.emailVerified))} />
          )}
          <InfoCell label="Authentifizierung" value={profile.ssoProvider ? `SSO (${profile.ssoProvider})` : "E-Mail & Passwort"} />
        </dl>
      </div>

      {/* ─── Password Change ─── */}
      {profile.usesPasswordAuth ? (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-[15px] font-semibold text-gray-900">Passwort ändern</h2>
          <p className="mt-1 text-[12px] text-gray-500">Mindestens 8 Zeichen. Wird verschlüsselt gespeichert (bcrypt).</p>
          <div className="mt-4 space-y-3">
            <input
              type="password"
              placeholder="Aktuelles Passwort"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
            <input
              type="password"
              placeholder="Neues Passwort (min. 8 Zeichen)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
            <input
              type="password"
              placeholder="Neues Passwort bestätigen"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
            {pwMismatch && (
              <p className="text-[12px] text-red-600">Passwörter stimmen nicht überein.</p>
            )}
            {newPw.length > 0 && newPw.length < 8 && (
              <p className="text-[12px] text-amber-600">Mindestens 8 Zeichen erforderlich.</p>
            )}
            <button
              onClick={handlePasswordChange}
              disabled={!pwValid || pwChanging}
              className="inline-flex items-center gap-2 rounded-full bg-[#003856] px-6 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pwChanging ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Wird geändert …
                </>
              ) : (
                "Passwort ändern"
              )}
            </button>
            {pwMessage && (
              <div className={`rounded-lg px-4 py-2.5 text-[12px] font-medium ${
                pwMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
              }`}>
                {pwMessage.type === "success" ? "✓" : "✕"} {pwMessage.text}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <span className="text-[22px]">🔑</span>
            <div>
              <h3 className="text-[14px] font-semibold text-amber-900">Enterprise SSO</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-700">
                Ihr Konto ist über <strong>{profile.ssoProvider || "SSO"}</strong> authentifiziert.
                Passwortänderungen werden über Ihren Identity Provider verwaltet.
                Kontaktieren Sie Ihren IT-Administrator für Änderungen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Security Info ─── */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">Sicherheit</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[14px]">🔐</span>
              <div>
                <p className="text-[13px] font-medium text-gray-900">Audit-Trail</p>
                <p className="text-[11px] text-gray-500">Alle Ihre Aktionen werden protokolliert</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Aktiv</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[14px]">🛡️</span>
              <div>
                <p className="text-[13px] font-medium text-gray-900">Datenverschlüsselung</p>
                <p className="text-[11px] text-gray-500">TLS 1.3 + AES-256 at Rest</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Aktiv</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[14px]">🌍</span>
              <div>
                <p className="text-[13px] font-medium text-gray-900">Datenstandort</p>
                <p className="text-[11px] text-gray-500">Frankfurt (eu-central-1) — DSGVO-konform</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">EU</span>
          </div>
        </div>
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-red-700">Gefahrenzone</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
          Das Löschen Ihres Kontos entfernt alle Ihre Daten unwiderruflich.
          Diese Aktion kann nicht rückgängig gemacht werden. Kontaktieren Sie Ihren Administrator
          oder schreiben Sie an{" "}
          <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">
            ki@sbsdeutschland.de
          </Link>.
        </p>
      </div>

      {/* ─── Back ─── */}
      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">
          ← Zurück zur Verwaltung
        </Link>
      </div>
    </div>
  )
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className={`mt-1 text-[13px] text-gray-900 ${mono ? "font-mono text-[12px]" : ""}`}>{value}</dd>
    </div>
  )
}
