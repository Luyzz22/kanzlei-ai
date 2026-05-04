"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"

type Scenario = {
  id: string
  title: string
  contractType: string
  counterparty: string
  difficulty: "einfach" | "mittel" | "schwer" | "expert"
  objectives: string[]
  icon: string
  opener: string
}

type Message = {
  role: "user" | "opponent" | "coach"
  content: string
  timestamp: string
  score?: number
}

const scenarios: Scenario[] = [
  {
    id: "sc-01",
    title: "Lieferantenvertrag — Haftungsbegrenzung",
    contractType: "Lieferantenvertrag",
    counterparty: "Techvendor GmbH (hart, erfahren)",
    difficulty: "mittel",
    objectives: ["Haftung auf 12 Monatsverguetungen begrenzen", "IP-Rechte beim Auftraggeber sichern", "Kuendigungsrecht mit 3 Monaten Frist"],
    icon: "\u{1F3ED}",
    opener: "Guten Tag. Wir haben Ihren Vertragsentwurf geprueft. Einige Punkte sehen wir anders \u2014 insbesondere die Haftungsklausel. Unsere Standardhaftung betraegt 24 Monate Auftragsvolumen, das ist branchenueblich. Zudem behalten wir uns die IP-Rechte an allen Arbeitsergebnissen vor. Dazu ist unsere Mindestlaufzeit 36 Monate."
  },
  {
    id: "sc-02",
    title: "SaaS-Vertrag — DSGVO und Datenstandort",
    contractType: "SaaS-Vertrag",
    counterparty: "US-Cloud-Provider (kompromissbereit)",
    difficulty: "schwer",
    objectives: ["EU-Datenhaltung vertraglich garantieren", "AVV nach Art. 28 DSGVO anpassen", "Aktuelle SCCs vereinbaren"],
    icon: "\u2601\uFE0F",
    opener: "Hi, thanks for reaching out about the data processing terms. Our standard DPA covers most GDPR requirements. Data is stored in our global network \u2014 we can route to EU but cannot guarantee exclusive EU hosting. Our subprocessor list is updated quarterly on our website."
  },
  {
    id: "sc-03",
    title: "NDA — Beidseitig, M&A-Kontext",
    contractType: "NDA",
    counterparty: "Investmentbank (professionell, schnell)",
    difficulty: "einfach",
    objectives: ["Beidseitige Geheimhaltungspflichten sicherstellen", "Laufzeit auf 3 Jahre begrenzen", "Standard-Ausnahmen fuer bekannte Informationen"],
    icon: "\u{1F91D}",
    opener: "Vielen Dank fuer Ihr Interesse an der Transaktion. Wir haben Ihnen unsere Standard-NDA zugesandt. Diese ist einseitig \u2014 nur Sie als Empfaenger werden gebunden. Die Laufzeit ist unbefristet. Bitte unterzeichnen Sie bis Freitag, damit wir den Datenraum oeffnen koennen."
  },
  {
    id: "sc-04",
    title: "Rahmenvertrag — LkSG-Klauseln durchsetzen",
    contractType: "Rahmenvertrag",
    counterparty: "Internationaler Zulieferer (widerstaendig)",
    difficulty: "expert",
    objectives: ["LkSG-Sorgfaltspflichten vertraglich verankern", "Audit-Recht in der Lieferkette sichern", "Code of Conduct als Vertragsbestandteil"],
    icon: "\u{1F30D}",
    opener: "Wir haben Ihre zusaetzlichen Klauseln erhalten. Ehrlich gesagt sehen wir keinen Bedarf fuer diese umfangreichen Pruefrechte. Unsere Produktionsstandards entsprechen lokalen Gesetzen. Ein Audit-Recht in unserer Lieferkette koennen wir nicht gewaehren \u2014 das ist vertraulich. Den Code of Conduct koennen wir zur Kenntnis nehmen, aber nicht als Vertragsbestandteil akzeptieren."
  },
]

const difficultyStyle: Record<string, string> = {
  einfach: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mittel: "bg-blue-50 text-blue-700 border-blue-200",
  schwer: "bg-amber-50 text-amber-700 border-amber-200",
  expert: "bg-red-50 text-red-700 border-red-200"
}

function ts(): string {
  return new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
}

function parseAIResponse(raw: string): { opponent: string; score: number; feedback: string } {
  const coachIdx = raw.indexOf("---COACH---")
  if (coachIdx === -1) {
    return { opponent: raw.trim(), score: 50, feedback: "Bewertung konnte nicht extrahiert werden." }
  }
  let opponent = raw.slice(0, coachIdx).trim()
  if (opponent.startsWith("GEGENPARTEI:")) opponent = opponent.slice(12).trim()
  const coachPart = raw.slice(coachIdx + 11).trim()
  const scoreMatch = /SCORE:\s*(\d+)/i.exec(coachPart)
  const feedbackMatch = /FEEDBACK:\s*([\s\S]+)/i.exec(coachPart)
  return {
    opponent,
    score: scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 50,
    feedback: feedbackMatch ? feedbackMatch[1].trim() : coachPart
  }
}

