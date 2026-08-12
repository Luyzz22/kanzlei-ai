#!/usr/bin/env node
/**
 * Drift-Schutz für die Deny-Listen.
 *
 * Dieselben hochsensiblen Begriffe existieren zweimal: in
 * `redaction_pipeline/deny_terms.py` (Python-Pipeline) und in
 * `src/lib/compliance/detectors.ts` (Laufzeit der App). Zwei Kopien einer
 * sicherheitskritischen Liste laufen ohne Zwang auseinander — und die
 * Abweichung fällt niemandem auf, weil beide Seiten für sich grün bleiben.
 *
 * Dieser Guard vergleicht beide Listen und schlägt bei jeder Differenz fehl.
 * Er prüft ausserdem, dass die Detektor-Versionen übereinstimmen: eine
 * geänderte Liste ohne Versionssprung wäre im Audit nicht nachvollziehbar.
 */
import { readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const failures = []

function fail(message) {
  failures.push(message)
  console.error(`not ok - ${message}`)
}

function pass(message) {
  console.log(`ok - ${message}`)
}

/** Liest ein Python-Tupel `NAME: tuple[str, ...] = ( "a", "b", )`. */
function parsePythonTuple(source, name) {
  const start = source.indexOf(`${name}:`)
  if (start === -1) return null
  const open = source.indexOf("(", start)
  const close = source.indexOf(")", open)
  if (open === -1 || close === -1) return null
  return [...source.slice(open + 1, close).matchAll(/"([^"]+)"/g)].map((m) => m[1])
}

/** Liest ein TS-Array `export const NAME = [ "a", "b" ] as const`. */
function parseTsArray(source, name) {
  const start = source.indexOf(`export const ${name} =`)
  if (start === -1) return null
  const open = source.indexOf("[", start)
  const close = source.indexOf("]", open)
  if (open === -1 || close === -1) return null
  return [...source.slice(open + 1, close).matchAll(/"([^"]+)"/g)].map((m) => m[1])
}

/** Liest `KEY: "1.2.0"` aus einem TS-Objekt bzw. Python-Dict. */
function parseVersions(source, keys) {
  const out = {}
  for (const key of keys) {
    const m = new RegExp(`["']?${key}["']?\\s*:\\s*["']([\\d.]+)["']`).exec(source)
    if (m) out[key] = m[1]
  }
  return out
}

function compareLists(label, pythonList, tsList) {
  if (!pythonList) return fail(`${label}: Liste in deny_terms.py nicht gefunden`)
  if (!tsList) return fail(`${label}: Liste in detectors.ts nicht gefunden`)

  const inPython = new Set(pythonList)
  const inTs = new Set(tsList)
  const onlyPython = pythonList.filter((t) => !inTs.has(t))
  const onlyTs = tsList.filter((t) => !inPython.has(t))

  if (onlyPython.length > 0) {
    fail(`${label}: ${onlyPython.length} Begriff(e) nur in deny_terms.py — fehlen in detectors.ts`)
  }
  if (onlyTs.length > 0) {
    fail(`${label}: ${onlyTs.length} Begriff(e) nur in detectors.ts — fehlen in deny_terms.py`)
  }
  if (onlyPython.length === 0 && onlyTs.length === 0) {
    pass(`${label}: ${pythonList.length} Begriffe identisch in beiden Implementierungen`)
  }
}

async function main() {
  const py = await readFile(path.join(root, "redaction_pipeline/deny_terms.py"), "utf8")
  const ts = await readFile(path.join(root, "src/lib/compliance/detectors.ts"), "utf8")
  const cfg = await readFile(path.join(root, "redaction_pipeline/config.py"), "utf8")

  compareLists("HEALTH_TERMS", parsePythonTuple(py, "HEALTH_TERMS"), parseTsArray(ts, "HEALTH_TERMS"))
  compareLists("MANDATE_TERMS", parsePythonTuple(py, "MANDATE_TERMS"), parseTsArray(ts, "MANDATE_TERMS"))

  const keys = ["pii_regex", "health_terms", "mandate_terms", "ner_persons_orgs"]
  const pyVersions = parseVersions(cfg, keys)
  const tsVersions = parseVersions(ts, keys)

  for (const key of keys) {
    if (!pyVersions[key]) {
      fail(`Detektor-Version "${key}" fehlt in redaction_pipeline/config.py`)
      continue
    }
    if (!tsVersions[key]) {
      fail(`Detektor-Version "${key}" fehlt in src/lib/compliance/detectors.ts`)
      continue
    }
    if (pyVersions[key] !== tsVersions[key]) {
      fail(
        `Detektor-Version "${key}" weicht ab: config.py=${pyVersions[key]}, ` +
          `detectors.ts=${tsVersions[key]}. Geänderte Listen brauchen auf beiden ` +
          `Seiten denselben Versionssprung, sonst ist das Audit nicht nachvollziehbar.`
      )
    }
  }

  if (failures.length === 0) {
    pass(`Detektor-Versionen identisch (${keys.length} Einträge)`)
  }
}

await main()

if (failures.length > 0) {
  console.error(`\n${failures.length} Abweichung(en) zwischen Python- und TS-Deny-Listen.`)
  process.exit(1)
}

console.log("\nDeny-Listen synchron.")
