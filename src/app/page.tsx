"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sbs_token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-bold text-slate-900 text-sm">SN</div>
            <span className="text-xl font-bold tracking-tight">SBS Nexus</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#produkte" className="text-sm text-slate-400 hover:text-white transition">Produkte</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition">Features</a>
            <a href="#preise" className="text-sm text-slate-400 hover:text-white transition">Preise</a>
            <a href="https://sbsdeutschland.com/sbshomepage/" className="text-sm text-slate-400 hover:text-white transition">Unternehmen</a>
            <a href="https://sbsdeutschland.com/sbshomepage/kontakt.html" className="text-sm text-slate-400 hover:text-white transition">Kontakt</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-400 hover:text-white transition hidden md:block">Anmelden</Link>
                <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                  Kostenlos starten
                </Link>
              </>
            )}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-slate-400 hover:text-white p-2">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d={mobileMenu ? "M6 6l12 12M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"}/></svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-4">
            <a href="#produkte" onClick={() => setMobileMenu(false)} className="block text-slate-300 hover:text-white">Produkte</a>
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-slate-300 hover:text-white">Features</a>
            <a href="#preise" onClick={() => setMobileMenu(false)} className="block text-slate-300 hover:text-white">Preise</a>
            <a href="https://sbsdeutschland.com/sbshomepage/" className="block text-slate-300 hover:text-white">Unternehmen</a>
            <a href="https://sbsdeutschland.com/sbshomepage/kontakt.html" className="block text-slate-300 hover:text-white">Kontakt</a>
            {!isLoggedIn && <Link href="/login" onClick={() => setMobileMenu(false)} className="block text-slate-300 hover:text-white">Anmelden</Link>}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              <span className="text-amber-400 text-sm font-medium">Neu: Smart Maintenance Alert mit Gemini Vision</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
              Enterprise KI-Plattform
              <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                für den deutschen Mittelstand
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Rechnungsverarbeitung, Vertragsanalyse, Wartungs-KI und technische Dokumentation – 
              alles DSGVO-konform auf Servern in Frankfurt.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg shadow-amber-500/20">
                Kostenlos testen
              </Link>
              <a href="https://sbsdeutschland.com/sbshomepage/kontakt.html" className="border border-slate-700 hover:border-slate-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2">
                Demo vereinbaren
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "5", label: "KI-Module", sub: "in Produktion" },
              { value: "98.5%", label: "KI-Genauigkeit", sub: "Ø über alle Module" },
              { value: "<3s", label: "Verarbeitung", sub: "pro Dokument" },
              { value: "100%", label: "DSGVO", sub: "Server in Frankfurt" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-3xl md:text-4xl font-bold text-amber-400">{stat.value}</p>
                <p className="text-white text-sm font-medium mt-1">{stat.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="produkte" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold tracking-wider uppercase mb-3">Plattform</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">5 KI-Module. Eine Plattform.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Modulare Enterprise-Lösungen, die sich nahtlos in Ihre bestehenden Prozesse integrieren.</p>
          </div>
          
          {/* Featured: Smart Maintenance Alert */}
          <div className="mb-8">
            <Link href="/maintenance" className="group block relative bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-2 border-amber-500/30 rounded-3xl p-8 md:p-12 hover:border-amber-500/60 transition-all duration-500 overflow-hidden">
              <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">Neu in 2026</div>
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20">
                    📸
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Smart Maintenance Alert</h3>
                  <p className="text-slate-400 text-lg mb-4 max-w-2xl">
                    Techniker fotografieren defekte Teile – Gemini Vision identifiziert automatisch Komponenten, 
                    prüft Garantie und empfiehlt Beschaffung. Von der Kamera zur Bestellung in Sekunden.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["Gemini 2.0 Flash Vision", "95% Confidence", "Auto-Beschaffung", "Slack & E-Mail Alerts", "Mobile PWA"].map((tag, i) => (
                      <span key={i} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-sm">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="hidden md:flex items-center text-amber-400 group-hover:translate-x-2 transition-transform">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 16h22m-7-7l7 7-7 7"/></svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rechnungsverarbeitung */}
            <a href="https://app.sbsdeutschland.com" className="group bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-2xl mb-6">📄</div>
              <h3 className="text-xl font-semibold mb-2">Rechnungsverarbeitung</h3>
              <p className="text-slate-500 text-sm mb-5">OCR + KI-Extraktion mit DATEV-Export. XRechnung, ZUGFeRD und E-Rechnung ready.</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li className="flex items-center gap-2"><span className="text-cyan-400 text-xs">●</span> Auto-Kontierung SKR03/04</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 text-xs">●</span> DATEV-Export</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 text-xs">●</span> Zahlungsmanagement</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 text-xs">●</span> Skonto-Optimierung</li>
              </ul>
            </a>
            
            {/* Vertragsanalyse */}
            <a href="https://contract.sbsdeutschland.com" className="group bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6">📝</div>
              <h3 className="text-xl font-semibold mb-2">Vertragsanalyse</h3>
              <p className="text-slate-500 text-sm mb-5">Multimodale Analyse von Verträgen, Klauseln und Risiken mit automatischem Fristentracking.</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li className="flex items-center gap-2"><span className="text-purple-400 text-xs">●</span> Risiko-Erkennung</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 text-xs">●</span> Vertragsvergleich</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 text-xs">●</span> Klausel-Bibliothek</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 text-xs">●</span> JSON/CSV-Export</li>
              </ul>
            </a>
            
            {/* HydraulikDoc AI */}
            <a href="https://sbsdeutschland.com/static/landing/hydraulikdoc.html" className="group bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-2xl mb-6">🔧</div>
              <h3 className="text-xl font-semibold mb-2">HydraulikDoc AI</h3>
              <p className="text-slate-500 text-sm mb-5">Video-Diagnose mit Gemini 2.5 Pro. RAG-Search in technischer Dokumentation.</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li className="flex items-center gap-2"><span className="text-orange-400 text-xs">●</span> Video-Analyse</li>
                <li className="flex items-center gap-2"><span className="text-orange-400 text-xs">●</span> RAG-Dokumentensuche</li>
                <li className="flex items-center gap-2"><span className="text-orange-400 text-xs">●</span> Multi-Modal AI</li>
                <li className="flex items-center gap-2"><span className="text-orange-400 text-xs">●</span> Projekt Hephaestus</li>
              </ul>
            </a>
            
            {/* Finance Copilot */}
            <a href="https://app.sbsdeutschland.com/copilot" className="group bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-6">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Finance Copilot</h3>
              <p className="text-slate-500 text-sm mb-5">Chat mit Ihren Finanzdaten. Analysen, Reports und Budget-Tracking auf natürliche Weise.</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li className="flex items-center gap-2"><span className="text-emerald-400 text-xs">●</span> Natural Language</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 text-xs">●</span> Budget-Dashboard</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 text-xs">●</span> Smart Analytics</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 text-xs">●</span> Auto-Reports</li>
              </ul>
            </a>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section id="features" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold tracking-wider uppercase mb-3">Enterprise-Grade</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Gebaut für den Mittelstand</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Keine Spielerei – enterprise-reife Infrastruktur für kritische Geschäftsprozesse.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🔒", title: "DSGVO-konform", desc: "Alle Daten auf deutschen Servern in Frankfurt. Verarbeitung ausschließlich in der EU. Google Cloud mit DPA.", color: "amber" },
              { icon: "🧠", title: "Hybrid AI Engine", desc: "GPT-4o, Claude 3.5, Gemini 2.0 Flash – automatisch das beste Modell für jeden Task. Multi-Provider-Redundanz.", color: "cyan" },
              { icon: "🔗", title: "Enterprise-Integrationen", desc: "DATEV, SAP, Google Workspace, Slack, E-Mail via Resend, n8n-Workflows. Webhook-basierte Automation.", color: "purple" },
              { icon: "👥", title: "RBAC & Multi-User", desc: "Rollenbasierte Zugriffskontrolle mit Admin, Manager und Viewer. Google OAuth SSO. Audit-Logs.", color: "emerald" },
              { icon: "📊", title: "Echtzeit-Dashboards", desc: "Live-Monitoring aller Prozesse. Analytics, KPIs und automatisierte Reports für Management-Ebene.", color: "orange" },
              { icon: "🔔", title: "Multi-Channel Alerts", desc: "Slack, E-Mail und Google Sheets Notifications. n8n-Workflows für individuelle Automatisierungen.", color: "rose" },
            ].map((feature, i) => (
              <div key={i} className="group p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Technologie-Stack</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {["GPT-4o", "Gemini 2.0 Flash", "Claude 3.5", "FastAPI", "Next.js", "DATEV", "Google Cloud", "n8n", "Stripe", "OAuth 2.0"].map((tech, i) => (
              <span key={i} className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full text-sm text-slate-400">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold tracking-wider uppercase mb-3">Preise</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Transparent & fair</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Keine versteckten Kosten. Monatlich kündbar. 14 Tage kostenlos testen.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Starter</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">€99</span>
                <span className="text-slate-500 text-sm">/Monat</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-400 mb-8">
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> 100 Rechnungen/Monat</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> 50 Verträge/Monat</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> DATEV-Export</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> E-Mail Support</li>
              </ul>
              <Link href="/register" className="block text-center w-full py-3 border border-white/10 hover:border-white/20 text-white rounded-xl transition text-sm font-medium">
                14 Tage kostenlos
              </Link>
            </div>
            
            {/* Professional */}
            <div className="relative bg-gradient-to-b from-amber-500/10 to-transparent border-2 border-amber-500/30 rounded-2xl p-8">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                Beliebt
              </div>
              <p className="text-amber-400 text-sm font-medium uppercase tracking-wider mb-2">Professional</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">€299</span>
                <span className="text-slate-500 text-sm">/Monat</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> 500 Rechnungen/Monat</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Unbegrenzt Verträge</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Smart Maintenance Alert</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> HydraulikDoc AI</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Finance Copilot</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> 5 Team-Mitglieder</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Priority Support</li>
              </ul>
              <Link href="/register" className="block text-center w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl transition text-sm font-semibold">
                Jetzt starten
              </Link>
            </div>
            
            {/* Enterprise */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Enterprise</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-400 mb-8">
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Unbegrenzte Nutzung</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Alle 5 Module</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Unbegrenzt Team</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> SSO / SAML / SCIM</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Dedicated Support</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> Custom Integrationen</li>
                <li className="flex items-center gap-2.5"><span className="text-amber-400 text-xs">●</span> On-Premise möglich</li>
              </ul>
              <a href="https://sbsdeutschland.com/sbshomepage/kontakt.html" className="block text-center w-full py-3 border border-white/10 hover:border-white/20 text-white rounded-xl transition text-sm font-medium">
                Gespräch vereinbaren
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🇩🇪", text: "Made in Weinheim" },
              { icon: "🔒", text: "DSGVO-konform" },
              { icon: "☁️", text: "Server in Frankfurt" },
              { icon: "🏛️", text: "GmbH & Co. KG" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center justify-center gap-2.5 text-slate-500 text-sm">
                <span className="text-xl">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Bereit für Enterprise KI?</h2>
              <p className="text-amber-100 mb-10 text-lg max-w-lg mx-auto">14 Tage kostenlos. Keine Kreditkarte. Sofort produktiv.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="bg-white text-amber-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-amber-50 transition shadow-lg">
                  Kostenlos starten
                </Link>
                <a href="https://sbsdeutschland.com/sbshomepage/kontakt.html" className="border-2 border-white/40 hover:border-white text-white px-8 py-4 rounded-xl font-semibold text-lg transition">
                  Demo buchen
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xs">SN</div>
                <span className="font-bold">SBS Nexus</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">Enterprise KI-Plattform für den deutschen Mittelstand.</p>
              <p className="text-slate-600 text-xs mt-3">📍 Weinheim, Deutschland</p>
            </div>
            
            {/* Produkte */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-slate-300">Produkte</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="https://app.sbsdeutschland.com" className="hover:text-white transition">Rechnungsverarbeitung</a></li>
                <li><a href="https://contract.sbsdeutschland.com" className="hover:text-white transition">Vertragsanalyse</a></li>
                <li><Link href="/maintenance" className="hover:text-white transition">Smart Maintenance</Link></li>
                <li><a href="https://sbsdeutschland.com/static/landing/hydraulikdoc.html" className="hover:text-white transition">HydraulikDoc AI</a></li>
                <li><a href="https://app.sbsdeutschland.com/copilot" className="hover:text-white transition">Finance Copilot</a></li>
              </ul>
            </div>
            
            {/* Plattform */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-slate-300">Plattform</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition">Integrationen</Link></li>
                <li><Link href="/security" className="hover:text-white transition">Sicherheit</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Preise</Link></li>
              </ul>
            </div>
            
            {/* Unternehmen */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-slate-300">Unternehmen</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="https://sbsdeutschland.com/sbshomepage/unternehmen.html" className="hover:text-white transition">Über uns</a></li>
                <li><a href="https://sbsdeutschland.com/sbshomepage/kontakt.html" className="hover:text-white transition">Kontakt</a></li>
                <li><a href="https://sbsdeutschland.com/sbshomepage/sap-consulting.html" className="hover:text-white transition">SAP Consulting</a></li>
                <li><a href="https://sbsdeutschland.com/sbshomepage/it-consulting.html" className="hover:text-white transition">IT Consulting</a></li>
              </ul>
            </div>
            
            {/* Rechtliches */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-slate-300">Rechtliches</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><Link href="/datenschutz" className="hover:text-white transition">Datenschutz</Link></li>
                <li><Link href="/impressum" className="hover:text-white transition">Impressum</Link></li>
                <li><a href="https://sbsdeutschland.com/sbshomepage/agb.html" className="hover:text-white transition">AGB</a></li>
              </ul>
              <div className="mt-6">
                <p className="text-slate-600 text-xs">Support</p>
                <a href="mailto:ki@sbsdeutschland.de" className="text-slate-500 text-sm hover:text-white transition">ki@sbsdeutschland.de</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>© 2026 SBS Deutschland GmbH & Co. KG · Weinheim</p>
            <p>Enterprise KI-Plattform für den DACH-Markt</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