export default function VerhandlungPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState("")
  const [totalScore, setTotalScore] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const [view, setView] = useState<"library" | "session" | "debrief">("library")
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeScenario = scenarios.find(s => s.id === selected)
  const avgScore = moveCount > 0 ? Math.round(totalScore / moveCount) : 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, streamBuffer])

  const startScenario = useCallback((id: string) => {
    const sc = scenarios.find(s => s.id === id)
    if (!sc) return
    setSelected(id)
    setView("session")
    setMessages([
      { role: "coach", content: "Simulation gestartet: " + sc.title + ". Ihre Gegenpartei: " + sc.counterparty + ". Ich beobachte und bewerte jeden Ihrer Zuege.", timestamp: ts() },
      { role: "opponent", content: sc.opener, timestamp: ts() }
    ])
    setTotalScore(0)
    setMoveCount(0)
    setStreamBuffer("")
  }, [])

  const sendMove = useCallback(async () => {
    if (!input.trim() || streaming || !activeScenario) return
    const move = input.trim()
    setInput("")
    setMessages(m => [...m, { role: "user", content: move, timestamp: ts() }])
    setStreaming(true)
    setStreamBuffer("")

    try {
      const resp = await fetch("/api/verhandlung/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: {
            title: activeScenario.title,
            counterparty: activeScenario.counterparty,
            objectives: activeScenario.objectives,
            contractType: activeScenario.contractType,
            difficulty: activeScenario.difficulty
          },
          history: messages.filter(m => m.role === "user" || m.role === "opponent").map(m => ({ role: m.role, content: m.content })),
          userMove: move
        })
      })

      if (!resp.ok || !resp.body) throw new Error("API-Fehler")

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) { full += data.text; setStreamBuffer(full) }
            if (data.done) {
              const parsed = parseAIResponse(full)
              setMessages(m => [
                ...m,
                { role: "opponent", content: parsed.opponent, timestamp: ts() },
                { role: "coach", content: parsed.feedback, timestamp: ts(), score: parsed.score }
              ])
              setTotalScore(s => s + parsed.score)
              setMoveCount(c => c + 1)
              setStreamBuffer("")
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(m => [...m, { role: "coach", content: "Verbindungsfehler \u2014 bitte erneut versuchen.", timestamp: ts() }])
      setStreamBuffer("")
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, activeScenario, messages])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link href="/workspace" className="text-sm text-stone-500 hover:text-[#003856] transition-colors">&larr; Workspace</Link>
            <h1 className="mt-2 text-2xl font-semibold text-[#003856]">Verhandlungssimulator</h1>
            <p className="mt-1 text-sm text-stone-500">Live-Verhandlung gegen KI-Gegenpartei mit Echtzeit-Coaching. Powered by Claude.</p>
          </div>
          {view === "session" && (
            <button onClick={() => setView("debrief")} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">Session beenden</button>
          )}
        </div>

        {view === "library" && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Szenarien", value: String(scenarios.length), color: "text-[#003856]" },
                { label: "Vertragstypen", value: String(new Set(scenarios.map(s => s.contractType)).size), color: "text-[#003856]" },
                { label: "KI-Engine", value: "Sonnet", color: "text-[#003856]" },
                { label: "Modus", value: "Live", color: "text-emerald-600" }
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl border border-stone-200 bg-white p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{kpi.label}</p>
                  <p className={"mt-1 text-2xl font-semibold " + kpi.color}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-stone-500">Szenario-Bibliothek</h2>
            <p className="mb-4 text-xs text-stone-400">KI-Gegenpartei adaptiert in Echtzeit an Ihre Argumentation.</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {scenarios.map(sc => (
                <div key={sc.id} className="group cursor-pointer rounded-xl border border-stone-200 bg-white p-6 transition-all hover:border-[#C8985A]/50 hover:shadow-md" onClick={() => startScenario(sc.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-2xl">{sc.icon}</span>
                    <span className={"rounded-full border px-2.5 py-0.5 text-xs font-semibold " + difficultyStyle[sc.difficulty]}>{sc.difficulty}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[#003856]">{sc.title}</h3>
                  <p className="mt-1 text-xs text-stone-500">Gegenpartei: {sc.counterparty}</p>
                  <div className="mt-3 space-y-1.5">
                    {sc.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#003856]/10 text-[9px] font-bold text-[#003856]">{i+1}</span>
                        <span className="text-xs text-stone-600">{obj}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg bg-[#003856] py-2.5 text-center text-xs font-medium text-white transition-colors group-hover:bg-[#002a42]">Verhandlung starten</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-[#003856]">So funktioniert die Simulation</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {[
                  { n: "1", t: "Szenario waehlen", d: "Realitaetsnahe Situationen aus echten Vertragsverhandlungen" },
                  { n: "2", t: "Live verhandeln", d: "Claude spielt Ihre Gegenpartei \u2014 reagiert adaptiv auf Ihre Argumente" },
                  { n: "3", t: "Coaching erhalten", d: "Nach jedem Zug Score-Bewertung mit konkreten Verbesserungsvorschlaegen" },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003856] text-xs font-bold text-white">{s.n}</span>
                    <div>
                      <p className="text-sm font-medium text-stone-800">{s.t}</p>
                      <p className="text-xs text-stone-500">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "session" && activeScenario && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            <div className="mb-4 rounded-xl border border-stone-200 bg-[#003856] p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#C8985A]">Aktive Session</p>
                  <h2 className="mt-1 text-base font-semibold">{activeScenario.title}</h2>
                  <p className="mt-0.5 text-xs text-stone-300">Gegenpartei: {activeScenario.counterparty}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-300">Laufender Score</p>
                  <p className="text-3xl font-semibold">{avgScore}<span className="text-sm text-stone-400">/100</span></p>
                  <p className="text-xs text-stone-400">{moveCount} {moveCount === 1 ? "Zug" : "Zuege"}</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4">
              {messages.map((msg, i) => (
                <div key={i} className={"flex gap-3 " + (msg.role === "user" ? "justify-end" : "")}>
                  {msg.role !== "user" && (
                    <span className={"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (msg.role === "opponent" ? "bg-stone-800 text-white" : "bg-[#C8985A] text-white")}>
                      {msg.role === "opponent" ? "GP" : "CO"}
                    </span>
                  )}
                  <div className={"max-w-[78%] rounded-2xl px-4 py-3 " + (msg.role === "user" ? "bg-[#003856] text-white" : msg.role === "opponent" ? "bg-stone-100 text-stone-900" : "border border-[#C8985A]/30 bg-[#C8985A]/5 text-stone-800")}>
                    {msg.role === "coach" && (
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C8985A]">Coach-Feedback</p>
                        {msg.score !== undefined && (
                          <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (msg.score >= 70 ? "bg-emerald-100 text-emerald-800" : msg.score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800")}>{msg.score}</span>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={"mt-1 text-[10px] " + (msg.role === "user" ? "text-white/50" : "text-stone-400")}>{msg.timestamp}</p>
                  </div>
                  {msg.role === "user" && (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[10px] font-bold text-white">SIE</span>
                  )}
                </div>
              ))}
              {streaming && (
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-white">GP</span>
                  <div className="max-w-[78%] rounded-2xl bg-stone-100 px-4 py-3">
                    {streamBuffer ? (
                      <p className="text-sm leading-relaxed text-stone-900 whitespace-pre-wrap">
                        {streamBuffer.includes("---COACH---") ? streamBuffer.split("---COACH---")[0].replace(/^GEGENPARTEI:\s*/i, "").trim() : streamBuffer.replace(/^GEGENPARTEI:\s*/i, "").trim()}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !streaming) { e.preventDefault(); sendMove() } }} placeholder="Ihr Verhandlungszug... (Tipp: BGB-Referenzen, Marktdaten und konkrete Alternativen erhoehen Ihren Score)" className="w-full resize-none bg-transparent px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none" rows={2} disabled={streaming} />
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1.5">
                  {["\u00A7 BGB-Argument", "Marktvergleich", "Kompromissvorschlag"].map(tag => (
                    <button key={tag} onClick={() => setInput(i => i + (i ? " " : "") + tag + ": ")} disabled={streaming} className="rounded-full border border-stone-200 px-2.5 py-1 text-[10px] font-medium text-stone-500 transition-colors hover:bg-stone-50 disabled:opacity-40">{tag}</button>
                  ))}
                </div>
                <button onClick={sendMove} disabled={streaming || !input.trim()} className="rounded-lg bg-[#003856] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#002a42] disabled:opacity-40">{streaming ? "KI denkt..." : "Zug senden"}</button>
              </div>
            </div>
          </div>
        )}

        {view === "debrief" && activeScenario && (
          <div className="mt-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#003856]/10"><span className="text-3xl">{"\u{1F393}"}</span></div>
              <h2 className="mt-4 text-xl font-semibold text-[#003856]">Session abgeschlossen</h2>
              <p className="mt-1 text-sm text-stone-500">{activeScenario.title}</p>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-[#C8985A]">Finaler Score</p>
                <p className="mt-1 text-6xl font-semibold text-[#003856]">{avgScore}</p>
                <p className="mt-1 text-sm text-stone-500">{avgScore >= 75 ? "Exzellente Verhandlungsfuehrung" : avgScore >= 60 ? "Starke Argumentation" : avgScore >= 45 ? "Solide Grundlagen" : "Weiter ueben"}</p>
              </div>
              <div className="mt-4 text-xs text-stone-400">{moveCount} Zuege in dieser Session</div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setView("library"); setSelected(null) }} className="flex-1 rounded-lg border border-stone-200 bg-white py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50">Neues Szenario</button>
              <button onClick={() => startScenario(activeScenario.id)} className="flex-1 rounded-lg bg-[#003856] py-3 text-sm font-medium text-white transition-colors hover:bg-[#002a42]">Nochmal versuchen</button>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-3 text-center">
          <p className="text-xs text-stone-400">Trainings-Tool \u2014 keine Rechtsberatung \u00B7 KI-Gegenpartei: Claude Sonnet \u00B7 <Link href="/ki-transparenz" className="font-medium text-[#003856] hover:underline">KI-Transparenz</Link></p>
        </div>
      </div>
    </div>
  )
}
