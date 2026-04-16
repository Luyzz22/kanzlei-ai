/**
 * Fallback Clause Library (Modul 3)
 * 
 * Enterprise-standard replacement clauses for missing or deficient provisions.
 * When the analyzer flags a problem, it can offer a concrete drop-in fix.
 * 
 * All clauses are general templates. Final legal review is required.
 */

export interface FallbackClause {
  id: string
  forContractType: string[]   // ["nda", "saas", "avv"]
  forFinding: string           // The finding ID this fixes
  title: string
  shortDesc: string
  language: "de" | "en"
  text: string
  citation: string  // Legal basis
  marketTier: "minimum" | "standard" | "premium"  // Negotiation positioning
}

export const FALLBACK_CLAUSES: FallbackClause[] = [
  // =====================================================================
  // NDA Clauses
  // =====================================================================
  {
    id: "nda-injunctive-relief-en",
    forContractType: ["nda"],
    forFinding: "missing_injunctive_relief",
    title: "Injunctive / Equitable Relief",
    shortDesc: "Allows immediate court action without proving monetary damages",
    language: "en",
    text: `The parties acknowledge that any breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages would be inadequate. Accordingly, the Disclosing Party shall be entitled to seek injunctive relief, specific performance, and other equitable remedies, in addition to all other remedies available at law or in equity, without the necessity of posting bond or proving actual damages.`,
    citation: "Standard market clause; recognized in civil and common law jurisdictions",
    marketTier: "standard",
  },
  {
    id: "nda-residuals-en",
    forContractType: ["nda"],
    forFinding: "missing_residuals_clause",
    title: "Residuals Clause",
    shortDesc: "Permits use of general knowledge retained in employees' memory",
    language: "en",
    text: `The Receiving Party may use any general ideas, concepts, know-how, methodologies, processes, or techniques retained in the unaided memory of its personnel ("Residuals") that derive from access to Confidential Information, provided such use does not involve the disclosure of specific Confidential Information or any infringement of intellectual property rights of the Disclosing Party.`,
    citation: "Standard tech industry clause (esp. for B2B SaaS engagements)",
    marketTier: "standard",
  },
  {
    id: "nda-non-solicitation-en",
    forContractType: ["nda"],
    forFinding: "missing_non_solicitation",
    title: "Non-Solicitation",
    shortDesc: "Prevents poaching of employees during evaluation period",
    language: "en",
    text: `For a period of twelve (12) months following the date of disclosure of any Confidential Information, neither party shall, directly or indirectly, solicit for employment or hire any employee of the other party with whom it had contact through the activities contemplated by this Agreement, provided that this restriction shall not apply to (i) general public solicitations not specifically targeted at such employees, or (ii) responses to applications initiated by the employee.`,
    citation: "Standard tech NDA clause; enforceable in most EU jurisdictions",
    marketTier: "standard",
  },
  {
    id: "nda-no-obligation-en",
    forContractType: ["nda"],
    forFinding: "missing_no_obligation_clause",
    title: "No Obligation to Proceed",
    shortDesc: "Clarifies the NDA does not create a binding business commitment",
    language: "en",
    text: `Nothing in this Agreement shall be construed as creating any obligation on either party to enter into any business transaction or commercial arrangement. Each party retains the absolute right to determine, in its sole discretion, whether to proceed with any further discussions or to enter into any subsequent agreement with the other party.`,
    citation: "Standard market clause; reduces risk of implied contract claims",
    marketTier: "minimum",
  },
  {
    id: "nda-compelled-disclosure-en",
    forContractType: ["nda"],
    forFinding: "missing_compelled_disclosure_procedure",
    title: "Compelled Disclosure Procedure",
    shortDesc: "Procedure when government / court demands disclosure",
    language: "en",
    text: `If the Receiving Party is required by law, court order, or governmental authority to disclose any Confidential Information, it shall (i) promptly notify the Disclosing Party in writing prior to any such disclosure, where legally permissible, (ii) cooperate with the Disclosing Party in any effort to limit the scope of such disclosure or to seek a protective order, and (iii) disclose only that portion of the Confidential Information legally required to be disclosed.`,
    citation: "Best practice; aligned with international discovery procedures",
    marketTier: "standard",
  },

  // =====================================================================
  // SaaS Clauses
  // =====================================================================
  {
    id: "saas-liability-cap-de",
    forContractType: ["saas"],
    forFinding: "missing_liability_cap",
    title: "Haftungsbegrenzung",
    shortDesc: "Standard-Haftungsbegrenzung auf 12 Monate Vergütung",
    language: "de",
    text: `Die Gesamthaftung des Anbieters fuer alle Schaeden aus oder in Zusammenhang mit diesem Vertrag, gleich aus welchem Rechtsgrund, ist auf einen Betrag in Hoehe der vom Kunden in den letzten zwoelf (12) Monaten vor dem schadensauslosenden Ereignis tatsaechlich gezahlten Vertragsverguetung begrenzt. Diese Haftungsbegrenzung gilt nicht fuer Schaeden aus Vorsatz oder grober Fahrlaessigkeit, fuer Verletzungen von Leben, Koerper oder Gesundheit sowie fuer Anspruechen nach dem Produkthaftungsgesetz.`,
    citation: "BGB §§ 309 Nr. 7, 444; AGB-rechtskonform fuer B2B-Vertraege",
    marketTier: "standard",
  },
  {
    id: "saas-avv-reference-de",
    forContractType: ["saas"],
    forFinding: "missing_avv",
    title: "Auftragsverarbeitung (DSGVO Art. 28)",
    shortDesc: "Verweis auf separaten AVV mit allen Pflichtangaben",
    language: "de",
    text: `Soweit der Anbieter im Rahmen der Leistungserbringung personenbezogene Daten im Auftrag des Kunden im Sinne von Art. 28 DSGVO verarbeitet, gilt der als Anlage X beigefuegte Auftragsverarbeitungsvertrag (AVV). Der AVV regelt insbesondere Gegenstand und Dauer der Verarbeitung, Art und Zweck der Verarbeitung, Art der personenbezogenen Daten, Kategorien betroffener Personen sowie die Rechte und Pflichten beider Parteien gemaess DSGVO Art. 28 Abs. 3.`,
    citation: "DSGVO Art. 28 Abs. 3; Pflichtklausel bei jeder Datenverarbeitung",
    marketTier: "minimum",
  },
  {
    id: "saas-data-return-de",
    forContractType: ["saas"],
    forFinding: "missing_data_return_clause",
    title: "Datenrueckgabe / Loeschung nach Vertragsende",
    shortDesc: "Garantierte Datenextraktion und sichere Loeschung",
    language: "de",
    text: `Nach Vertragsbeendigung stellt der Anbieter dem Kunden alle gespeicherten Daten in einem strukturierten, gaengigen und maschinenlesbaren Format (z.B. CSV, JSON, XML) fuer einen Zeitraum von dreissig (30) Tagen zum Export bereit. Nach Ablauf dieser Frist loescht der Anbieter alle Kundendaten unwiderruflich, einschliesslich aller Backups, innerhalb von neunzig (90) Tagen. Der Anbieter bestaetigt die vollstaendige Loeschung schriftlich gegenueber dem Kunden.`,
    citation: "DSGVO Art. 17, 20; Marktstandard fuer Enterprise-SaaS",
    marketTier: "standard",
  },
  {
    id: "saas-eu-data-residency-de",
    forContractType: ["saas"],
    forFinding: "non_eu_data_without_sccs",
    title: "EU-Datenstandort und Standardvertragsklauseln",
    shortDesc: "EU-Hosting + SCC-Verweis bei Drittlandtransfers",
    language: "de",
    text: `Der Anbieter verarbeitet und speichert alle personenbezogenen Daten des Kunden ausschliesslich auf Servern innerhalb der Europaeischen Union oder des Europaeischen Wirtschaftsraums. Sollte im Einzelfall ein Transfer in ein Drittland erforderlich werden, geschieht dies ausschliesslich auf Basis der Standardvertragsklauseln (SCCs) der Europaeischen Kommission gemaess Durchfuehrungsbeschluss (EU) 2021/914 in der jeweils aktuellen Fassung sowie unter Implementierung geeigneter zusaetzlicher Schutzmassnahmen gemaess EuGH-Urteil "Schrems II".`,
    citation: "DSGVO Kap. V; EuGH C-311/18 (Schrems II); SCC 2021/914",
    marketTier: "premium",
  },
  {
    id: "saas-uptime-sla-de",
    forContractType: ["saas"],
    forFinding: "missing_sla",
    title: "Service Level Agreement (Verfuegbarkeit)",
    shortDesc: "99,5% Verfuegbarkeit mit Service-Credits",
    language: "de",
    text: `Der Anbieter garantiert eine monatliche Verfuegbarkeit der Software von mindestens 99,5% (gemessen pro Kalendermonat, exklusive geplanter Wartungsfenster und hoeherer Gewalt). Bei Unterschreitung erhaelt der Kunde Service-Credits in folgender Hoehe: bei 99,0% bis 99,49% Verfuegbarkeit 10% der Monatsverguetung, bei 95,0% bis 98,99% Verfuegbarkeit 25% der Monatsverguetung, unter 95,0% Verfuegbarkeit 50% der Monatsverguetung. Geplante Wartungsfenster werden mindestens 48 Stunden im Voraus angekuendigt und ausserhalb der Geschaeftszeiten (08:00-20:00 MEZ) durchgefuehrt.`,
    citation: "Marktstandard fuer Business-Tier SaaS; vergleichbar AWS/Azure",
    marketTier: "standard",
  },

  // =====================================================================
  // AVV Clauses
  // =====================================================================
  {
    id: "avv-tom-de",
    forContractType: ["avv"],
    forFinding: "missing_tom",
    title: "Technische und organisatorische Massnahmen (TOM)",
    shortDesc: "TOM-Verweis nach DSGVO Art. 32",
    language: "de",
    text: `Der Auftragsverarbeiter trifft technische und organisatorische Massnahmen zur Gewaehrleistung eines dem Risiko angemessenen Schutzniveaus gemaess Art. 32 DSGVO. Diese Massnahmen umfassen insbesondere: (a) Pseudonymisierung und Verschluesselung personenbezogener Daten (mindestens TLS 1.3 fuer Transport, AES-256 fuer Speicherung), (b) Sicherstellung der Vertraulichkeit, Integritaet, Verfuegbarkeit und Belastbarkeit der Verarbeitungssysteme auf Dauer, (c) Wiederherstellbarkeit nach physischen oder technischen Zwischenfaellen, (d) Verfahren zur regelmaessigen Ueberpruefung, Bewertung und Evaluierung der Wirksamkeit. Die im Detail umgesetzten Massnahmen sind in Anlage Y dokumentiert und werden mindestens jaehrlich aktualisiert.`,
    citation: "DSGVO Art. 32; ISO/IEC 27001",
    marketTier: "premium",
  },
  {
    id: "avv-breach-notification-de",
    forContractType: ["avv"],
    forFinding: "missing_breach_notification",
    title: "Meldepflichten bei Datenpannen",
    shortDesc: "24-Stunden-Frist fuer Breach-Notifications",
    language: "de",
    text: `Der Auftragsverarbeiter informiert den Verantwortlichen unverzueglich, spaetestens jedoch innerhalb von vierundzwanzig (24) Stunden nach Kenntniserlangung, ueber jede Verletzung des Schutzes personenbezogener Daten im Sinne von Art. 4 Nr. 12 DSGVO. Die Meldung enthaelt mindestens: (a) eine Beschreibung der Art der Verletzung, (b) die betroffenen Datenkategorien und Anzahl der Betroffenen, (c) wahrscheinliche Folgen, (d) ergriffene oder geplante Massnahmen zur Eindaemmung. Der Auftragsverarbeiter unterstuetzt den Verantwortlichen bei dessen Meldepflichten gemaess Art. 33, 34 DSGVO.`,
    citation: "DSGVO Art. 33, 34",
    marketTier: "standard",
  },
]

export function findFallbackClauses(contractType: string, findingId?: string): FallbackClause[] {
  return FALLBACK_CLAUSES.filter(c => {
    const typeMatch = c.forContractType.includes(contractType.toLowerCase())
    const findingMatch = !findingId || c.forFinding === findingId
    return typeMatch && findingMatch
  })
}
