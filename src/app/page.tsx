'use client'

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

/* ============================================================
   Kleine, dependency-freie Animations-Helfer
   ============================================================ */

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReduced()) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(22px)",
        transition: `opacity .7s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .7s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function CountUp({
  end,
  prefix = "",
  suffix = "",
  className = "",
}: {
  end: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReduced()) {
      setVal(end)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          io.disconnect()
          const dur = 1100
          const t0 = performance.now()
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur)
            setVal(Math.round(end * (1 - Math.pow(1 - p, 3))))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [end])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  )
}

/* ============================================================
   Hero-Preview — animiertes Workspace-Mockup (Desktop)
   ============================================================ */

function HeroPreview() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (prefersReduced()) {
      setMounted(true)
      return
    }
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const docs = [
    { name: "Arbeitsvertrag_Mueller.pdf", risks: 8, score: 72, label: "Mittleres Risiko", tone: "amber" },
    { name: "SaaS_Vertrag_CloudCorp.pdf", risks: 3, score: 34, label: "Geringes Risiko", tone: "emerald" },
    { name: "NDA_Partner_GmbH.pdf", risks: 12, score: 89, label: "Hohes Risiko", tone: "red" },
  ] as const

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-red-300" />
        <div className="h-3 w-3 rounded-full bg-amber-300" />
        <div className="h-3 w-3 rounded-full bg-emerald-300" />
        <span className="ml-2 text-[11px] text-gray-400">kanzlei-ai.com/workspace</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Analyse aktiv
        </span>
      </div>

      <div className="space-y-2.5">
        {docs.map((d, i) => (
          <div
            key={d.name}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(10px)",
              transition: `opacity .5s ease ${i * 140 + 150}ms, transform .5s ease ${i * 140 + 150}ms`,
            }}
          >
            <span className="text-[20px]">📄</span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-gray-900">{d.name}</p>
              <p className="text-[11px] text-gray-400">
                <CountUp end={d.risks} /> Risiken erkannt · Score: <CountUp end={d.score} />/100
              </p>
            </div>
            <span
              className={
                d.tone === "amber"
                  ? "rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700"
                  : d.tone === "emerald"
                  ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
                  : "rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium text-red-700"
              }
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-gold-50 p-2.5 text-center">
          <p className="text-[16px] font-semibold text-gray-900">
            <CountUp end={847} />
          </p>
          <p className="text-[10px] text-gold-700">Verträge</p>
        </div>
        <div className="rounded-lg bg-gold-50 p-2.5 text-center">
          <p className="text-[16px] font-semibold text-gray-900">
            <CountUp end={94} suffix="%" />
          </p>
          <p className="text-[10px] text-gold-700">Genauigkeit</p>
        </div>
        <div className="rounded-lg bg-gold-50 p-2.5 text-center">
          <p className="text-[16px] font-semibold text-gray-900">
            <CountUp end={30} prefix="<" suffix="s" />
          </p>
          <p className="text-[10px] text-gold-700">Analysezeit</p>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Signature: interaktive Klausel-Demo
   ============================================================ */

type ClauseTone = "high" | "mid" | "low"
type Clause = {
  id: string
  tone: ClauseTone
  text: string
  label: string
  title: string
  quote: string
  norm: string
  rec: string
}

const CLAUSES: Clause[] = [
  {
    id: "avail",
    tone: "mid",
    text: "Es wird eine Verfügbarkeit von 99,0 % im Jahresmittel angestrebt; Service-Gutschriften bei Unterschreitung sind ausgeschlossen.",
    label: "Mittleres Risiko",
    title: "SLA ohne Service-Gutschrift",
    quote: "„…Verfügbarkeit von 99,0 % … Service-Gutschriften … ausgeschlossen.“",
    norm: "AGB-rechtliche Angemessenheit (§ 307 BGB)",
    rec: "Mindestverfügbarkeit auf marktübliche 99,9 % anheben und Service-Gutschriften als Rechtsfolge aufnehmen.",
  },
  {
    id: "dp",
    tone: "high",
    text: "Die Datenverarbeitung erfolgt in Rechenzentren innerhalb und außerhalb der EU nach Wahl des Auftragnehmers.",
    label: "Hohes Risiko",
    title: "Datenverarbeitung außerhalb der EU",
    quote: "„…Rechenzentren innerhalb und außerhalb der EU nach Wahl des Auftragnehmers.“",
    norm: "Art. 44 ff. DSGVO (Drittlandtransfer)",
    rec: "Verarbeitung vertraglich auf EU-/EWR-Standorte beschränken oder geeignete Garantien (SCC) verbindlich vereinbaren.",
  },
  {
    id: "agb",
    tone: "mid",
    text: "Der Auftragnehmer ist berechtigt, die AGB einseitig zu ändern; die geänderten Bedingungen gelten als angenommen, sofern nicht innerhalb von 14 Tagen widersprochen wird.",
    label: "Mittleres Risiko",
    title: "Einseitiges AGB-Änderungsrecht",
    quote: "„…AGB einseitig zu ändern … als angenommen … innerhalb von 14 Tagen widersprochen.“",
    norm: "§ 308 Nr. 5 BGB (Zustimmungsfiktion)",
    rec: "Zustimmungsfiktion entfernen oder auf nicht wesentliche Änderungen mit angemessener Frist und Hinweispflicht begrenzen.",
  },
  {
    id: "liab",
    tone: "low",
    text: "Die Gesamthaftung ist auf 10 % der Jahresvergütung begrenzt.",
    label: "Geringes Risiko",
    title: "Haftungsbegrenzung auf 10 %",
    quote: "„Die Gesamthaftung ist auf 10 % der Jahresvergütung begrenzt.“",
    norm: "§ 309 Nr. 7 BGB",
    rec: "Marktüblich. Sicherstellen, dass Vorsatz und grobe Fahrlässigkeit von der Begrenzung ausgenommen bleiben.",
  },
]

function underlineClass(tone: ClauseTone) {
  if (tone === "high") return "decoration-red-400"
  if (tone === "mid") return "decoration-amber-400"
  return "decoration-emerald-400"
}
function badgeClass(tone: ClauseTone) {
  if (tone === "high") return "bg-red-100 text-red-700"
  if (tone === "mid") return "bg-amber-100 text-amber-700"
  return "bg-emerald-100 text-emerald-700"
}

function ClauseDemo() {
  const [activeId, setActiveId] = useState<string>("dp")
  const active = CLAUSES.find((c) => c.id === activeId) ?? CLAUSES[1]

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-card sm:p-9">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
          Auszug · SaaS-Vertrag (Cloud-Dienstleister)
        </p>
        <p className="text-[16.5px] leading-[1.95] text-gray-700">
          Die Bereitstellung erfolgt als Software-as-a-Service.{" "}
          {CLAUSES.map((c) => (
            <span key={c.id}>
              <button
                onClick={() => setActiveId(c.id)}
                onMouseEnter={() => setActiveId(c.id)}
                className={`cursor-pointer rounded px-1 underline decoration-2 underline-offset-4 transition-colors hover:bg-gray-100 ${underlineClass(
                  c.tone
                )} ${activeId === c.id ? "bg-gray-100" : ""}`}
              >
                {c.text}
              </button>{" "}
            </span>
          ))}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card lg:sticky lg:top-24">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ${badgeClass(active.tone)}`}>
          ● {active.label}
        </span>
        <h3 className="mt-4 text-[19px] font-semibold leading-snug text-gray-950">{active.title}</h3>
        <p className="mt-3 border-l-2 border-gold-300 pl-3 text-[14px] italic text-gray-500">{active.quote}</p>
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#003856]">Einschlägige Norm</p>
          <p className="mt-1 text-[14px] text-gray-700">{active.norm}</p>
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#003856]">Empfehlung</p>
          <p className="mt-1 text-[14px] text-gray-700">{active.rec}</p>
        </div>
        <p className="mt-5 text-[12px] text-gray-400">Klicken Sie auf eine markierte Klausel im Vertrag.</p>
      </div>
    </div>
  )
}

