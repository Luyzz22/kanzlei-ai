export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
      llama: Boolean(process.env.LLAMA_API_KEY?.trim() && process.env.LLAMA_API_BASE?.trim()),
    },
    router: {
      enabled: process.env.AI_ROUTER_ENABLED === "true",
      priority: process.env.AI_PROVIDER_PRIORITY || "openai,anthropic,gemini,llama",
    },
    auth: {
      nextauthUrl: process.env.NEXTAUTH_URL || "not set",
      secretSet: Boolean(process.env.NEXTAUTH_SECRET),
      google: Boolean(process.env.AUTH_GOOGLE_ID),
      microsoft: Boolean(process.env.AUTH_MICROSOFT_ID),
    },
    seed: {
      secretSet: Boolean(process.env.SEED_SECRET),
    }
  })
}
