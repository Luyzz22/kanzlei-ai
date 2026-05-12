"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchUnread() {
      try {
        const res = await fetch("/api/dashboard/notifications")
        if (!res.ok) return
        const data = await res.json() as { notifications?: Array<{ read: boolean }> }
        if (cancelled || !data.notifications) return
        const count = data.notifications.filter((n) => !n.read).length
        setUnreadCount(count)
      } catch {
        // Silently fail — bell shows no badge if fetch fails
      }
    }

    fetchUnread()
    // Refresh every 60s
    const interval = setInterval(fetchUnread, 60_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <Link
      href="/dashboard/benachrichtigungen"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[8px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  )
}
