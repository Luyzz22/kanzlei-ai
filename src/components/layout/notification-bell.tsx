"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const POLL_INTERVAL = 30_000;

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* silent */
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    load();
    pollRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  // ─── Outside Click ─────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Escape-Key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  // ─── Mark as Read ──────────────────────────────────────────
  async function markAsRead(id: string) {
    const target = items.find((n) => n.id === id);
    if (!target || target.readAt) return;

    // Optimistic Update
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: now } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        // Rollback bei Fehler
        await load();
      }
    } catch {
      await load();
    }
  }

  async function markAllAsRead() {
    if (unread === 0) return;
    setLoading(true);

    // Optimistic
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? now }))
    );
    setUnread(0);

    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) await load();
    } catch {
      await load();
    } finally {
      setLoading(false);
    }
  }

  // ─── Time Formatting ──────────────────────────────────────
  function formatTime(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMs / 3_600_000);
    const diffDay = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return "Gerade eben";
    if (diffMin < 60) return `Vor ${diffMin} Min.`;
    if (diffHr < 24) return `Vor ${diffHr} Std.`;
    if (diffDay < 7) return `Vor ${diffDay} Tag${diffDay > 1 ? "en" : ""}`;

    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
    });
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="relative" ref={wrapperRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-stone-100 active:bg-stone-200/80 transition-colors"
        aria-label={`Benachrichtigungen${unread > 0 ? `, ${unread} ungelesen` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-[18px] h-[18px] text-stone-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#C8985A] text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white shadow-sm animate-in fade-in zoom-in-50 duration-200">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[400px] bg-white rounded-2xl shadow-xl ring-1 ring-stone-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
            <h4 className="text-sm font-semibold text-[#003856] tracking-tight">
              Benachrichtigungen
            </h4>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs text-[#003856]/70 hover:text-[#003856] font-medium transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Alle gelesen
              </button>
            )}
          </div>

          {/* Items */}
          <ul className="max-h-[440px] overflow-y-auto divide-y divide-stone-100/80 overscroll-contain">
            {items.length === 0 ? (
              <li className="px-5 py-12 text-center">
                <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500">
                  Keine Benachrichtigungen
                </p>
              </li>
            ) : (
              items.map((n) => {
                const isUnread = !n.readAt;
                const content = (
                  <div className="flex items-start gap-3">
                    {/* Unread Dot */}
                    <div className="w-2 pt-[7px] flex-shrink-0">
                      {isUnread && (
                        <span className="block w-2 h-2 rounded-full bg-[#C8985A] shadow-[0_0_0_2px_rgba(200,152,90,0.15)]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13px] leading-snug truncate ${
                          isUnread
                            ? "font-semibold text-stone-900"
                            : "font-medium text-stone-500"
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-stone-400 mt-1.5 tabular-nums">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li
                    key={n.id}
                    className={`px-5 py-3.5 hover:bg-stone-50/80 transition-colors cursor-pointer ${
                      isUnread ? "bg-[#003856]/[0.02]" : ""
                    }`}
                    onClick={() => {
                      if (isUnread) markAsRead(n.id);
                    }}
                  >
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="block"
                        onClick={() => {
                          if (isUnread) markAsRead(n.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
