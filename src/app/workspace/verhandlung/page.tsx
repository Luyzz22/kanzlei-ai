"use client"

import { useState } from "react"
import Link from "next/link"

type Scenario = {
  id: string
  title: string
  contractType: string
  counterparty: string
  difficulty: "einfach" | "mittel" | "schwer" | "expert"
  objectives: string[]
  icon: string
}

type Message = {
  role: "user" | "opponent" | "coach"
  content: string
  timestamp: string
  score?: number
}

const scenarios: Scenario[] = [
  { id: "sc-01", title: "Lieferantenvertrag — Haftungsbegrenzung verhandeln", contractType: "Lieferantenvertrag", counterparty: "Techvendor GmbH (hart, erfahren)", difficulty: "mittel", objectives: ["Haftung auf 12 Monate begrenzen", "IP-Rechte sichern", "Kuendigungsrecht 3 Monate"], icon: "🏭" },
  { id: "sc-02", title: "SaaS-Vertrag — DSGVO und Datenstandort", contractType: "SaaS-Vertrag", counterparty: "US-Cloud-Provider (kompromissbereit)", difficulty: "schwer", objectives: ["EU-Datenhaltung garantieren", "AVV anpassen", "SCCs aktuell"], icon: "☁️" },
  { id: "sc-03", title: "NDA — Beidseitig, M&A-Kontext", contractType: "NDA", counterparty: "Investmentbank (professionell)", difficulty: "einfach", objectives: ["Symmetrie herstellen", "Laufzeit 3 Jahre", "Standard-Ausnahmen"], icon: "🤝" },
  { id: "sc-04", title: "Rahmenvertrag — LkSG-Klauseln durchsetzen", contractType: "Rahmenvertrag", counterparty: "Internationaler Zulieferer (widerstandig)", difficulty: "expert", objectives: ["LkSG-Sorgfaltspflichten", "Audit-Recht", "Code of Conduct"], icon: "🌍" },
]

const difficultyColor = (d: string) => {
  if (d === "einfach") return "bg-emerald-100 text-emerald-700"
  if (d === "mittel") return "bg-blue-100 text-blue-700"
  if (d === "schwer") return "bg-amber-100 text-amber-700"
  return "bg-red-100 text-red-700"
}

