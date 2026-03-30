export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { firstName, lastName, email, organization, role, teamSize, message } = body as {
      firstName: string; lastName: string; email: string; organization: string
      role?: string; teamSize?: string; message?: string
    }

    if (!firstName || !lastName || !email || !organization) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error("[CONTACT] RESEND_API_KEY not configured")
      return NextResponse.json({ status: "received", note: "E-Mail-Versand nicht konfiguriert — Anfrage gespeichert" })
    }

    // Send notification to SBS team
    const notificationHtml = `
      <h2>🏢 Neue Enterprise-Demo-Anfrage</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:180px;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">E-Mail</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Organisation</td><td style="padding:8px;border-bottom:1px solid #eee;">${organization}</td></tr>
        ${role ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Rolle</td><td style="padding:8px;border-bottom:1px solid #eee;">${role}</td></tr>` : ""}
        ${teamSize ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Teamgröße</td><td style="padding:8px;border-bottom:1px solid #eee;">${teamSize}</td></tr>` : ""}
        ${message ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Nachricht</td><td style="padding:8px;border-bottom:1px solid #eee;">${message}</td></tr>` : ""}
      </table>
      <p style="margin-top:16px;color:#666;font-size:13px;">Quelle: kanzlei-ai.com/enterprise-kontakt</p>
    `

    // Send to SBS team
    const notifyRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "KanzleiAI <ki@sbsdeutschland.de>",
        to: ["ki@sbsdeutschland.de"],
        subject: `🏢 Demo-Anfrage: ${organization} — ${firstName} ${lastName}`,
        html: notificationHtml
      })
    })

    if (!notifyRes.ok) {
      const err = await notifyRes.text()
      console.error("[CONTACT] Resend notification error:", err)
    }

    // Send confirmation to prospect
    const confirmHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#003856;">Vielen Dank für Ihr Interesse an KanzleiAI</h2>
        <p style="color:#555;line-height:1.6;">Hallo ${firstName},</p>
        <p style="color:#555;line-height:1.6;">wir haben Ihre Demo-Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.</p>
        <p style="color:#555;line-height:1.6;">In der Zwischenzeit können Sie sich einen ersten Eindruck verschaffen:</p>
        <ul style="color:#555;line-height:1.8;">
          <li><a href="https://www.kanzlei-ai.com/trust-center" style="color:#003856;">Trust Center — Datenschutz & Sicherheit</a></li>
          <li><a href="https://www.kanzlei-ai.com/integrationen" style="color:#003856;">Integrationen — Ökosystem</a></li>
          <li><a href="https://www.kanzlei-ai.com/produkt" style="color:#003856;">Produkt — Kernmodule</a></li>
        </ul>
        <p style="color:#555;line-height:1.6;margin-top:24px;">Mit freundlichen Grüßen,<br/><strong>Das KanzleiAI Team</strong><br/>SBS Deutschland GmbH & Co. KG</p>
      </div>
    `

    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "KanzleiAI <ki@sbsdeutschland.de>",
        to: [email],
        subject: "Ihre Demo-Anfrage bei KanzleiAI — Bestätigung",
        html: confirmHtml
      })
    })

    if (!confirmRes.ok) {
      const err = await confirmRes.text()
      console.error("[CONTACT] Resend confirmation error:", err)
    }

    return NextResponse.json({ status: "sent", message: "E-Mails erfolgreich versendet" })
  } catch (error) {
    console.error("[CONTACT] Error:", error)
    return NextResponse.json({ error: "Anfrage fehlgeschlagen", details: error instanceof Error ? error.message : "unknown" }, { status: 500 })
  }
}
