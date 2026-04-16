/**
 * Regulatory Watchlist
 *
 * Kuratierte Liste aller für KanzleiAI-Kunden relevanten Regulierungen.
 * Mapping: CELEX-ID -> betroffene Vertragstypen + Klauseln.
 *
 * Diese Watchlist wird vom Vertragsradar genutzt, um:
 * 1. EUR-Lex regelmäßig auf Updates dieser Acts zu prüfen
 * 2. Bei Änderungen automatisch betroffene Verträge zu identifizieren
 * 3. Kunden mit konkreten Handlungsempfehlungen zu benachrichtigen
 */

import { ContractTypeId } from "@/lib/contract-types/registry"
import { KNOWN_CELEX, eurLexUrlForCelex } from "./eurlex-client"

export type RegulationCategory = "ai" | "data-protection" | "cybersecurity" | "supply-chain" | "tax-invoice" | "labor"

export interface WatchedRegulation {
  id: string
  celex: string
  shortName: string
  fullName: string
  category: RegulationCategory
  jurisdiction: "EU" | "DE" | "AT" | "CH"
  effectiveDate: string
  enforcementDate: string
  impactedContractTypes: ContractTypeId[]
  impactedClauses: string[]
  description: string
  source: "eur-lex" | "bgbl" | "manual"
  emoji: string
}

export const REGULATION_WATCHLIST: WatchedRegulation[] = [
  {
    id: "eu-ai-act",
    celex: KNOWN_CELEX.EU_AI_ACT,
    shortName: "EU AI Act",
    fullName: "Verordnung (EU) 2024/1689 — Künstliche Intelligenz",
    category: "ai",
    jurisdiction: "EU",
    effectiveDate: "2024-08-01",
    enforcementDate: "2026-08-02",
    impactedContractTypes: ["saas", "lieferantenvertrag", "msa", "supplier-agreement-en", "service-agreement-en"],
    impactedClauses: ["ai-transparency", "human-oversight", "high-risk-classification", "conformity-assessment"],
    description: "Verpflichtungen für Anbieter und Anwender von KI-Systemen. High-Risk-Systeme erfordern Transparenz, Dokumentation, Human Oversight (Art. 14).",
    source: "eur-lex",
    emoji: "🤖"
  },
  {
    id: "gdpr-2026",
    celex: KNOWN_CELEX.GDPR,
    shortName: "DSGVO Updates 2026",
    fullName: "Verordnung (EU) 2016/679 — DSGVO mit aktualisierten SCCs",
    category: "data-protection",
    jurisdiction: "EU",
    effectiveDate: "2018-05-25",
    enforcementDate: "2026-01-01",
    impactedContractTypes: ["avv", "saas", "msa", "service-agreement-en"],
    impactedClauses: ["data-processing-avv", "international-transfer", "subprocessors", "tom-measures"],
    description: "Aktualisierte Standardvertragsklauseln (SCCs) für internationale Datentransfers. AVV nach Art. 28 DSGVO bei jeder Auftragsverarbeitung.",
    source: "eur-lex",
    emoji: "🇪🇺"
  },
  {
    id: "nis2",
    celex: KNOWN_CELEX.NIS2,
    shortName: "NIS2",
    fullName: "Richtlinie (EU) 2022/2555 — Netz- und Informationssicherheit 2.0",
    category: "cybersecurity",
    jurisdiction: "EU",
    effectiveDate: "2024-10-18",
    enforcementDate: "2024-10-18",
    impactedContractTypes: ["saas", "lieferantenvertrag", "rahmenvertrag", "supplier-agreement-en"],
    impactedClauses: ["cybersecurity", "incident-reporting", "supply-chain-security", "audit-rights"],
    description: "Cybersecurity-Anforderungen in der Lieferkette für betroffene Sektoren. Art. 21 verpflichtet zu Incident Reporting binnen 24h.",
    source: "eur-lex",
    emoji: "🛡️"
  },
  {
    id: "dora",
    celex: KNOWN_CELEX.DORA,
    shortName: "DORA",
    fullName: "Verordnung (EU) 2022/2554 — Digital Operational Resilience Act",
    category: "cybersecurity",
    jurisdiction: "EU",
    effectiveDate: "2025-01-17",
    enforcementDate: "2025-01-17",
    impactedContractTypes: ["saas", "lieferantenvertrag", "msa"],
    impactedClauses: ["ict-third-party-risk", "incident-reporting", "exit-strategy", "audit-rights"],
    description: "ICT-Risikomanagement für Finanzunternehmen. Verträge mit ICT-Dienstleistern müssen Art. 30-Pflichten enthalten.",
    source: "eur-lex",
    emoji: "🏦"
  },
  {
    id: "lksg",
    celex: KNOWN_CELEX.LIEFERKETTEN_DE,
    shortName: "LkSG",
    fullName: "Lieferkettensorgfaltspflichtengesetz",
    category: "supply-chain",
    jurisdiction: "DE",
    effectiveDate: "2023-01-01",
    enforcementDate: "2024-01-01",
    impactedContractTypes: ["lieferantenvertrag", "rahmenvertrag", "supplier-agreement-en"],
    impactedClauses: ["human-rights", "environmental", "code-of-conduct", "audit-rights", "termination-rights"],
    description: "Sorgfaltspflichten in der Lieferkette für Unternehmen ab 1.000 Mitarbeitern. Menschenrechts- und Umweltklauseln verpflichtend.",
    source: "manual",
    emoji: "🔗"
  },
  {
    id: "e-rechnung-de",
    celex: "BJNR187110009",
    shortName: "E-Rechnungspflicht B2B",
    fullName: "Wachstumschancengesetz — § 14 UStG E-Rechnung",
    category: "tax-invoice",
    jurisdiction: "DE",
    effectiveDate: "2025-01-01",
    enforcementDate: "2027-01-01",
    impactedContractTypes: ["lieferantenvertrag", "rahmenvertrag", "dienstleistungsvertrag", "msa"],
    impactedClauses: ["invoice-format", "payment-terms", "billing-cycle"],
    description: "Verpflichtende elektronische Rechnungsstellung im B2B-Verkehr ab 2027. Vertragsklauseln zu Rechnungsformat anpassen (XRechnung/ZUGFeRD).",
    source: "manual",
    emoji: "🧾"
  }
]

export function getWatchedRegulation(id: string): WatchedRegulation | undefined {
  return REGULATION_WATCHLIST.find(r => r.id === id)
}

export function getWatchedRegulationsByContractType(typeId: ContractTypeId): WatchedRegulation[] {
  return REGULATION_WATCHLIST.filter(r => r.impactedContractTypes.includes(typeId))
}

export function getRegulationLink(reg: WatchedRegulation): string {
  if (reg.source === "eur-lex" && reg.celex) {
    return eurLexUrlForCelex(reg.celex, "DE")
  }
  if (reg.source === "bgbl" || reg.source === "manual") {
    return `https://www.gesetze-im-internet.de/bundesrecht/${reg.id}/gesamt.pdf`
  }
  return ""
}