export default function VerhandlungPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [view, setView] = useState<"library" | "session" | "debrief">("library")

  const activeScenario = scenarios.find(s => s.id === selected)

  const startScenario = (id: string) => {
    setSelected(id)
    setView("session")
    const sc = scenarios.find(s => s.id === id)
    if (!sc) return
    setMessages([
      { role: "coach", content: `Simulation gestartet: ${sc.title}. Ihre Gegenpartei: ${sc.counterparty}. Sie verhandeln live — ich beobachte und gebe nach jedem Zug Feedback zu Ihrer Argumentation.`, timestamp: "10:00" },
      { role: "opponent", content: `Guten Tag. Wir haben Ihren Vertragsentwurf geprueft. Einige Punkte sehen wir anders — insbesondere die Haftungsklausel. Unsere Standardhaftung betraegt 24 Monate Auftragsvolumen, nicht 12. Das ist branchenueblich und nicht verhandelbar.`, timestamp: "10:01" }
    ])
    setSessionScore(0)
  }

  const sendMove = async () => {
    if (!input.trim()) return
    const userMsg: Message = { role: "user", content: input, timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) }
    setMessages(m => [...m, userMsg])
    setInput("")
    setThinking(true)

    await new Promise(r => setTimeout(r, 1800))

    // Simulated AI response based on user input
    const hasBGB = input.toLowerCase().includes("bgb") || input.toLowerCase().includes("§")
    const hasMarket = input.toLowerCase().includes("markt") || input.toLowerCase().includes("ueblich") || input.toLowerCase().includes("branche")
    const hasAlternative = input.toLowerCase().includes("alternativ") || input.toLowerCase().includes("stattdessen") || input.toLowerCase().includes("kompromiss")
    const score = (hasBGB ? 30 : 0) + (hasMarket ? 25 : 0) + (hasAlternative ? 25 : 0) + 20

    const coachFeedback: Message = {
      role: "coach",
      content: score >= 70 ? `Starker Zug (${score}/100). ${hasBGB ? "Gute BGB-Verankerung. " : ""}${hasMarket ? "Markt-Benchmark ueberzeugt. " : ""}${hasAlternative ? "Konstruktive Alternative bringt Bewegung rein." : ""}` : score >= 50 ? `Solide (${score}/100). Tipp: ${!hasBGB ? "Rechtliche Basis (BGB §§) staerkt Ihre Position." : !hasAlternative ? "Bieten Sie eine konkrete Alternative an, nicht nur Ablehnung." : "Verankern Sie mit Marktdaten."}` : `Schwach (${score}/100). Ihr Gegenueber hat eine konkrete Zahl genannt — Sie brauchen Gegenargumente, nicht nur Gegenpositionen. Versuchen Sie: Markt-Benchmark + BGB-Referenz + konkreter Kompromissvorschlag.`,
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      score
    }

    const opponentReply: Message = {
      role: "opponent",
      content: score >= 70 
        ? `Das ist ein interessanter Ansatz. Wir koennen ueber 18 Monate sprechen, wenn Sie im Gegenzug die Zahlungsfrist auf 45 Tage verkuerzen. Wie sehen Sie das?`
        : score >= 50
        ? `Ich verstehe Ihren Punkt, aber unsere Geschaeftsleitung wird bei 12 Monaten nicht mitgehen. Was koennen Sie im Gegenzug bieten?`
        : `Das ueberzeugt uns nicht. Ohne weitere Begruendung muessen wir an 24 Monaten festhalten. Das ist unser Standard.`,
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    }

    setMessages(m => [...m, coachFeedback, opponentReply])
    setSessionScore(s => s + score)
    setThinking(false)
  }

  const endSession = () => {
    setView("debrief")
  }

  const avgScore = messages.filter(m => m.score).length > 0 ? Math.round(sessionScore / messages.filter(m => m.score).length) : 0

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-600 text-[12px] font-bold text-white">VS</span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">Modul 10 · Enterprise</p>
          </div>
          <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Verhandlungssimulator</h1>
          <p className="mt-1 text-[14px] text-gray-500">Ueben Sie reale Vertragsverhandlungen gegen eine KI-Gegenpartei. Mit Coaching-Feedback nach jedem Zug.</p>
        </div>
        {view === "session" && (
          <button onClick={endSession} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50">Session beenden</button>
        )}
      </div>

      {/* Library View */}
      {view === "library" && (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-400">Absolvierte Sessions</p>
              <p className="mt-1 text-[22px] font-semibold text-gray-900">0</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-400">Ø Score</p>
              <p className="mt-1 text-[22px] font-semibold text-gray-900">—</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-400">Trainingszeit</p>
              <p className="mt-1 text-[22px] font-semibold text-gray-900">0 Min</p>
            </div>
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
              <p className="text-[11px] uppercase tracking-wider text-gold-700">Level</p>
              <p className="mt-1 text-[22px] font-semibold text-gold-900">Einsteiger</p>
            </div>
          </div>

          <h2 className="mt-10 text-[15px] font-semibold text-gray-900">Szenario-Bibliothek</h2>
          <p className="mt-1 text-[13px] text-gray-500">4 vordefinierte Szenarien. KI-Gegenpartei adaptiert an Ihre Argumentation.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {scenarios.map((sc) => (
              <div key={sc.id} onClick={() => startScenario(sc.id)} className="cursor-pointer rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gold-300 hover:shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[28px]">{sc.icon}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${difficultyColor(sc.difficulty)}`}>{sc.difficulty}</span>
                </div>
                <h3 className="mt-3 text-[14px] font-semibold text-gray-900">{sc.title}</h3>
                <p className="mt-1 text-[12px] text-gray-500">Gegenpartei: {sc.counterparty}</p>
                <div className="mt-3 space-y-1">
                  {sc.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[8px] font-bold text-gold-700">{i+1}</span>
                      <span className="text-[12px] text-gray-600">{obj}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full rounded-full bg-[#003856] py-2 text-[12px] font-medium text-white hover:bg-[#002a42]">Szenario starten →</button>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <h3 className="text-[14px] font-semibold text-gray-900">Wie funktioniert die Simulation?</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { step: "1", title: "Szenario waehlen", desc: "Realitaetsnahe Situationen aus echten Verhandlungen" },
                { step: "2", title: "Live verhandeln", desc: "KI-Gegenpartei reagiert adaptiv auf Ihre Argumente" },
                { step: "3", title: "Coaching erhalten", desc: "Nach jedem Zug Feedback zu Ihrer Argumentation" },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[12px] font-bold text-white">{s.step}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{s.title}</p>
                    <p className="text-[11px] text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Session View */}
      {view === "session" && activeScenario && (
        <div className="mt-6">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-[#003856] to-[#002a42] p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gold-300">Aktive Session</p>
                <h2 className="mt-1 text-[16px] font-semibold">{activeScenario.title}</h2>
                <p className="mt-1 text-[12px] text-gray-300">Gegenpartei: {activeScenario.counterparty}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-300">Laufender Score</p>
                <p className="text-[28px] font-semibold">{avgScore}<span className="text-[14px] text-gray-400">/100</span></p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role !== "user" && (
                  <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    msg.role === "opponent" ? "bg-gray-900 text-white" : "bg-gold-500 text-white"
                  }`}>
                    {msg.role === "opponent" ? "GP" : "🎯"}
                  </span>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user" ? "bg-[#003856] text-white" :
                  msg.role === "opponent" ? "bg-gray-100 text-gray-900" :
                  "border border-gold-200 bg-gold-50 text-gold-900"
                }`}>
                  {msg.role === "coach" && (
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Coach-Feedback</p>
                      {msg.score !== undefined && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${msg.score >= 70 ? "bg-emerald-200 text-emerald-800" : msg.score >= 50 ? "bg-amber-200 text-amber-800" : "bg-red-200 text-red-800"}`}>{msg.score}</span>}
                    </div>
                  )}
                  <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${msg.role === "user" ? "text-white/60" : "text-gray-400"}`}>{msg.timestamp}</p>
                </div>
                {msg.role === "user" && (
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[11px] font-bold text-white">SIE</span>
                )}
              </div>
            ))}
            {thinking && (
              <div className="flex gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[12px] font-bold text-white">GP</span>
                <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-4 mt-6 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !thinking) { e.preventDefault(); sendMove() } }}
              placeholder="Ihr naechster Zug... (Tipp: Nutzen Sie BGB-Referenzen, Marktdaten und konkrete Alternativen)"
              className="w-full resize-none bg-transparent px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
              rows={2}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {["BGB-Argument", "Marktvergleich", "Kompromiss"].map((tag) => (
                  <button key={tag} onClick={() => setInput(i => i + (i ? " " : "") + tag + ": ")} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-50">{tag}</button>
                ))}
              </div>
              <button onClick={sendMove} disabled={thinking || !input.trim()} className="rounded-full bg-[#003856] px-5 py-1.5 text-[12px] font-medium text-white hover:bg-[#002a42] disabled:opacity-50">
                Zug senden →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debrief View */}
      {view === "debrief" && activeScenario && (
        <div className="mt-8">
          <div className="rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-white p-8 text-center">
            <span className="text-[48px]">🎓</span>
            <h2 className="mt-3 text-[22px] font-semibold text-gray-900">Session abgeschlossen</h2>
            <p className="mt-1 text-[13px] text-gray-500">{activeScenario.title}</p>
            <div className="mt-6 inline-flex flex-col items-center">
              <p className="text-[11px] uppercase tracking-widest text-gold-700">Finaler Score</p>
              <p className="mt-1 text-[64px] font-semibold leading-none text-[#003856]">{avgScore}</p>
              <p className="text-[13px] text-gray-500">{avgScore >= 70 ? "Starke Verhandlungsfuehrung" : avgScore >= 50 ? "Solide Grundlagen" : "Weiter ueben"}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => { setView("library"); setSelected(null) }} className="flex-1 rounded-full border border-gray-200 bg-white px-5 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50">Neues Szenario</button>
            <button onClick={() => startScenario(activeScenario.id)} className="flex-1 rounded-full bg-[#003856] px-5 py-3 text-[13px] font-medium text-white hover:bg-[#002a42]">Nochmal versuchen</button>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-[11px] text-gray-500">⚖️ Trainings-Tool — keine Rechtsberatung · EU AI Act: Minimal Risk (Bildungstool) · <Link href="/ki-transparenz" className="font-medium text-[#003856]">KI-Transparenz</Link></p>
      </div>
    </div>
  )
}
