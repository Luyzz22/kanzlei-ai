import "server-only"

import { prisma } from "@/lib/prisma"
import { getGoldenSetSpec } from "./golden-set-specs"

const SEV_RANK: Record<string, number> = {
  NIEDRIG: 1, niedrig: 1,
  MITTEL: 2, mittel: 2,
  HOCH: 3, hoch: 3
}

export type RequiredFindingResult = {
  keyword: string
  found: boolean
  actualTitle?: string
  expectedSeverity: string
  actualSeverity?: string
  severityMatch: boolean
  module?: string
}

export type EvalResult = {
  goldenSetId: string
  goldenSetName: string
  passed: boolean
  score: number
  details: {
    findingCount: { expected: string; actual: number; pass: boolean }
    highFindings: { expected: number; actual: number; pass: boolean }
    riskScore: { expected: string; actual: number | null; pass: boolean }
    requiredFindings: RequiredFindingResult[]
    requiredRiskNatures: Array<{ nature: string; found: boolean }>
    classification: { pass: boolean; expected: string; actual: string }
  }
}

export async function evaluateAnalysisRun(
  analysisRunId: string,
  goldenSetId: string
): Promise<EvalResult> {
  const spec = getGoldenSetSpec(goldenSetId)
  if (!spec) throw new Error(`Golden Set nicht gefunden: ${goldenSetId}`)

  const run = await prisma.analysisRun.findUnique({
    where: { id: analysisRunId },
    select: {
      id: true,
      riskScore01: true,
      contractClassification: true,
      agbKontrolleAnwendbar: true,
      findings: {
        select: { title: true, description: true, severity: true, riskNature: true }
      }
    }
  })
  if (!run) throw new Error(`AnalysisRun nicht gefunden: ${analysisRunId}`)

  const ex = spec.expectations
  const findings = run.findings

  // ── Finding count ─────────────────────────────────────────────────
  const actualCount = findings.length
  const countPass = actualCount >= ex.minFindings && actualCount <= ex.maxFindings

  // ── High-severity findings ─────────────────────────────────────────
  const highCount = findings.filter((f) => f.severity === "HOCH").length
  const highPass = highCount >= ex.minHighFindings

  // ── Risk score ────────────────────────────────────────────────────
  const rs = run.riskScore01
  const [rsMin, rsMax] = ex.riskScoreRange
  const riskPass = rs != null && rs >= rsMin && rs <= rsMax

  // ── Required findings (keyword match in title + description) ───────
  const requiredResults: RequiredFindingResult[] = ex.requiredFindings.map((rf) => {
    const kw = rf.keyword.toLowerCase()
    const match = findings.find(
      (f) =>
        f.title.toLowerCase().includes(kw) ||
        f.description.toLowerCase().includes(kw)
    )
    const found = !!match
    const actualSeverity = match ? String(match.severity) : undefined
    const severityMatch = found
      ? (SEV_RANK[actualSeverity ?? ""] ?? 0) === (SEV_RANK[rf.severity] ?? 0)
      : false
    return {
      keyword: rf.keyword,
      found,
      actualTitle: match?.title,
      expectedSeverity: rf.severity,
      actualSeverity,
      severityMatch,
      module: rf.module
    }
  })

  // ── Required risk natures ─────────────────────────────────────────
  const presentNatures = new Set(findings.map((f) => f.riskNature).filter(Boolean))
  const riskNatureResults = ex.requiredRiskNatures.map((nature) => ({
    nature,
    found: presentNatures.has(nature)
  }))

  // ── Classification ────────────────────────────────────────────────
  const expClass = ex.classificationExpected
  const classMatch =
    (run.contractClassification ?? "").toLowerCase() === expClass.contractClassification.toLowerCase() &&
    run.agbKontrolleAnwendbar === expClass.agbKontrolleAnwendbar
  const actualClassStr = `${run.contractClassification ?? "—"}, AGB=${run.agbKontrolleAnwendbar}`
  const expClassStr = `${expClass.contractClassification}, AGB=${expClass.agbKontrolleAnwendbar}`

  // ── Score (0-100 normalized) ──────────────────────────────────────
  // Fixed points: riskScore(10) + count(10) + classification(10) = 30
  // Per required finding: 5 pts each
  const fixedMax = 30
  const findingPts = requiredResults.filter((r) => r.found).length * 5
  const findingMax = ex.requiredFindings.length * 5
  const totalMax = fixedMax + findingMax
  const rawScore =
    (riskPass ? 10 : 0) + (countPass ? 10 : 0) + (classMatch ? 10 : 0) + findingPts
  const score = totalMax > 0 ? Math.round((rawScore / totalMax) * 100) : 0

  const passed = score >= 70

  return {
    goldenSetId: spec.id,
    goldenSetName: spec.name,
    passed,
    score,
    details: {
      findingCount: {
        expected: `${ex.minFindings}–${ex.maxFindings}`,
        actual: actualCount,
        pass: countPass
      },
      highFindings: {
        expected: ex.minHighFindings,
        actual: highCount,
        pass: highPass
      },
      riskScore: {
        expected: `${rsMin}–${rsMax}`,
        actual: rs,
        pass: riskPass
      },
      requiredFindings: requiredResults,
      requiredRiskNatures: riskNatureResults,
      classification: { pass: classMatch, expected: expClassStr, actual: actualClassStr }
    }
  }
}
