/**
 * EUR-Lex CELLAR SPARQL Client
 *
 * Production client für den öffentlichen SPARQL-Endpoint der EU-Publications-Office.
 * Quelle: https://publications.europa.eu/webapi/rdf/sparql
 *
 * Liefert reale Regulierungsdaten für den Vertragsradar:
 * - Aktuelle Verordnungen (Regulations) und Richtlinien (Directives)
 * - Updates zu bestehenden Rechtsakten (z.B. EU AI Act Amendments)
 * - CELEX-IDs für eindeutige Referenzierung
 *
 * Rate Limits (per Polzia.com / EUR-Lex Docs):
 * - 60s Query-Timeout
 * - Max ~5 concurrent connections per IP
 * - LIMIT/OFFSET für Pagination zwingend
 *
 * Caching-Strategie:
 * - Metadata ändert sich nach Publikation selten — local cache
 * - Pillar-IV-Atom-Feed signalisiert Modifikationen (nicht in v1)
 * - Re-Sync via Cron (täglich 03:00 Europe/Berlin)
 */

const SPARQL_ENDPOINT = "https://publications.europa.eu/webapi/rdf/sparql"
const USER_AGENT = "KanzleiAI-Vertragsradar/1.0 (+https://www.kanzlei-ai.com)"
const QUERY_TIMEOUT_MS = 30_000

export type EurLexResource = "regulation" | "directive" | "decision" | "any"

export interface EurLexDocument {
  celex: string
  uri: string
  title: string
  date: string
  type: EurLexResource
  inForce: boolean
  eurLexUrl: string
}

export interface SparqlBinding {
  type: string
  value: string
}

export interface SparqlResult {
  head: { vars: string[] }
  results: { bindings: Record<string, SparqlBinding>[] }
}

/**
 * Build SPARQL query for recent EU legal acts of a given type.
 * Returns CELEX-IDs, titles (DE preferred, EN fallback), publication dates.
 */
export function buildRecentActsQuery(opts: {
  type: EurLexResource
  sinceDate: string // ISO date e.g. "2025-01-01"
  limit?: number
}): string {
  const { type, sinceDate, limit = 50 } = opts

  const typeFilter = type === "any" ? "" : `
    FILTER(?resourceType = <http://publications.europa.eu/resource/authority/resource-type/${type === "regulation" ? "REG" : type === "directive" ? "DIR" : "DEC"}>)
  `

  return `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT DISTINCT ?work ?celex ?titleDe ?titleEn ?date ?resourceType
    WHERE {
      ?work cdm:work_has_resource-type ?resourceType .
      ?work cdm:resource_legal_id_celex ?celex .
      ?work cdm:work_date_document ?date .

      OPTIONAL {
        ?expression cdm:expression_belongs_to_work ?work .
        ?expression cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/DEU> .
        ?expression cdm:expression_title ?titleDe .
      }
      OPTIONAL {
        ?expressionEn cdm:expression_belongs_to_work ?work .
        ?expressionEn cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
        ?expressionEn cdm:expression_title ?titleEn .
      }

      ${typeFilter}

      FILTER(?date >= "${sinceDate}"^^xsd:date)
      FILTER NOT EXISTS { ?work cdm:work_has_resource-type <http://publications.europa.eu/resource/authority/resource-type/CORRIGENDUM> }
      FILTER NOT EXISTS { ?work cdm:do_not_index "true"^^xsd:boolean }
    }
    ORDER BY DESC(?date)
    LIMIT ${limit}
  `.trim()
}

/**
 * Execute SPARQL query against CELLAR.
 * Returns raw JSON bindings for downstream parsing.
 */
export async function runSparqlQuery(query: string): Promise<SparqlResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)

  try {
    const res = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/sparql-results+json",
        "User-Agent": USER_AGENT,
      },
      body: new URLSearchParams({ query, format: "application/sparql-results+json" }),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`EUR-Lex SPARQL ${res.status}: ${res.statusText}`)
    }

    return await res.json() as SparqlResult
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetch recent EU legal acts since a given date.
 * Combines query building + execution + parsing into one call.
 */
export async function fetchRecentActs(opts: {
  type: EurLexResource
  sinceDate: string
  limit?: number
}): Promise<EurLexDocument[]> {
  const query = buildRecentActsQuery(opts)
  const result = await runSparqlQuery(query)

  return result.results.bindings.map((b) => {
    const celex = b.celex?.value ?? ""
    const title = b.titleDe?.value ?? b.titleEn?.value ?? "(no title)"
    return {
      celex,
      uri: b.work?.value ?? "",
      title,
      date: b.date?.value ?? "",
      type: opts.type,
      inForce: true, // SPARQL filter excludes corrigenda; in-force status requires LRI lookup
      eurLexUrl: celex ? `https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${celex}` : "",
    }
  }).filter(d => d.celex) // skip rows without CELEX
}

/**
 * Convenience: fetch a known regulation by CELEX-ID.
 * Used for known regulations like 32024R1689 (EU AI Act).
 */
export const KNOWN_CELEX = {
  EU_AI_ACT: "32024R1689",
  GDPR: "32016R0679",
  NIS2: "32022L2555",
  DORA: "32022R2554",
  LIEFERKETTEN_DE: "BJNR295910021",
} as const

export function eurLexUrlForCelex(celex: string, lang: "DE" | "EN" = "DE"): string {
  return `https://eur-lex.europa.eu/legal-content/${lang}/TXT/?uri=CELEX:${celex}`
}