/* ============================================================
   Interaktive Pipeline (ersetzt „So funktioniert's")
   ============================================================ */

const PIPELINE = [
  {
    n: "01",
    title: "Klassifikation",
    blurb: "Vertragstyp, Sprache und fachlicher Kontext werden erkannt.",
  },
  {
    n: "02",
    title: "Extraktion",
    blurb: "Relevante Klauseln werden strukturiert herausgelöst.",
  },
  {
    n: "03",
    title: "Risikoanalyse",
    blurb: "Risiken werden bewertet, mit Normen verknüpft und priorisiert.",
  },
] as const

function AnalysisPipeline() {
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto || prefersReduced()) return
    const t = setInterval(() => setActive((a) => (a + 1) % 3), 3600)
    return () => clearInterval(t)
  }, [auto])

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-2.5">
        {PIPELINE.map((s, i) => (
          <button
            key={s.n}
            onClick={() => {
              setActive(i)
              setAuto(false)
            }}
            className={`flex w-full gap-4 rounded-2xl border p-5 text-left transition-all ${
              active === i
                ? "border-gray-200 bg-white shadow-soft"
                : "border-transparent hover:bg-white"
            }`}
          >
            <span className={`text-[18px] font-bold ${active === i ? "text-[#003856]" : "text-gold-600"}`}>{s.n}</span>
            <span>
              <span className="block text-[16px] font-semibold text-gray-900">{s.title}</span>
              <span className="mt-0.5 block text-[14px] text-gray-500">{s.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="min-h-[320px] rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-7">
        {active === 0 && (
          <div className="animate-fade-in">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Schritt 01 · Klassifikation</p>
            {[
              ["Vertragstyp", "SaaS-/Cloud-Vertrag"],
              ["Sprache", "Deutsch (DE)"],
              ["Gerichtsbarkeit", "DACH"],
              ["Konfidenz", "96 %"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-gray-100 py-3.5 text-[15px] last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        )}
        {active === 1 && (
          <div className="animate-fade-in">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Schritt 02 · Extraktion</p>
            {["§ Haftung", "§ Laufzeit & Kündigung", "§ Datenverarbeitung", "§ Gerichtsstand", "§ Vergütung"].map((k) => (
              <div key={k} className="flex items-center justify-between border-b border-gray-100 py-3.5 text-[15px] last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-emerald-600">erkannt</span>
              </div>
            ))}
          </div>
        )}
        {active === 2 && (
          <div className="animate-fade-in space-y-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Schritt 03 · Risikoanalyse</p>
            {[
              { tone: "bg-red-500", t: "Datenverarbeitung außerhalb der EU", s: "Keine Beschränkung auf EU-Standorte.", n: "Art. 44 ff. DSGVO" },
              { tone: "bg-amber-500", t: "Einseitiges AGB-Änderungsrecht", s: "Zustimmungsfiktion nach 14 Tagen.", n: "§ 308 Nr. 5 BGB" },
              { tone: "bg-emerald-500", t: "Haftungsbegrenzung 10 %", s: "Marktüblich, aber prüfenswert.", n: "§ 309 Nr. 7 BGB" },
            ].map((f) => (
              <div key={f.t} className="flex gap-3.5 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <span className={`w-1.5 flex-none rounded-full ${f.tone}`} />
                <div>
                  <p className="text-[14.5px] font-medium text-gray-900">{f.t}</p>
                  <p className="text-[13px] text-gray-500">{f.s}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#003856]">{f.n}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Statische Inhalte (aus bestehender Seite übernommen)
   ============================================================ */

const capabilities = [
  {
    emoji: "📋",
    title: "Vertragsprüfung DE/EN",
    description:
      "KI-gestützte Analyse deutscher und englischsprachiger Verträge: Arbeits-, SaaS-, NDA-, Lieferanten- und 12 weitere Vertragstypen — mit Recherche zu BGB, HGB sowie Common Law.",
  },
  {
    emoji: "⚠️",
    title: "Risikoerkennung",
    description:
      "Automatische Identifikation kritischer Klauseln mit Risikobewertung, Handlungsempfehlungen und Gesetzesreferenzen.",
  },
  {
    emoji: "✅",
    title: "Review & Freigabe",
    description:
      "Strukturierte Prüfprozesse mit Rollenkonzept, Human-in-the-Loop und nachvollziehbarer Entscheidungshistorie.",
  },
  {
    emoji: "🔒",
    title: "Audit & Nachweise",
    description:
      "Manipulationssichere Protokollierung aller Entscheidungen für ISO 27001, DSGVO und interne Governance.",
  },
]

const trustSignals = [
  { emoji: "🇪🇺", label: "DSGVO-konform", sublabel: "EU-Betrieb" },
  { emoji: "🔐", label: "Mandantentrennung", sublabel: "Row-Level Security" },
  { emoji: "🤖", label: "Multi-Provider KI", sublabel: "OpenAI · Claude · Gemini" },
  { emoji: "📜", label: "Audit Trail", sublabel: "Manipulationssicher" },
]

const contractTypes = [
  { emoji: "👔", label: "Arbeitsvertrag", jurisdiction: "DE" },
  { emoji: "☁️", label: "SaaS-Vertrag", jurisdiction: "DE" },
  { emoji: "🤝", label: "NDA", jurisdiction: "DE" },
  { emoji: "🏭", label: "Lieferantenvertrag", jurisdiction: "DE" },
  { emoji: "🔧", label: "Dienstleistungsvertrag", jurisdiction: "DE" },
  { emoji: "🏢", label: "Mietvertrag", jurisdiction: "DE" },
  { emoji: "🛒", label: "Kaufvertrag", jurisdiction: "DE" },
  { emoji: "⚖️", label: "AGB", jurisdiction: "DE" },
  { emoji: "👔", label: "Employment Agreement", jurisdiction: "EN" },
  { emoji: "☁️", label: "SaaS Agreement / MSA", jurisdiction: "EN" },
  { emoji: "🤝", label: "NDA / Confidentiality", jurisdiction: "EN" },
  { emoji: "🏭", label: "Supply Agreement", jurisdiction: "EN" },
  { emoji: "🔧", label: "Service Agreement", jurisdiction: "EN" },
  { emoji: "💼", label: "License Agreement", jurisdiction: "EN" },
  { emoji: "📜", label: "Terms & Conditions", jurisdiction: "EN" },
  { emoji: "🤲", label: "Data Processing Agreement", jurisdiction: "EN" },
]

const processSteps = [
  { step: "01", emoji: "📤", title: "Upload", description: "Vertrag als PDF hochladen. Die KI erkennt den Vertragstyp automatisch." },
  { step: "02", emoji: "🔍", title: "Analyse", description: "Multi-Provider KI extrahiert Daten, identifiziert Risiken und prüft gegen deutsches Recht." },
  { step: "03", emoji: "👨‍⚖️", title: "Review", description: "Juristische Prüfung der KI-Hinweise mit klaren Freigabeschritten und Rollenkonzept." },
  { step: "04", emoji: "📊", title: "Nachweis", description: "Export als PDF-Report, DATEV-Anbindung und manipulationssicheres Audit-Protokoll." },
]

/* ============================================================
   Seite
   ============================================================ */

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#FAFAF7] pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-36 lg:pt-32">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-gold-200/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#003856]/[0.04] to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5 shadow-soft">
                <span className="text-[16px]">⚖️</span>
                <span className="text-[12px] font-medium text-gold-700">KI-Vertragsanalyse für juristische Teams</span>
              </div>

              <h1 className="max-w-xl text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-gray-950 sm:text-[3.25rem]">
                Verträge prüfen. <span className="text-[#003856]">Risiken erkennen.</span> Sicher entscheiden.
              </h1>

              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-gray-500">
                KanzleiAI unterstützt Kanzleien und Rechtsabteilungen bei der strukturierten Prüfung von Verträgen in{" "}
                <span className="font-medium text-gray-700">Deutsch und Englisch</span> — mit nachvollziehbarer KI und
                auditfähigen Nachweisen.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/enterprise-kontakt"
                  className="inline-flex items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/12 transition-all hover:bg-[#002a42] active:scale-[0.98]"
                >
                  Demo anfragen →
                </Link>
                <Link
                  href="/produkt"
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                >
                  Produkt ansehen
                </Link>
              </div>

              <p className="mt-8 text-[12px] text-gray-400">
                🇩🇪 Ein Produkt der SBS Deutschland GmbH &amp; Co. KG · Made in Germany
              </p>
            </div>

            {/* Right: animiertes Mockup */}
            <div className="hidden lg:block">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-gray-200 bg-gold-50/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4 lg:px-10">
          {trustSignals.map((signal) => (
            <div key={signal.label} className="bg-white px-6 py-6 text-center sm:py-7">
              <p className="text-[18px]">{signal.emoji}</p>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{signal.label}</p>
              <p className="text-[12px] text-gray-500">{signal.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Metrics (mit count-up) */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <p className="text-[2.5rem] font-semibold tracking-tight text-[#003856]">
                <CountUp end={3} prefix="<" suffix="s" />
              </p>
              <p className="mt-1 text-[14px] font-medium text-gray-900">Analyse-Antwortzeit</p>
              <p className="text-[12px] text-gray-400">Multi-Provider KI-Pipeline</p>
            </div>
            <div className="text-center">
              <p className="text-[2.5rem] font-semibold tracking-tight text-[#003856]">
                <CountUp end={12} />
              </p>
              <p className="mt-1 text-[14px] font-medium text-gray-900">Kernmodule</p>
              <p className="text-[12px] text-gray-400">Inkl. Vertragsradar + Simulator</p>
            </div>
            <div className="text-center">
              <p className="text-[2.5rem] font-semibold tracking-tight text-[#003856]">
                <CountUp end={78} />
              </p>
              <p className="mt-1 text-[14px] font-medium text-gray-900">Enterprise-Seiten</p>
              <p className="text-[12px] text-gray-400">Analyse bis Compliance-Monitor</p>
            </div>
            <div className="text-center">
              <p className="text-[2.5rem] font-semibold tracking-tight text-[#003856]">
                <CountUp end={34} />
              </p>
              <p className="mt-1 text-[14px] font-medium text-gray-900">API-Endpunkte</p>
              <p className="text-[12px] text-gray-400">REST + Webhooks + SCIM</p>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE: Klausel-Demo */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔍 Sehen, was die KI sieht</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Jede Markierung ist nachvollziehbar.</h2>
            <p className="mt-4 text-[16px] text-gray-500">
              Klicken Sie auf eine markierte Klausel — KanzleiAI zeigt Risiko, einschlägige Norm und eine konkrete
              Empfehlung. Kein Score ohne Begründung.
            </p>
          </Reveal>
          <Reveal>
            <ClauseDemo />
          </Reveal>
        </div>
      </section>

      {/* Pipeline (ersetzt How it works) */}
      <section className="border-y border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚡ Wie es funktioniert</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Von der Datei zum belastbaren Befund — in drei Schritten.</h2>
            <p className="mt-4 text-[16px] text-gray-500">
              Jeder Schritt ist nachvollziehbar dokumentiert. Keine Blackbox, sondern eine prüfbare Kette von der
              Klassifikation bis zur Empfehlung.
            </p>
          </Reveal>
          <Reveal>
            <AnalysisPipeline />
          </Reveal>
          <div className="mt-10 text-center">
            <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">
              Jetzt ausprobieren →
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✨ Leistungsumfang</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Strukturierte Dokumentenprüfung, von Intake bis Nachweis</h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-gold-200 hover:shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-[24px] transition-transform group-hover:-rotate-6">
                  {cap.emoji}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-gray-900">{cap.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Types */}
      <section className="border-y border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚖️ 16 Vertragstypen · DE + EN</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Deutsches Recht und internationales Vertragswesen</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
              KanzleiAI analysiert Verträge in Deutsch (BGB, HGB, AGB-Recht) und Englisch (Common Law). Für DACH-Teams mit
              internationalen Mandanten, Konzernen und Cross-Border-Deals.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-gray-200 bg-white p-7">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🇩🇪</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">Deutsches Recht</p>
                  <h3 className="mt-0.5 text-[16px] font-semibold text-gray-950">BGB · HGB · AGB-Recht</h3>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
                Acht spezialisierte Vertragstypen mit Klauselkatalog, Kündigungsfristen-Ampel und Risikobewertung gemäß
                deutscher Rechtsprechung.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {contractTypes
                  .filter((t) => t.jurisdiction === "DE")
                  .map((type) => (
                    <span
                      key={`de-${type.label}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-gray-700"
                    >
                      <span className="text-[13px]">{type.emoji}</span>
                      {type.label}
                    </span>
                  ))}
              </div>
            </Reveal>

            <Reveal delay={80} className="rounded-2xl border border-gray-200 bg-white p-7">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🌐</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">English-Language Contracts</p>
                  <h3 className="mt-0.5 text-[16px] font-semibold text-gray-950">Common Law · International</h3>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
                Acht englischsprachige Vertragstypen für internationale Mandanten, Konzernbeziehungen und Cross-Border-Deals
                — inklusive DPA (Art. 28 DSGVO) und MSAs.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {contractTypes
                  .filter((t) => t.jurisdiction === "EN")
                  .map((type) => (
                    <span
                      key={`en-${type.label}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-gray-700"
                    >
                      <span className="text-[13px]">{type.emoji}</span>
                      {type.label}
                    </span>
                  ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-8 text-center">
            <Link href="/vertragstypen" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#003856] hover:text-gold-700">
              Alle 16 Vertragstypen mit Risikokatalog ansehen
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔄 Prozess</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Von Upload bis Nachweis in vier Schritten</h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <div key={step.step} className="rounded-2xl border border-gray-100 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-[22px]">{step.emoji}</div>
                <div className="mt-2 text-[11px] font-bold text-gold-700">{step.step}</div>
                <h3 className="mt-1 text-[15px] font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Groups */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">👥 Zielgruppen</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Für Teams, die Verträge professionell prüfen</h2>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: "🏛️",
                title: "Kanzleien",
                description: "Vertragsprüfung, Mandatskontext und strukturierte Teamabstimmung mit klaren Zuständigkeiten.",
                link: { href: "/loesungen/kanzleien", label: "Mehr erfahren →" },
              },
              {
                emoji: "🏢",
                title: "Rechtsabteilungen",
                description: "Einheitliche Review-Abläufe mit definierten Freigabeschritten und nachvollziehbaren Entscheidungspfaden.",
                link: { href: "/loesungen/rechtsabteilungen", label: "Mehr erfahren →" },
              },
              {
                emoji: "🛡️",
                title: "Compliance & Datenschutz",
                description: "Zugriff auf Trust-Informationen, Nachweise und Betriebsdokumentation für Audits und interne Prüfungen.",
                link: { href: "/trust-center", label: "Trust Center →" },
              },
            ].map((group) => (
              <div key={group.title} className="rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-card">
                <span className="text-[28px]">{group.emoji}</span>
                <h3 className="mt-3 text-[17px] font-semibold text-gray-900">{group.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{group.description}</p>
                <Link href={group.link.href} className="mt-5 inline-flex items-center text-[13px] font-medium text-[#003856] hover:text-[#00507a]">
                  {group.link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats (count-up) */}
      <section className="border-y border-gray-200 bg-white py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 sm:grid-cols-4 sm:px-8">
          <div className="text-center">
            <p className="text-[28px] font-semibold text-[#003856]">
              <CountUp end={3} prefix="<" suffix="s" />
            </p>
            <p className="mt-1 text-[12px] text-gray-500">Analyse-Antwortzeit</p>
          </div>
          <div className="text-center">
            <p className="text-[28px] font-semibold text-[#003856]">
              <CountUp end={16} />
            </p>
            <p className="mt-1 text-[12px] text-gray-500">Vertragstypen (DE + EN)</p>
          </div>
          <div className="text-center">
            <p className="text-[28px] font-semibold text-[#003856]">
              <CountUp end={3} />
            </p>
            <p className="mt-1 text-[12px] text-gray-500">KI-Provider aktiv</p>
          </div>
          <div className="text-center">
            <p className="text-[28px] font-semibold text-[#003856]">
              <CountUp end={4} />
            </p>
            <p className="mt-1 text-[12px] text-gray-500">Export-Formate</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💬 Vertrauen</p>
            <h2 className="mt-3 text-center text-display-sm text-gray-950">Gebaut für juristische Teams</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { quote: "Die Kombination aus Risiko-Score und BGB-Referenzen spart uns bei der Erstprüfung erheblich Zeit.", role: "Partner, Wirtschaftskanzlei", location: "Frankfurt" },
              { quote: "Mandantentrennung auf DB-Ebene war für uns ein Muss. Die RLS-Architektur hat uns überzeugt.", role: "IT-Leiter, Großkanzlei", location: "München" },
              { quote: "Der DATEV-Export integriert sich nahtlos in unsere bestehende Buchhaltung.", role: "Rechtsabteilung, Mittelstand", location: "Hamburg" },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-[14px] text-gold-400">
                      ★
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-[13px] font-medium text-gray-900">{t.role}</p>
                  <p className="text-[11px] text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {[
              { emoji: "🇪🇺", label: "DSGVO-konform" },
              { emoji: "🇩🇪", label: "Hosting in Frankfurt" },
              { emoji: "🔐", label: "Row-Level Security" },
              { emoji: "📋", label: "Audit Trail" },
              { emoji: "🤖", label: "Kein KI-Training" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2">
                <span className="text-[14px]">{b.emoji}</span>
                <span className="text-[12px] font-medium text-gray-600">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="text-[28px]">🚀</p>
          <h2 className="mt-3 text-display-sm text-gray-950">Bereit für strukturierte Vertragsprüfung?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">
            Sprechen Sie mit uns über Ihren Arbeitskontext und Ihre Anforderungen. Unverbindlich, in 30 Minuten.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/enterprise-kontakt"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/12 transition-all hover:bg-[#002a42] active:scale-[0.98] sm:w-auto"
            >
              📞 Demo anfragen
            </Link>
            <Link
              href="/preise"
              className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
            >
              Preise ansehen
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
