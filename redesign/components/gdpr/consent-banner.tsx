"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const CONSENT_KEY = "kanzlei_ai_cookie_consent"

export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    setVisible(!consent)
  }, [])

  const saveConsent = (value: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-gray-200 bg-white p-5 shadow-elevated md:left-auto md:max-w-lg">
      <p className="text-[13px] leading-relaxed text-gray-600">
        Wir verwenden technisch notwendige Cookies für Sicherheit und Login sowie optionale Analyse-Cookies.
      </p>
      <p className="mt-3 rounded-xl border border-[#003856]/10 bg-[#003856]/[0.03] p-3.5 text-[12px] leading-relaxed text-gray-600">
        KanzleiAI setzt KI-gestützte Funktionen ein. Die erzeugten Inhalte ersetzen keine Rechtsberatung. Eine fachliche Prüfung bleibt erforderlich.{" "}
        <Link href="/ki-transparenz" className="font-medium text-[#003856] underline underline-offset-2">
          Mehr erfahren
        </Link>
      </p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => saveConsent("accepted")} className="rounded-full bg-[#003856] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#002a42]">
          Alle akzeptieren
        </button>
        <button onClick={() => saveConsent("rejected")} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50">
          Nur notwendige
        </button>
      </div>
    </div>
  )
}
