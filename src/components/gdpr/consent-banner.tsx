"use client"

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
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border bg-background p-4 shadow-lg md:left-auto md:max-w-xl">
      <p className="text-sm">
        Wir verwenden technisch notwendige Cookies für Sicherheit und Login sowie optionale Analyse-Cookies.
        Bitte treffen Sie eine Auswahl gemäß DSGVO.
      </p>
      <div className="mt-3 flex gap-2">
        <Button onClick={() => saveConsent("accepted")}>Alle akzeptieren</Button>
        <Button variant="secondary" onClick={() => saveConsent("rejected")}>
          Nur notwendige
        </Button>
      </div>
    </div>
  )
}
