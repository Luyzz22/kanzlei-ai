export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Admin Status Endpoint — Phase 1.3 Trust-Hardening
 *
 * DSGVO Art. 32 / NIS2 Art. 21 / ISO 27001 A.8
 *
 * Production: 404 — kein Status-Endpunkt in Produktion.
 * Non-Production: Admin-Auth erforderlich, minimale Ausgabe.
 *
 * KEINE Ausgabe von: Provider-Status, Secret-Status, API-Key-Verfügbarkeit,
 * OAuth-Konfiguration, Database-Konfiguration, ENV-Werten.
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

  return NextResponse.json({
    ok: true,
    environment: process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
  })
}
