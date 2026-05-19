export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Admin Status Endpoint — Audit R-04 Fix
 *
 * In Production: Nur authentifizierte ADMIN/OWNER-User dürfen zugreifen.
 * Sensitive Werte (URLs, Secrets) werden NICHT mehr exponiert.
 * Gibt nur Boolean-Status für Provider-Verfügbarkeit zurück.
 */
export async function GET(): Promise<NextResponse> {
  // Production: Auth + Role Check erforderlich
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  // Nur ADMIN oder OWNER dürfen den Status sehen
  const role = (session.user as { role?: string }).role
  if (role !== "ADMIN" && role !== "OWNER") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  // Nur Boolean-Status — KEINE URLs, Secrets, Keys oder Konfigurationswerte
  return NextResponse.json({
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
      llama: Boolean(process.env.LLAMA_API_KEY?.trim() && process.env.LLAMA_API_BASE?.trim()),
    },
    router: {
      enabled: process.env.AI_ROUTER_ENABLED === "true",
    },
    auth: {
      google: Boolean(process.env.AUTH_GOOGLE_ID),
      microsoft: Boolean(process.env.AUTH_MICROSOFT_TENANT_ID),
    }
  })
}
