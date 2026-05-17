import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Release Notes", description: "Alle Änderungen und Updates an KanzleiAI." }

const releases = [
  {
    version: "4.1.0",
    date: "17. Mai 2026",
    title: "Playbook Miner, Radar v2, AI Act Art. 50 Compliance",
    current: true,
    changes: [
      { type: "NEU", text: "Playbook Miner Alpha — automatische Klausel-Policies aus Review-Historie. Erkennt 5 Patterns (Auto-Accept, Immer prüfen, Bevorzugte Formulierung, Review empfohlen, Inkonsistent) mit Konfidenz-Score, bevorzugten Standardformulierungen und Reviewer-Zuordnung" },
      { type: "NEU", text: "Regulatory Radar v2 — Remediation-Maßnahmen pro Regulierung mit Status-Tracking (Offen → In Arbeit → Erledigt), Fortschrittsbalken, Fristberechnung und kopierbaren Nachtragsklausel-Vorlagen für EU AI Act, NIS2 und LkSG" },
      { type: "NEU", text: "AI Act Art. 50 KI-Kennzeichnung — verpflichtende Transparenz-Badges auf allen KI-generierten Inhalten (Analyse-Findings, Vertragsvergleiche). Deadline-konform bis 02.08.2026" },
      { type: "CHANGE", text: "Sidebar-Navigation um Playbook Miner erweitert (NEU-Badge unter Workspace)" },
      { type: "CHANGE", text: "Regulierungen in der Watchlist enthalten jetzt konkrete RemediationAction-Objekte mit Klausel-Amendments" },
    ]
  },
  {
    version: "4.0.0",
    date: "17. Mai 2026",
    title: "Evidence Graph, Eval Dashboard & Vertragsvergleich v2",
    current: false,
    changes: [
      { type: "NEU", text: "Evidence Graph MVP — klickbare Begründungskette pro Finding mit Rechtsgrundlagen (normBasis mit DIREKT/ZWINGEND/B2B-INDIZ/ANALOG-Markern), Argumentationskette als nummerierte Timeline, Gegenargumenten für Verhandlungsvorbereitung, Einschränkungen der KI-Bewertung und Konfidenz-Faktoren mit gewichteten Balken" },
      { type: "NEU", text: "Continuous Eval Dashboard — Qualitätsmonitoring unter /workspace/eval-dashboard mit Override-Raten, Drift Detection (automatischer Alert bei >10pp Anstieg), Konfidenz-Kalibrierung (werden High-Confidence-Findings häufiger akzeptiert?), Provider-Vergleich, Prompt-Version-Tracking und Sparkline-Trends für Konfidenz, Risiko, Kosten und Latenz" },
      { type: "NEU", text: "Vertragsvergleich v2 — Risiko-Delta pro Klausel-Diff (-100 bis +100: wer hat mehr Risiko?), normBasis-Badges pro Abweichung, konkrete Kompromissvorschläge für Nachverhandlungen, Ø Risiko-Delta als 4. KPI-Karte" },
      { type: "NEU", text: "Enterprise-Logo — neues Shield-Logomark mit Vertrags-/AI-Motiv ersetzt das bisherige 'KA'-Textlogo. Favicon, Apple-Icon und Header aktualisiert" },
      { type: "CHANGE", text: "Prompt-Version auf v2026-05-16 aktualisiert — confidenceFactors und evidenceGraph werden jetzt in der DB persistiert (vorher nur im Prompt-Output)" },
      { type: "CHANGE", text: "Eval Dashboard in Sidebar-Navigation unter Verwaltung eingebunden mit NEU-Badge" },
      { type: "CHANGE", text: "Analyse-Schema auf v4 aktualisiert mit evidenceGraph-Objekt (Zod-validiert)" },
    ]
  },
  {
    version: "3.2.0",
    date: "15. Mai 2026",
    title: "Review-Workflow, E-Mail-Benachrichtigung & Hybrid-Pricing",
    current: false,
    changes: [
      { type: "NEU", text: "Review-Formular mit Radio-Buttons und 'Kenntnisgenommen' als vierte Option neben Akzeptiert/Abgelehnt/Angepasst" },
      { type: "NEU", text: "E-Mail-Benachrichtigung bei Analyse-Abschluss an den Ersteller" },
      { type: "NEU", text: "Reviewer-Name und Review-Historie pro Finding — wer hat wann was entschieden" },
      { type: "NEU", text: "Bulk-Upload — mehrere Verträge gleichzeitig hochladen und analysieren" },
      { type: "NEU", text: "Hybrid-Pricing-Seite mit Starter (€790/Mo), Business (€1.990/Mo) und Enterprise (ab €54k ACV) inkl. Feature-Vergleich, FAQ und Trust-Badges" },
      { type: "CHANGE", text: "Profil-Seite Enterprise-Rewrite mit verbessertem Layout" },
      { type: "FIX", text: "Compliance-Claims auf allen Seiten konsistent" },
      { type: "FIX", text: "AI Act Transparenzseite auf aktuellen Stand gebracht (Art. 50 Deadline 02.08.2026)" },
    ]
  },
  {
    version: "3.1.0",
    date: "12. Mai 2026",
    title: "Review-Pipeline, PDF-Export & Analyse-Präzision",
    current: false,
    changes: [
      { type: "NEU", text: "Review-Pipeline mit Prüffortschritt — Fortschrittsbalken zeigt '7/11 Findings geprüft' mit Prozentangabe. Status-Dots (✓ ✕ ✎) auf jedem Finding sichtbar, auch im eingeklappten Zustand" },
      { type: "NEU", text: "Batch-Accept — 'Alle Niedrig-Findings akzeptieren' akzeptiert alle ungeprüften Niedrig-Findings mit einem Klick" },
      { type: "NEU", text: "Freigabe-Button — 'Analyse freigeben' erscheint erst, wenn alle Findings geprüft sind. Setzt den Review-Status auf FREIGEGEBEN mit Audit-Event" },
      { type: "NEU", text: "Formulierungsvorschlag editierbar — bei 'Angepasst' kann der Formulierungsvorschlag direkt überarbeitet werden. Wird als modifiedSuggestedRevision persistiert" },
      { type: "NEU", text: "PDF-Export für Mandantenakte — 'Als PDF exportieren' öffnet druckoptimierte A4-Ansicht mit BRAO-Disclaimer, Risiko-Summary, Klassifikation, allen Findings mit Review-Status und Formulierungsvorschlägen" },
      { type: "NEU", text: "Klassifikationsblock im UI — Vertragstyp, Parteikonstellation, AGB-Kontrolle, Branche und Mandantenrolle werden zwischen Extraktion und Findings angezeigt" },
      { type: "NEU", text: "Norm-Analogie-Kennzeichnung — jede Normreferenz trägt [DIREKT], [ZWINGEND], [B2B-INDIZ] oder [ANALOG] Marker für sofortige Einordnung" },
      { type: "NEU", text: "Branchenmodul dedizierte Findings — fehlende CE-Konformität, Versicherungsnachweis und LkSG-Klauseln werden als eigenständige Findings erzeugt" },
      { type: "NEU", text: "Cross-Clause Pflicht-Prüfschablonen — 3 toxische Interaktionsmuster (Preis×Annahme, Rüge×Aufrechnung, Kündigung×Preis×Änderung) werden systematisch geprüft" },
      { type: "CHANGE", text: "Accordion-Findings — Findings sind im Standardzustand eingeklappt mit Severity-Filter-Buttons (Alle/Hoch/Mittel/Niedrig) und Risiko-Score-Anzeige" },
      { type: "CHANGE", text: "BRAO § 43a Header — nicht-wegklickbarer Rechtshinweis als eigenständiger Block VOR den Findings" },
      { type: "CHANGE", text: "Lauf-Metadaten eingeklappt — Provider, Modell, Prompt-Versionen hinter Accordion versteckt" },
      { type: "CHANGE", text: "Vertragsstrafe-Formulierungen nutzen jetzt Stufenmodell statt 'billiges Ermessen' (Bestimmtheitsgebot)" },
      { type: "CHANGE", text: "Temporal-Validierung — Formulierungsvorschläge bei Neuverträgen enthalten automatisch Anlaufphase" },
      { type: "FIX", text: "504-Timeout-Fehler zeigt jetzt saubere Fehlermeldung statt TypeError-Crash" },
      { type: "FIX", text: "Dropdown-Menüs öffnen nicht mehr gleichzeitig übereinander" },
    ]
  },
  {
    version: "3.0.0",
    date: "12. Mai 2026",
    title: "KI-Analyse-Engine v3 — Fachaudit 71→95 Punkte",
    current: false,
    changes: [
      { type: "NEU", text: "Vertragstypklassifikation (Step 0) — AGB/Individualvertrag/Mischform-Erkennung mit §§ 305-310 BGB-Kontrollmatrix, Parteikonstellation (B2B/B2C/Öffentliche Hand), Mandantenrolle und Brancheneinordnung als obligatorischer Pre-Step" },
      { type: "NEU", text: "Datenschutz-Modul — automatische DSGVO-Kollisionsprüfung (Art. 15/17/28/44 DSGVO), GeschGehG-Konformität (§ 2/§ 3), AVV-Erfordernis und zeitliche Begrenzung von Geheimhaltungsklauseln" },
      { type: "NEU", text: "Strafrechts-Flag — Klauseln mit strafrechtlichem Risiko (§ 123, § 240, § 242, § 253 StGB) werden automatisch als severity=hoch eingestuft mit konkreten Straftatbeständen" },
      { type: "NEU", text: "Risikokalibrierungsmatrix — verbindliche Entscheidungsregeln für severity-Einstufung mit 7 Hoch-Kriterien, 7 Mittel-Kriterien und Kontrollregel gegen Unterkalibrierung" },
      { type: "NEU", text: "Cross-Clause-Analyser — Klauselinteraktionen (verstärkend/kompensierend/widersprüchlich/kumulativ) werden identifiziert und als kombinierte Risiken bewertet" },
      { type: "NEU", text: "Branchenkontext-Modul — branchenspezifische Normen (ProdHaftG, Maschinenrichtlinie, KWG/MaRisk, CISG/Incoterms) werden basierend auf der Vertragstypklassifikation automatisch injiziert" },
      { type: "NEU", text: "Konfidenz-Explainability — jedes Finding hat 5 gewichtete Konfidenz-Faktoren (Normklarheit, Klauselklarheit, Vertragskontext, Branchenkompatibilität, Präzedenzlage) mit limitierendem Faktor" },
      { type: "NEU", text: "BRAO § 43a Audit-Trail — berufsrechtlicher Hinweis zur Eigenverantwortlichkeit des Anwalts wird automatisch in die Analysezusammenfassung integriert" },
      { type: "CHANGE", text: "Formulierungsvorschläge auf juristisches Fachsprachniveau gehoben: Vollständigkeit, Fairness für beide Parteien, gesetzeskonforme Rückfallposition, Praxistauglichkeit" },
      { type: "CHANGE", text: "Prompt-Version auf 2026-05-12 aktualisiert — alle Analyse-Runs sind über promptMetadata reproduzierbar" },
      { type: "CHANGE", text: "Max-Findings von 12 auf 15 erhöht für Datenschutz- und Strafrechts-Dimensionen" },
      { type: "FIX", text: "Benachrichtigungsglocke zeigt jetzt echte ungelesene Anzahl statt hardcodierter '2'" },
    ]
  },
  {
    version: "2.2.0",
    date: "4. Mai 2026",
    title: "Provider-Fix, Verhandlungssimulator Live & Dashboard-Upgrade",
    current: false,
    changes: [
      { type: "NEU", text: "\u{1F3AF} Verhandlungssimulator Live — Echtzeit-Streaming mit Claude Sonnet als KI-Gegenpartei und Coach-Feedback nach jedem Zug" },
      { type: "NEU", text: "\u{1F4CB} Copilot Vertrags-Picker — analysierte Verträge direkt im Copilot auswählen, inkl. Extraction, Findings und Formulierungsvorschlaegen" },
      { type: "NEU", text: "\u{1F4CA} Dashboard zeigt jetzt echte DB-Daten: Analysen gesamt, Ø Risiko-Score, Findings, letzte Analysen mit Verlinkung" },
      { type: "NEU", text: "\u{1F514} Benachrichtigungssystem mit echten Daten aus Analyse-Runs und Review-Entscheidungen" },
      { type: "FIX", text: "Provider-Fallback-Bug behoben: max_tokens 4096→16384 — Sonnet Risk-Output wurde abgeschnitten (Root Cause)" },
      { type: "FIX", text: "stripCodeFences() robuster: neues Regex ohne m-Flag, JSON-Block-Isolation als Fallback" },
      { type: "FIX", text: "ClaudeProvider strippt Markdown-Fences bei jsonMode vor der Rückgabe (Defense in Depth)" },
      { type: "FIX", text: "Dreistufiger JSON-Parser: Trailing Commas, Kommentare, NaN und unescaped Newlines werden bereinigt" },
      { type: "FIX", text: "z.coerce.number() für alle numerischen Schema-Felder — LLM-String-Zahlen werden toleriert" },
      { type: "FIX", text: "Prisma-Relation documentExtraction → extraction — Portfolio-Stats und Benchmarking funktionieren jetzt korrekt" },
      { type: "CHANGE", text: "Extraction Primary: gpt-4o-mini → Claude Sonnet (Enterprise-Qualitaet)" },
      { type: "CHANGE", text: "Admin-Diagnose-Endpoint /api/admin/diagnose-risk für Live-Debugging des Sonnet Risk-Outputs" },
    ]
  },
  {
    version: "2.1.0",
    date: "16. April 2026",
    title: "Vertragsradar + KI-Verhandlungssimulator",
    current: false,
    changes: [
      { type: "NEU", text: "🛰️ Vertragsradar — Regulatorischer Compliance-Monitor. Gesetzesaenderungen (EU AI Act, NIS2, DSGVO, LkSG, E-Rechnung) automatisch gegen das Vertragsportfolio prüfen" },
      { type: "NEU", text: "🎯 KI-Verhandlungssimulator — Flugsimulator für Vertragsverhandlungen mit adaptiver KI-Gegenpartei und Coaching-Feedback nach jedem Zug" },
      { type: "NEU", text: "4 Verhandlungsszenarien: Lieferantenvertrag, SaaS mit DSGVO, M&A-NDA, LkSG-Rahmenvertrag" },
      { type: "NEU", text: "5 überwachte Regulierungen mit kuratierten Feeds (EUR-Lex, BMJ, dejure.org, BMAS)" },
      { type: "NEU", text: "Radar-Admin-Settings: Feeds, Scan-Intervalle (Echtzeit/taeglich/woechentlich), Alert-Kanaele" },
      { type: "NEU", text: "Compliance-Architektur: Beide Module sind EU AI Act Limited Risk (Beratungstools mit Human Oversight)" },
      { type: "NEU", text: "API: POST /api/radar/scan mit Regulatorik-Matching und Confidence-Scores" },
      { type: "NEU", text: "Portfolio-weite Heatmap mit 156 Verträgen, 131 Matches und 20 kritischen Handlungen" },
      { type: "NEU", text: "Produkt auf Zehn Kernmodule erweitert, Sidebar mit NEU/BETA-Badges" },
    ]
  },
  {
    version: "2.0.0",
    date: "11. April 2026",
    title: "DERMALOG Enterprise + Einkauf & Beschaffung",
    changes: [
      { type: "NEU", text: "Bilinguale Vertragsanalyse (DE/EN) mit automatischer Spracherkennung" },
      { type: "NEU", text: "AGB vs. AEB Vergleichsmodus — zwei Dokumente Klausel für Klausel abgleichen" },
      { type: "NEU", text: "Lieferanten-Benchmarking — Risiko-Übersicht aller analysierten Lieferanten" },
      { type: "NEU", text: "Umformulierungsvorschlaege für jedes Hochrisiko-Finding" },
      { type: "NEU", text: "Kündigungsfristen-Dashboard mit Ampel-System (rot/gelb/gruen)" },
      { type: "NEU", text: "Loesungsseite Einkauf & Beschaffung mit 6 Use Cases" },
      { type: "NEU", text: "9 Procurement-Prüfpunkte (Limitation of Liability, Indemnification, IP, etc.)" },
      { type: "NEU", text: "EN-Vertragstypen: Supplier Agreement, NDA English, MSA, Purchase Agreement" },
      { type: "NEU", text: "Compare-API (/api/compare) für Dokumentenvergleich" },
    ]
  },
  {
    version: "1.8.0",
    date: "06. April 2026",
    title: "Enterprise Plattform Komplett",
    changes: [
      { type: "NEU", text: "Persistente Workspace-Sidebar (wie Notion/Linear)" },
      { type: "NEU", text: "KI-Transparenz-Seite mit 3 Modellen und Datenfluss" },
      { type: "NEU", text: "Dynamisches OG-Image (Edge Runtime) für Social Sharing" },
      { type: "NEU", text: "Social Proof mit 3 Testimonials und 5 Trust Badges" },
      { type: "NEU", text: "6 funktionale Admin-Subpages (Members, Security, Policies, etc.)" },
      { type: "NEU", text: "Audit-Dashboard mit Event-Typ-Filtern" },
      { type: "NEU", text: "Profil-Seite mit E-Mail/Passwort-Änderung" },
      { type: "FIX", text: "Metadata für alle Tab-Titel ergaenzt" },
    ]
  },
  {
    version: "1.6.0",
    date: "05. April 2026",
    title: "Plattform-Ausbau & Compliance",
    changes: [
      { type: "NEU", text: "Trust Center mit 4 Saeulen, 6 Compliance-Badges, 7 Sub-Processors" },
      { type: "NEU", text: "Hilfe-Center mit Getting Started, Features, FAQ" },
      { type: "NEU", text: "Datenschutzerklärung (10 DSGVO-Sektionen)" },
      { type: "NEU", text: "AVV mit TOM und 8 Verarbeitungssektionen" },
      { type: "NEU", text: "JSON-LD Structured Data (Organization + SoftwareApplication)" },
      { type: "FIX", text: "contractType wird jetzt an Analyse-API gesendet" },
      { type: "FIX", text: "NextAuth debug-mode auf Development beschraenkt" },
    ]
  },
  {
    version: "1.4.0",
    date: "04. April 2026",
    title: "Workspace & Admin Upgrade",
    changes: [
      { type: "NEU", text: "Admin-Dashboard mit 11 klickbaren Eintraegen" },
      { type: "NEU", text: "Vertragstypen-Seite mit 8 Typen und BGB-Referenzen" },
      { type: "NEU", text: "Developer/API-Seite mit 12 Endpunkten und Webhook-Doku" },
      { type: "NEU", text: "Password-Reset Seite" },
      { type: "FIX", text: "Login-Seite mit SSO-Fehlerbehandlung" },
    ]
  },
  {
    version: "1.2.0",
    date: "03. April 2026",
    title: "Sicherheit & Compliance",
    changes: [
      { type: "NEU", text: "Sicherheit-Seite mit 6 Schutzschichten" },
      { type: "NEU", text: "Loesungen-Seiten für Kanzleien und Rechtsabteilungen" },
      { type: "NEU", text: "Release Notes (diese Seite)" },
    ]
  },
  {
    version: "1.0.0",
    date: "01. April 2026",
    title: "Enterprise MVP",
    changes: [
      { type: "NEU", text: "KI-Vertragsanalyse mit 3 Providern (Claude, GPT-4o, Gemini)" },
      { type: "NEU", text: "Contract Copilot mit SSE-Streaming" },
      { type: "NEU", text: "4 Export-Formate (PDF, JSON, CSV, DATEV)" },
      { type: "NEU", text: "NextAuth v5 mit JWT + Credentials Provider" },
      { type: "NEU", text: "Row-Level Security für Mandantentrennung" },
      { type: "NEU", text: "Stripe Billing Integration" },
    ]
  }
]

export default function ReleaseNotesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Changelog</p>
      <h1 className="mt-2 text-display text-gray-950">Release Notes</h1>
      <p className="mt-4 text-[16px] text-gray-500">Alle Änderungen und Verbesserungen an KanzleiAI.</p>

      <div className="mt-12 space-y-10">
        {releases.map((release) => (
          <div key={release.version} className="relative border-l-2 border-gray-200 pl-6">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white bg-[#003856]" />
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-semibold text-gray-900">v{release.version}</h2>
              {release.current && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">AKTUELL</span>}
              <span className="text-[13px] text-gray-400">{release.date}</span>
            </div>
            <p className="mt-1 text-[15px] font-medium text-gray-700">{release.title}</p>
            <div className="mt-4 space-y-2">
              {release.changes.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${c.type === "NEU" ? "bg-emerald-100 text-emerald-700" : c.type === "FIX" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{c.type}</span>
                  <p className="text-[13px] text-gray-600">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-gray-100 bg-gray-50 p-5 text-center">
        <p className="text-[14px] text-gray-600">Fragen oder Feature-Wuensche? <Link href="/enterprise-kontakt" className="font-medium text-[#003856]">Kontaktieren Sie uns →</Link></p>
      </div>
    </main>
  )
}
