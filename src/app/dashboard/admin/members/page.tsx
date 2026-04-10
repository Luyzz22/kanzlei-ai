"use client"

import { useState } from "react"
import Link from "next/link"

const demoMembers = [
  { name: "Luis Schenk", email: "ki@sbsdeutschland.de", role: "ADMIN", status: "Aktiv", lastLogin: "Heute" },
  { name: "Demo Nutzer", email: "demo@kanzlei-ai.com", role: "ANWALT", status: "Aktiv", lastLogin: "Heute" },
]

export default function MembersPage() {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("ANWALT")

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">👥 Administration</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Team-Mitglieder</h1>
          <p className="mt-2 text-[14px] text-gray-500">Nutzer einladen, Rollen zuweisen und Zugriffsrechte verwalten.</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">+ Nutzer einladen</button>
      </div>

      {showInvite && (
        <div className="mt-6 rounded-2xl border border-gold-200 bg-gold-50 p-6">
          <h3 className="text-[15px] font-semibold text-gray-900">Neuen Nutzer einladen</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_120px]">
            <input type="email" placeholder="E-Mail-Adresse" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200">
              <option value="ANWALT">Anwalt</option>
              <option value="ASSISTENT">Assistent</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button disabled={!inviteEmail.includes("@")} className="rounded-full bg-[#003856] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:cursor-not-allowed disabled:opacity-50">Einladen</button>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Der Nutzer erhaelt eine Einladungs-E-Mail mit einem Aktivierungslink.</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{demoMembers.length}</p>
          <p className="text-[11px] text-gray-400">Aktive Nutzer</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">1</p>
          <p className="text-[11px] text-gray-400">Administratoren</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">0</p>
          <p className="text-[11px] text-gray-400">Ausstehende Einladungen</p>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_1fr_100px_80px_80px]">
        <span>Name</span><span>E-Mail</span><span>Rolle</span><span>Status</span><span>Login</span>
      </div>
      <div className="overflow-hidden rounded-b-xl border border-gray-200">
        {demoMembers.map((m) => (
          <div key={m.email} className="grid border-b border-gray-100 bg-white px-5 py-3.5 last:border-b-0 sm:grid-cols-[1fr_1fr_100px_80px_80px] sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-700">{m.name.charAt(0)}</div>
              <span className="text-[14px] font-medium text-gray-900">{m.name}</span>
            </div>
            <span className="mt-1 text-[13px] text-gray-500 sm:mt-0">{m.email}</span>
            <span className={`mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold sm:mt-0 ${m.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{m.role}</span>
            <span className="mt-1 text-[12px] text-emerald-600 sm:mt-0">{m.status}</span>
            <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{m.lastLogin}</span>
          </div>
        ))}
      </div>

      {/* Roles Info */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Rollen-Modell (RBAC)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { role: "Admin", emoji: "🔐", perms: "Voller Zugriff, Nutzerverwaltung, Einstellungen, Audit-Log" },
            { role: "Anwalt", emoji: "⚖️", perms: "Analyse, Copilot, Dokumente, Review, Export" },
            { role: "Assistent", emoji: "📋", perms: "Dokumente einsehen, Upload, eingeschraenkter Export" },
          ].map((r) => (
            <div key={r.role} className="rounded-lg border border-gray-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">{r.emoji}</span>
                <span className="text-[13px] font-semibold text-gray-900">{r.role}</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">{r.perms}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
