"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Notification = {
  id: string
  type: "analyse" | "review" | "system"
  emoji: string
  title: string
  desc: string
  time: string
  read: boolean
  href?: string
}

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Gerade eben"
  if (diffMin < 60) return `Vor ${diffMin} Min.`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Vor ${diffH} Std.`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `Vor ${diffD} ${diffD === 1 ? "Tag" : "Tagen"}`
  return dateFmt.format(d)
}

export default function BenachrichtigungenPage() {
  const [filter, setFilter] = useState("alle")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/notifications")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.notifications) setNotifications(data.notifications) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === "alle" ? notifications
    : filter === "ungelesen" ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })))

  const filters = [
    { id: "alle", label: "Alle" },
    { id: "ungelesen", label: `Ungelesen (${unreadCount})` },
    { id: "analyse", label: "Analysen" },
    { id: "review", label: "Reviews" },
    { id: "system", label: "System" },
  ]

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">{"\u{1F514}"} Dashboard</p>
          <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight text-gray-950">Benachrichtigungen</h1>
          <p className="text-[13px] text-gray-500">{unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigung${unreadCount > 1 ? "en" : ""}` : "Alle gelesen"}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-[12px] font-medium text-stone-600 transition-colors hover:bg-stone-50">
            Alle als gelesen markieren
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${filter === f.id ? "bg-[#003856] text-white" : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-5 space-y-2">
        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-[13px] text-gray-400">Benachrichtigungen werden geladen...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
            <p className="text-[14px] text-gray-500">{filter === "ungelesen" ? "Keine ungelesenen Benachrichtigungen" : "Keine Benachrichtigungen in dieser Kategorie"}</p>
            <p className="mt-1 text-[12px] text-gray-400">{notifications.length === 0 ? "Starten Sie eine Vertragsanalyse, um Benachrichtigungen zu erhalten." : "Waehlen Sie einen anderen Filter."}</p>
          </div>
        ) : (
          filtered.map(n => {
            const inner = (
              <div className={`flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors ${n.read ? "border-gray-100" : "border-[#C8985A]/30 bg-[#C8985A]/[0.03]"} ${n.href ? "hover:bg-stone-50 cursor-pointer" : ""}`}>
                <span className="mt-0.5 text-[20px]">{n.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[13px] font-medium ${n.read ? "text-gray-700" : "text-gray-950"}`}>{n.title}</p>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C8985A]" />}
                  </div>
                  <p className="mt-0.5 text-[12px] text-gray-500">{n.desc}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{formatTime(n.time)}</p>
                </div>
              </div>
            )
            return n.href ? <Link key={n.id} href={n.href}>{inner}</Link> : <div key={n.id}>{inner}</div>
          })
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-[12px] font-medium text-[#003856] hover:underline">{"←"} Zurück zum Dashboard</Link>
      </div>
    </div>
  )
}
