"use client"

import { useState } from "react"

import { HeroVisualSlide } from "@/components/marketing/hero-visual-slide"

const slides = [
  {
    key: "workspace" as const,
    title: "Dokumenten-Workspace",
    description: "Dokumente, Verträge und Mandatskontext in einer klaren Arbeitsfläche mit Status und Verantwortlichkeiten."
  },
  {
    key: "analyse" as const,
    title: "KI-gestützte Prüfung",
    description: "Hinweise, Risiken und Prüfpunkte werden strukturiert aufbereitet und bleiben für den Review nachvollziehbar."
  },
  {
    key: "review" as const,
    title: "Review & Freigaben",
    description: "Freigaben folgen einem definierten Ablauf mit Rollen, Verantwortlichen und dokumentierten Entscheidungen."
  },
  {
    key: "audit" as const,
    title: "Trust & Nachweise",
    description: "Audit- und Governance-Flächen zeigen, welche Schritte erfolgt sind und wie Entscheidungen belegt werden können."
  }
]

export function HomeHeroSlides() {
  const [activeSlide, setActiveSlide] = useState(0)
  const activeItem = slides[activeSlide]

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5">
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => setActiveSlide(index)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
              activeSlide === index
                ? "border-slate-300 bg-white text-slate-900"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
            }`}
            aria-pressed={activeSlide === index}
          >
            {slide.title}
          </button>
        ))}
      </div>
      <h2 className="text-lg font-semibold text-white">{activeItem.title}</h2>
      <p className="mt-1 text-sm text-slate-300">{activeItem.description}</p>
      <div className="mt-4">
        <HeroVisualSlide variant={activeItem.key} />
      </div>
    </section>
  )
}
