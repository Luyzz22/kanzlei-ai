export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Auth Debug Endpoint — SECURITY HARDENED
 *
 * DSGVO Art. 32 / NIS2 Art. 21 / ISO 27001 A.8
 *
 * VORHER: Gab NEXTAUTH_URL im Klartext aus, OHNE Auth-Check.
 *         → Configuration Leakage, Reconnaissance-Angriffsfläche.
 *
 * JETZT:
 * - Production: 404 (kein Debug-Endpunkt in Produktion)
 * - Non-Production: Admin-Auth erforderlich, keine sensiblen Werte
 */
export async function GET(): Promise<NextResponse> {
  // Production: Endpunkt existiert nicht
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }

  // Non-Production: Auth + ADMIN/OWNER Check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const role = (session.user as { role?: string }).role
  if (role !== "ADMIN" && role !== "OWNER") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  // Nur Boolean-Status — KEINE URLs, Secrets, Keys, Konfigurationswerte
  return NextResponse.json({
    ok: true,
    environment: process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
    auth: {
      nextauthConfigured: Boolean(process.env.NEXTAUTH_SECRET),
      googleConfigured: Boolean(process.env.AUTH_GOOGLE_ID),
      microsoftConfigured: Boolean(process.env.AUTH_MICROSOFT_ID),
    }
  })
}
