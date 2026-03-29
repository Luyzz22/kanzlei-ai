"use client"

import { useState } from "react"

export default function EnterpriseKontaktPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">📞</span>
              <span className="text-[12px] font-medium text-gold-700">Enterprise</span>
            </div>
            <h1 className="text-display text-gray-950">Demo anfragen</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">
              Erfahren Sie in 30 Minuten, wie KanzleiAI Ihre Vertragsprüfung transformiert. Unverbindlich, individuell auf Ihren Arbeitskontext zugeschnitten.
            </p>
          </div>

          {!submitted ? (
            <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[13px] font-medium text-gray-700">Vorname *</span>
                    <input type="text" required className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-medium text-gray-700">Nachname *</span>
                    <input type="text" required className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[13px] font-medium text-gray-700">Geschäftliche E-Mail *</span>
                  <input type="email" required className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-gray-700">Organisation *</span>
                  <input type="text" required className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-gray-700">Rolle</span>
                  <select className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200">
                    <option value="">Bitte wählen</option>
                    <option>Partner / Inhaber</option>
                    <option>Rechtsanwalt / Jurist</option>
                    <option>Leitung Rechtsabteilung</option>
                    <option>IT / Digitalisierung</option>
                    <option>Compliance / Datenschutz</option>
                    <option>Geschäftsführung</option>
                    <option>Andere</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-gray-700">Anzahl Nutzer (geschätzt)</span>
                  <select className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200">
                    <option value="">Bitte wählen</option>
                    <option>1-5</option>
                    <option>6-20</option>
                    <option>21-50</option>
                    <option>51-200</option>
                    <option>200+</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-gray-700">Nachricht (optional)</span>
                  <textarea rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" placeholder="Welche Vertragstypen prüfen Sie? Gibt es spezifische Anforderungen?" />
                </label>
                <button
                  onClick={() => setSubmitted(true)}
                  className="w-full rounded-full bg-[#003856] py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42] active:scale-[0.98]"
                >
                  Demo vereinbaren
                </button>
                <p className="text-center text-[11px] text-gray-400">Wir antworten innerhalb von 24 Stunden. Keine automatischen E-Mails.</p>
              </div>
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
              <span className="text-[40px]">✅</span>
              <h2 className="mt-4 text-[20px] font-semibold text-emerald-900">Anfrage erhalten</h2>
              <p className="mt-2 text-[15px] text-emerald-700">Wir melden uns innerhalb von 24 Stunden bei Ihnen. Vielen Dank für Ihr Interesse an KanzleiAI.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
