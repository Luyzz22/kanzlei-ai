/**
 * KanzleiAI — E-Mail-Benachrichtigung bei Analyse-Abschluss
 *
 * Sendet eine Enterprise-HTML-Mail an den Benutzer, wenn seine
 * KI-Vertragsanalyse abgeschlossen ist. Verwendet Resend als
 * Transportschicht (Sender: ki@sbsdeutschland.de).
 *
 * Aufruf: fire-and-forget nach Pipeline-Completion in analysis-run-core.ts.
 * Fehler werden geloggt, brechen aber nie den Hauptprozess ab.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails"
const SENDER = "KanzleiAI <ki@sbsdeutschland.de>"
const BASE_URL = "https://www.kanzlei-ai.com"

// SBS Brand Colors
const SBS_BLUE = "#003856"

export type AnalysisNotificationInput = {
  recipientEmail: string
  recipientName: string | null
  documentId: string
  documentTitle: string
  riskScore01: number | null
  findingsCount: number
  highFindings: number
  mediumFindings: number
  lowFindings: number
  primaryModel: string | null
  durationMs: number | null
  contractClassification: string | null
}

function riskLabel(score: number): { text: string; color: string; bgColor: string } {
  if (score >= 0.7) return { text: "Hoch", color: "#DC2626", bgColor: "#FEF2F2" }
  if (score >= 0.4) return { text: "Mittel", color: "#D97706", bgColor: "#FFFBEB" }
  return { text: "Niedrig", color: "#059669", bgColor: "#ECFDF5" }
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function buildHtml(input: AnalysisNotificationInput): string {
  const greeting = input.recipientName ? input.recipientName : "Nutzer"
  const riskPct = input.riskScore01 != null ? Math.round(input.riskScore01 * 100) : null
  const risk = input.riskScore01 != null ? riskLabel(input.riskScore01) : null
  const docUrl = `${BASE_URL}/workspace/dokumente/${input.documentId}`

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F6F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:32px 16px;">

  <!-- Header -->
  <div style="background:${SBS_BLUE};border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">
      \u2699\uFE0F KanzleiAI
    </h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">
      Vertragsanalyse abgeschlossen
    </p>
  </div>

  <!-- Body -->
  <div style="background:#FFFFFF;padding:32px;border-left:1px solid #E5E2DE;border-right:1px solid #E5E2DE;">
    <p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;line-height:1.6;">
      Hallo ${greeting},
    </p>
    <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
      Ihre KI-Vertragsanalyse f\u00fcr das folgende Dokument wurde erfolgreich abgeschlossen
      und steht zur fachlichen Pr\u00fcfung bereit.
    </p>

    <!-- Document Card -->
    <div style="background:#F8F6F3;border:1px solid #E5E2DE;border-radius:10px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;font-weight:600;">
        Dokument
      </p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#1a1a1a;">
        ${input.documentTitle}
      </p>
      ${input.contractClassification ? `<p style="margin:0;font-size:12px;color:#666;">Vertragstyp: <strong>${input.contractClassification}</strong></p>` : ""}
    </div>

    <!-- Risk Score -->
    ${riskPct != null && risk ? `
    <div style="background:${risk.bgColor};border-radius:10px;padding:16px 20px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;font-weight:600;">
        Risiko-Score
      </p>
      <p style="margin:0;font-size:32px;font-weight:700;color:${risk.color};">
        ${riskPct}%
      </p>
      <p style="margin:4px 0 0;font-size:12px;color:${risk.color};font-weight:600;">
        ${risk.text}
      </p>
    </div>
    ` : ""}

    <!-- Findings Summary -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:13px;color:#555;">Findings gesamt</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:14px;font-weight:600;color:#1a1a1a;text-align:right;">${input.findingsCount}</td>
      </tr>
      ${input.highFindings > 0 ? `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:13px;color:#DC2626;">
          \u25CF Hoch
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:14px;font-weight:600;color:#DC2626;text-align:right;">${input.highFindings}</td>
      </tr>
      ` : ""}
      ${input.mediumFindings > 0 ? `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:13px;color:#D97706;">
          \u25CF Mittel
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:14px;font-weight:600;color:#D97706;text-align:right;">${input.mediumFindings}</td>
      </tr>
      ` : ""}
      ${input.lowFindings > 0 ? `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:13px;color:#666;">
          \u25CF Niedrig
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:14px;font-weight:600;color:#666;text-align:right;">${input.lowFindings}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:#888;">Dauer</td>
        <td style="padding:10px 12px;font-size:13px;color:#888;text-align:right;">${formatDuration(input.durationMs)}</td>
      </tr>
    </table>

    <!-- CTA Button -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${docUrl}" style="display:inline-block;background:${SBS_BLUE};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
        Ergebnisse pr\u00fcfen \u2192
      </a>
    </div>

    <!-- BRAO Notice -->
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;">
      <p style="margin:0;font-size:11px;color:#92400E;line-height:1.5;">
        <strong>\u2696\uFE0F BRAO \u00A7 43a:</strong> Diese KI-Analyse ist ein Arbeitshilfsmittel.
        Die rechtliche Einsch\u00e4tzung verbleibt beim bearbeitenden Rechtsanwalt.
        Alle Findings sind vor Verwendung fachlich zu pr\u00fcfen.
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#F0EDE8;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;border-left:1px solid #E5E2DE;border-right:1px solid #E5E2DE;border-bottom:1px solid #E5E2DE;">
    <p style="margin:0 0 4px;font-size:12px;color:#888;">
      SBS Deutschland GmbH &amp; Co. KG \u00B7 Weinheim
    </p>
    <p style="margin:0;font-size:11px;color:#aaa;">
      <a href="${BASE_URL}/datenschutz" style="color:#888;text-decoration:underline;">Datenschutz</a>
      \u00A0\u00B7\u00A0
      <a href="${BASE_URL}/impressum" style="color:#888;text-decoration:underline;">Impressum</a>
      \u00A0\u00B7\u00A0
      <a href="${BASE_URL}/trust-center" style="color:#888;text-decoration:underline;">Trust Center</a>
    </p>
  </div>

</div>
</body>
</html>`
}

/**
 * Sendet eine Analyse-Abschluss-Benachrichtigung per E-Mail.
 *
 * Best-effort: wirft nie, loggt Fehler. Aufruf ohne await möglich.
 */
export async function sendAnalysisCompleteNotification(
  input: AnalysisNotificationInput
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn("[email.analysis_complete] RESEND_API_KEY nicht konfiguriert — E-Mail übersprungen")
    return
  }

  const subject = input.riskScore01 != null
    ? `Analyse abgeschlossen: ${input.documentTitle} — Risiko ${Math.round(input.riskScore01 * 100)}%`
    : `Analyse abgeschlossen: ${input.documentTitle}`

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: SENDER,
        to: [input.recipientEmail],
        subject,
        html: buildHtml(input)
      })
    })

    if (!res.ok) {
      const body = await res.text()
      console.error("[email.analysis_complete] Resend-Fehler:", res.status, body)
    } else {
      console.log("[email.analysis_complete] E-Mail gesendet an", input.recipientEmail)
    }
  } catch (err) {
    console.error("[email.analysis_complete] Netzwerkfehler:", err instanceof Error ? err.message : err)
  }
}
