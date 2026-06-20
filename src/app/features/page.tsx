'use client'

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

/* ---------- Reveal-on-scroll (self-contained) ---------- */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
        transform: shown ? "none" : "translateY(20px)",
        transition: `opacity .7s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .7s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ---------- Feature-Detail-Zeile ---------- */
function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  href,
  reverse = false,
  mock,
}: {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  href: string
  reverse?: boolean
  mock: React.ReactNode
}) {
  return (
    <Reveal className="border-b border-gray-100 py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className={reverse ? "lg:order-2" : ""}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">{eyebrow}</p>
          <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight text-gray-950 sm:text-[2rem]">{title}</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">{body}</p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link href={href} className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#003856] hover:text-gold-700">
            Modul öffnen
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{mock}</div>
      </div>
    </Reveal>
  )
}

function MockShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">{title}</p>
      {children}
    </div>
  )
}

function KV({ k, v, tone = "ink" }: { k: string; v: string; tone?: "ink" | "good" }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 text-[14px] last:border-0">
      <span className="text-gray-500">{k}</span>
      <span className={tone === "good" ? "font-medium text-emerald-600" : "font-medium text-gray-900"}>{v}</span>
    </div>
  )
}

/* ---------- Restliche Module (Grid) ---------- */
const moreModules = [
  { emoji: "📡", title: "Vertragsradar", desc: "Regulatorische Änderungen und Fristen im Blick — EU AI Act, NIS2, LkSG.", href: "/workspace/vertragsradar" },
  { emoji: "🎯", title: "Verhandlungssimulator", desc: "Klauselalternativen und Fallback-Positionen vor der Verhandlung durchspielen.", href: "/workspace/verhandlung" },
  { emoji: "📂", title: "Dokumenten-Workspace", desc: "Verträge mandantengetrennt verwalten, versionieren und vergleichen.", href: "/workspace/dokumente" },
  { emoji: "⚖️", title: "AGB-Vergleich", desc: "Zwei Vertragsstände gegenüberstellen — Abweichungen klar markiert.", href: "/workspace/vergleich" },
  { emoji: "📘", title: "Playbooks", desc: "Eigene Prüfregeln und Standardpositionen als wiederverwendbare Playbooks.", href: "/workspace/playbooks" },
  { emoji: "🛡️", title: "Trust Center", desc: "Sub-Prozessoren, Nachweise und Compliance-Dokumentation für die Beschaffung.", href: "/trust-center" },
]

export default function FeaturesPage() {
  return (
    <main className="bg-[#FAFAF7]">
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-b from-gold-200/25 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✨ Features</p>
          <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-gray-950 sm:text-[3.25rem]">
            Alles für <span className="text-[#003856]">belastbare</span> Vertragsanalyse.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-gray-500">
            Von der Schnellanalyse bis zur auditfähigen Freigabe — jedes Modul ist auf die tägliche Arbeit juristischer
            Teams in DACH zugeschnitten.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/enterprise-kontakt"
              className="inline-flex items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/12 transition-all hover:bg-[#002a42] active:scale-[0.98]"
            >
              Demo anfragen →
            </Link>
            <Link
              href="/produkt"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              Produkt-Übersicht
            </Link>
          </div>
        </div>
      </section>

      {/* Detail-Zeilen */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <FeatureRow
          eyebrow="Schnellanalyse"
          title="In Sekunden vom Dokument zum Risikoprofil."
          body="Vertrag hochladen — KanzleiAI klassifiziert, extrahiert Klauseln und liefert einen begründeten Risiko-Score. Deutsch und Englisch."
          bullets={["Score mit Severity-Aufschlüsselung", "Belegstellen direkt im Dokument", "Kündigungsfristen-Ampel"]}
          href="/workspace/analyse"
          mock={
            <MockShell title="Analyse-Ergebnis">
              <KV k="Risiko-Score" v="89 / 100" />
              <KV k="Kritische Klauseln" v="3" />
              <KV k="Analysezeit" v="24 s" tone="good" />
              <div className="mt-4 flex gap-3.5 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <span className="w-1.5 flex-none rounded-full bg-red-500" />
                <div>
                  <p className="text-[14px] font-medium text-gray-900">Haftungsausschluss grobe Fahrlässigkeit</p>
                  <p className="text-[12px] text-gray-500">Unwirksam gegenüber AGB-Recht.</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#003856]">§ 309 Nr. 7b BGB</p>
                </div>
              </div>
            </MockShell>
          }
        />

        <FeatureRow
          reverse
          eyebrow="Contract Copilot"
          title="Fragen Sie den Vertrag — auf Deutsch."
          body="Stellen Sie Fragen in natürlicher Sprache. Jede Antwort verweist auf die konkrete Stelle im Dokument — keine Antwort ohne Beleg."
          bullets={["Antworten mit Quellenangabe", "Klausel-Abgleich gegen Playbook", "Mandantengetrennt & auditierbar"]}
          href="/workspace/copilot"
          mock={
            <MockShell title="Copilot">
              <div className="mb-2.5 rounded-xl bg-gray-100 px-4 py-2.5 text-[14px] text-gray-700">
                Gibt es eine automatische Vertragsverlängerung?
              </div>
              <div className="rounded-xl bg-[#003856] px-4 py-2.5 text-[14px] leading-relaxed text-white">
                Ja. § 4 sieht eine automatische Verlängerung um je 12 Monate vor, Kündigung nur mit 3 Monaten Frist.{" "}
                <span className="font-medium text-gold-200">→ Beleg: § 4 Abs. 2</span>
              </div>
            </MockShell>
          }
        />

        <FeatureRow
          eyebrow="Review & Freigabe"
          title="Befunde sichten, anpassen, freigeben."
          body="Jeder Befund lässt sich prüfen, kommentieren und mit einem überarbeiteten Formulierungsvorschlag versehen — vor der finalen Freigabe."
          bullets={["Severity-Übersicht & Filter", "Inline-Formulierungsvorschläge", "Batch-Freigabe geringer Risiken"]}
          href="/workspace/review-queue"
          mock={
            <MockShell title="Review-Status">
              <KV k="✓ Geprüft" v="9" />
              <KV k="✎ In Bearbeitung" v="2" />
              <KV k="✕ Offen" v="1" />
              <div className="mt-5">
                <span className="inline-flex items-center rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white">Freigeben</span>
              </div>
            </MockShell>
          }
        />

        <FeatureRow
          reverse
          eyebrow="Audit & Integrationen"
          title="Revisionssicher — und am Ursprung der Daten."
          body="Jeder Analyseschritt wird protokolliert. Verträge fließen direkt aus Ihren Systemen ein — etwa aus Microsoft Dynamics 365 Business Central."
          bullets={["Lückenloser Audit-Trail (6 Jahre, GoBD-nah)", "Business Central · Microsoft 365 · DMS", "Rollen, Berechtigungen, Freigaben"]}
          href="/integrationen"
          mock={
            <MockShell title="Integrationen">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <span className="text-[20px]">🔗</span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-gray-900">Dynamics 365 Business Central</p>
                  <p className="text-[11px] text-gray-400">5 Bestellungen importiert</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Verbunden</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <span className="text-[20px]">📎</span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-gray-900">Microsoft 365 / SharePoint</p>
                  <p className="text-[11px] text-gray-400">Dokumentenquelle</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">Verfügbar</span>
              </div>
            </MockShell>
          }
        />
      </div>

      {/* Weitere Module */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🧩 Weitere Module</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Der vollständige Arbeitsplatz</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moreModules.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-gold-200 hover:shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-[24px] transition-transform group-hover:-rotate-6">
                  {m.emoji}
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-gray-900">{m.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-gray-500">{m.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <h2 className="text-display-sm text-gray-950">
            Sehen Sie es an Ihren <span className="text-[#003856]">eigenen</span> Verträgen.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">
            30 Minuten, Ihre Dokumente, ein konkretes Ergebnis.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/enterprise-kontakt"
              className="inline-flex items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/12 transition-all hover:bg-[#002a42] active:scale-[0.98]"
            >
              Demo anfragen →
            </Link>
            <Link
              href="/preise"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              Preise ansehen
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
