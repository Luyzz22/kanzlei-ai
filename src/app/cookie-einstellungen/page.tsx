"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const CONSENT_KEY = "kanzlei_ai_cookie_consent"

const cookieCategories = [
  { id: "essential", label: "Essenziell", desc: "Fuer die Grundfunktion der Anwendung erforderlich (Auth-Session, CSRF-Schutz).", required: true },
  { id: "functional", label: "Funktional", desc: "Erweiterte Funktionen wie Analyse-Verlauf, Dashboard-Einstellungen und Sprachpraeferenzen.", required: false },
  { id: "analytics", label: "Analyse", desc: "Anonymisierte Nutzungsstatistiken zur Verbesserung der Plattform. Keine personenbezogenen Daten.", required: false },
]

export default function CookieEinstellungenPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({ essential: true, functional: true, analytics: false })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored) setSettings(JSON.parse(stored))
    } catch {}
  }, [])

  const handleSave = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-950">Cookie-Einstellungen</h1>
      <p className="mt-2 text-[14px] text-gray-500">Verwalten Sie Ihre Cookie-Praeferenzen. Essenzielle Cookies koennen nicht deaktiviert werden.</p>

      <div className="mt-10 space-y-4">
        {cookieCategories.map((cat) => (
          <div key={cat.id} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-gray-900">{cat.label}</h2>
                {cat.required && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Erforderlich</span>}
              </div>
              <p className="mt-1 text-[13px] text-gray-500">{cat.desc}</p>
            </div>
            <button onClick={() => !cat.required && setSettings(s => ({ ...s, [cat.id]: !s[cat.id] }))} disabled={cat.required} className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${settings[cat.id] ? "bg-[#003856]" : "bg-gray-200"} ${cat.required ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings[cat.id] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button onClick={handleSave} className="rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">Einstellungen speichern</button>
        {saved && <span className="text-[13px] font-medium text-emerald-600">✓ Gespeichert</span>}
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Weitere Informationen</h3>
        <p className="mt-2 text-[13px] text-gray-500">Details zur Datenverarbeitung finden Sie in unserer <Link href="/datenschutz" className="font-medium text-[#003856]">Datenschutzerklaerung</Link>. Bei Fragen wenden Sie sich an <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link>.</p>
      </div>
    </main>
  )
}
