"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

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
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border bg-background p-4 shadow-lg md:left-auto md:max-w-2xl">
      <p className="text-sm">
        Wir verwenden technisch notwendige Cookies für Sicherheit und Login sowie optionale Analyse-Cookies. Bitte
        treffen Sie eine Auswahl gemäß DSGVO.
      </p>
      <p className="mt-2 rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        <strong>Hinweis zur KI-Nutzung:</strong> KanzleiAI setzt KI-gestützte Funktionen zur Vertragsanalyse und
        Dokumentenerstellung ein. Alle Ergebnisse sind Vorschläge, können Fehler enthalten und ersetzen keine
        Rechtsberatung. Die finale rechtliche Beurteilung und Freigabe verbleibt bei der verantwortlichen Kanzlei.
      </p>
      <Link href="/ki-transparenz" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
        Mehr über unsere KI-Nutzung
      </Link>
      <div className="mt-3 flex gap-2">
        <Button onClick={() => saveConsent("accepted")}>Alle akzeptieren</Button>
        <Button variant="secondary" onClick={() => saveConsent("rejected")}>
          Nur notwendige
        </Button>
      </div>
    </div>
  )
}
