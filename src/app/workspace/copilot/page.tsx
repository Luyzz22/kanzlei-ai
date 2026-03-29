"use client"

import { useState, useRef, useEffect } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
  model?: string
  tokens?: number
}

const quickActions = [
  { label: "🔴 Kritische Risiken", prompt: "Welche kritischen Risiken gibt es typischerweise in SaaS-Verträgen nach deutschem Recht? Nenne die Top 5 mit Erklärung." },
  { label: "📅 Kündigungsfristen", prompt: "Erkläre mir die gesetzlichen Regelungen zu Kündigungsfristen bei Dauerschuldverhältnissen nach deutschem Recht (BGB). Wann sind kurze Fristen unwirksam?" },
  { label: "⚠️ DSGVO-Klauseln", prompt: "Welche DSGVO-relevanten Klauseln müssen in einem Auftragsverarbeitungsvertrag (AVV) enthalten sein? Liste alle Pflichtinhalte nach Art. 28 DSGVO auf." },
  { label: "✅ Haftungsprüfung", prompt: "Erkläre die Grenzen zulässiger Haftungsbeschränkungen in B2B-Verträgen nach deutschem Recht. Wann sind Haftungsausschlüsse unwirksam?" },
]

const suggestions = [
  "Was ist bei einer automatischen Vertragsverlängerung zu beachten?",
  "Erkläre mir die Unterschiede zwischen AGB-Kontrolle und Individualvereinbarung",
  "Welche Risiken birgt eine Datenspeicherung in den USA nach Schrems II?",
  "Was muss ein SLA mindestens enthalten?",
]

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [contractContext, setContractContext] = useState<string | null>(null)
  const [contractName, setContractName] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load contract context from sessionStorage (set by Schnellanalyse)
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = sessionStorage.getItem("kanzlei-copilot-context")
    if (!stored) return
    try {
      const ctx = JSON.parse(stored)
      const parts: string[] = []
      if (ctx.contractText) parts.push(`VERTRAGSTEXT:\n${ctx.contractText}`)
      if (ctx.analysis?.summary) parts.push(`ZUSAMMENFASSUNG:\n${ctx.analysis.summary}`)
      if (ctx.analysis?.riskScore) parts.push(`RISIKO-SCORE: ${ctx.analysis.riskScore}/100`)
      if (ctx.analysis?.extractedData) parts.push(`EXTRAHIERTE DATEN:\n${JSON.stringify(ctx.analysis.extractedData, null, 2)}`)
      if (ctx.analysis?.findings?.length) {
        const findingsText = ctx.analysis.findings.map((f: {title: string; severity: string; explanation: string; quote?: string}) =>
          `- [${f.severity.toUpperCase()}] ${f.title}: ${f.explanation}${f.quote ? ` (Zitat: "${f.quote}")` : ""}`
        ).join("\n")
        parts.push(`IDENTIFIZIERTE RISIKEN:\n${findingsText}`)
      }
      if (ctx.analysis?.recommendedActions?.length) {
        parts.push(`HANDLUNGSEMPFEHLUNGEN:\n${ctx.analysis.recommendedActions.map((a: string, i: number) => `${i+1}. ${a}`).join("\n")}`)
      }
      if (parts.length > 0) {
        setContractContext(parts.join("\n\n"))
        // Extract contract name from extractedData
        const name = ctx.analysis?.extractedData?.Produkt || ctx.analysis?.extractedData?.Anbieter || "Geladener Vertrag"
        setContractName(String(name))
      }
    } catch {}
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    
    const userMessage: Message = { role: "user", content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)
    setStreamingText("")

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          contractContext: contractContext || undefined
        })
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages([...updatedMessages, { role: "assistant", content: `Fehler: ${err.error || "Unbekannter Fehler"}` }])
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""
      let model = ""
      let tokens = 0

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                fullText += data.text
                setStreamingText(fullText)
                if (data.model) model = data.model
              }
              if (data.done) {
                model = data.model || model
                tokens = data.tokens || 0
              }
              if (data.error) {
                fullText += `\n\n⚠️ ${data.error}`
                setStreamingText(fullText)
              }
            } catch {}
          }
        }
      }

      setMessages([...updatedMessages, { role: "assistant", content: fullText, model, tokens }])
      setStreamingText("")
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "Netzwerkfehler. Bitte erneut versuchen." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-65px)] max-w-5xl flex-col px-5 sm:px-8">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-100 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003856] text-[18px] text-white">🤖</div>
          <div>
            <h1 className="text-[17px] font-semibold text-gray-950">Contract Copilot</h1>
            <p className="text-[12px] text-gray-500">Powered by Claude Sonnet 4 · Vertragsexperte für DACH-Recht</p>
          </div>
          {contractName && (
            <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-medium text-emerald-700">📄 {contractName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6">
        {messages.length === 0 && !loading ? (
          <div className="space-y-8">
            {/* Welcome */}
            <div className="text-center">
              <span className="text-[40px]">⚖️</span>
              <h2 className="mt-3 text-[20px] font-semibold text-gray-900">Willkommen beim Contract Copilot</h2>
              <p className="mt-2 text-[14px] text-gray-500">
                Stellen Sie Fragen zu Verträgen, Klauseln, Risiken und rechtlichen Zusammenhängen.
                <br />Der Copilot nutzt Claude Sonnet 4 für präzise juristische Analysen.
              </p>
            </div>

            {/* Quick Actions */}
            <div>
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚡ Schnellaktionen</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gold-300 hover:bg-gold-50/30 hover:shadow-card"
                  >
                    <p className="text-[14px] font-medium text-gray-900">{action.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">💬 Beispielfragen</p>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="w-full rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-2.5 text-left text-[13px] text-gray-600 transition-colors hover:border-gray-200 hover:bg-white hover:text-gray-900"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#003856] text-[14px] text-white">🤖</div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[#003856] text-white"
                    : "border border-gray-100 bg-white"
                }`}>
                  <div className={`whitespace-pre-wrap text-[14px] leading-relaxed ${msg.role === "user" ? "text-white" : "text-gray-700"}`}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.model && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      {msg.model}{msg.tokens ? ` · ${msg.tokens.toLocaleString()} Tokens` : ""}
                    </p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-[12px] font-bold text-gold-700">LS</div>
                )}
              </div>
            ))}

            {/* Streaming */}
            {loading && streamingText && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#003856] text-[14px] text-white">🤖</div>
                <div className="max-w-[80%] rounded-2xl border border-gray-100 bg-white px-4 py-3">
                  <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700">{streamingText}<span className="animate-pulse">▊</span></div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && !streamingText && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#003856] text-[14px] text-white">🤖</div>
                <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-[13px] text-gray-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#003856]" />
                    Copilot denkt nach...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-gray-100 py-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stellen Sie eine Frage zu Verträgen, Klauseln oder Risiken..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#003856] text-white transition-all hover:bg-[#002a42] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          KanzleiAI Copilot gibt keine Rechtsberatung. Bei konkreten Rechtsfragen wenden Sie sich an einen Rechtsanwalt.
        </p>
      </div>
    </div>
  )
}
