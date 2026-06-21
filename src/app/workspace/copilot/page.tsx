"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { AiTransparencyBadge } from "@/components/compliance/ai-transparency-badge"

type Message = {
  role: "user" | "assistant"
  content: string
  model?: string
  tokens?: number
}

type CopilotContract = {
  runId: string
  documentId: string
  title: string
  documentType: string
  organizationName: string
  contractType: string
  riskScore: number | null
  confidence: number | null
  completedAt: string | null
  extraction: {
    contractType: string
    parties: unknown
    term: unknown
    legalTopics: unknown
    structuredData: unknown
    deadlines: unknown
  } | null
  findings: Array<{
    category: string
    title: string
    description: string
    severity: string
    confidence: number | null
    clauseRef: string | null
    sourceSpan: string | null
    suggestedRevision: string | null
  }>
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function renderMarkdown(text: string): string {
  return text
    // Code blocks (```...```) — content is HTML-escaped to prevent XSS from AI output
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => `<pre class="my-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-[12px] leading-relaxed text-gray-300"><code>${escHtml(code)}</code></pre>`)
    // Inline code (`...`)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1.5 py-0.5 text-[12px] font-mono text-gray-800">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="mt-4 mb-2 text-[14px] font-semibold text-gray-900">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-5 mb-2 text-[15px] font-semibold text-gray-900">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-5 mb-2 text-[16px] font-bold text-gray-900">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-semibold text-gray-900"><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-[13px] leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-[13px] leading-relaxed">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-2 space-y-1">$1</ul>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-4 border-gray-200" />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mt-2">')
    // Single newlines inside paragraphs
    .replace(/\n/g, '<br/>')
}

function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(content), [content])
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
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
  const [availableContracts, setAvailableContracts] = useState<CopilotContract[]>([])
  const [showContractPicker, setShowContractPicker] = useState(false)
  const [contractsLoading, setContractsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Fetch available contracts on mount
  useEffect(() => {
    setContractsLoading(true)
    fetch("/api/copilot/contracts")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.contracts) setAvailableContracts(data.contracts) })
      .catch(() => {})
      .finally(() => setContractsLoading(false))
  }, [])

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowContractPicker(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectContract = useCallback((contract: CopilotContract) => {
    const parts: string[] = []
    parts.push(`VERTRAG: ${contract.title} (${contract.contractType})`)
    parts.push(`ORGANISATION: ${contract.organizationName}`)
    if (contract.riskScore != null) parts.push(`RISIKO-SCORE: ${(contract.riskScore * 100).toFixed(0)}%`)
    if (contract.extraction) {
      if (contract.extraction.parties) parts.push(`VERTRAGSPARTEIEN:\n${JSON.stringify(contract.extraction.parties, null, 2)}`)
      if (contract.extraction.structuredData) parts.push(`VERTRAGSDATEN:\n${JSON.stringify(contract.extraction.structuredData, null, 2)}`)
      if (contract.extraction.deadlines) parts.push(`FRISTEN:\n${JSON.stringify(contract.extraction.deadlines, null, 2)}`)
      if (contract.extraction.legalTopics) parts.push(`RECHTSTHEMEN:\n${JSON.stringify(contract.extraction.legalTopics, null, 2)}`)
    }
    if (contract.findings.length > 0) {
      const findingsText = contract.findings.map(f =>
        `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}${f.sourceSpan ? ` (Zitat: "${f.sourceSpan}")` : ""}${f.suggestedRevision ? `\n  Formulierungsvorschlag: ${f.suggestedRevision}` : ""}`
      ).join("\n")
      parts.push(`IDENTIFIZIERTE RISIKEN (${contract.findings.length}):\n${findingsText}`)
    }
    setContractContext(parts.join("\n\n"))
    setContractName(contract.title)
    setShowContractPicker(false)
  }, [])

  const clearContract = useCallback(() => {
    setContractContext(null)
    setContractName(null)
    if (typeof window !== "undefined") sessionStorage.removeItem("kanzlei-copilot-context")
  }, [])

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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003856] text-[18px] text-white">&#x1F916;</div>
          <div>
            <h1 className="text-[17px] font-semibold text-gray-950">Contract Copilot</h1>
            <p className="text-[12px] text-gray-500">Powered by Claude Sonnet 4 &middot; Vertragsexperte f&uuml;r DACH-Recht</p>
            <div className="mt-1.5"><AiTransparencyBadge compact /></div>
          </div>
          <div className="ml-auto relative" ref={pickerRef}>
            {contractName ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[12px] font-medium text-emerald-700 max-w-[200px] truncate">&#128196; {contractName}</span>
                </div>
                <button onClick={clearContract} className="rounded-full border border-stone-200 p-1 text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors" title="Vertrag entfernen">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <button onClick={() => setShowContractPicker(!showContractPicker)} className="rounded-full border border-stone-200 p-1 text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors" title="Anderen Vertrag wählen">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowContractPicker(!showContractPicker)} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:border-stone-300">
                <span>&#128196;</span>
                <span>{contractsLoading ? "Lade..." : "Vertrag wählen"}</span>
                <svg className="h-3 w-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
            )}

            {showContractPicker && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[380px] rounded-xl border border-stone-200 bg-white shadow-lg">
                <div className="border-b border-stone-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Analysierte Verträge</p>
                  <p className="text-[10px] text-stone-400">Waehlen Sie einen Vertrag, um gezielte Fragen zu stellen</p>
                </div>
                <div className="max-h-[320px] overflow-y-auto p-2">
                  {availableContracts.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-stone-500">{contractsLoading ? "Lade Verträge..." : "Keine analysierten Verträge vorhanden"}</p>
                      {!contractsLoading && <p className="mt-1 text-xs text-stone-400">Laden Sie einen Vertrag hoch und starten Sie eine Analyse.</p>}
                    </div>
                  ) : (
                    availableContracts.map(c => (
                      <button key={c.runId} onClick={() => selectContract(c)} className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-stone-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#003856] truncate">{c.title}</p>
                          <p className="text-[11px] text-stone-500 truncate">{c.contractType} &middot; {c.organizationName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {c.riskScore != null && (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.riskScore >= 0.7 ? "bg-red-100 text-red-700" : c.riskScore >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {(c.riskScore * 100).toFixed(0)}%
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400">{c.findings.length} Findings</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-white">{msg.content}</div>
                  ) : (
                    <MarkdownContent content={msg.content} className="text-[14px] leading-relaxed text-gray-700" />
                  )}
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
                  <div className="text-[14px] leading-relaxed text-gray-700"><MarkdownContent content={streamingText} className="inline" /><span className="animate-pulse">▊</span></div>
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
