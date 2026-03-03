import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,

    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,

    AUTH_MICROSOFT_ID: !!process.env.AUTH_MICROSOFT_ID,
    AUTH_MICROSOFT_SECRET: !!process.env.AUTH_MICROSOFT_SECRET,
    AUTH_MICROSOFT_ENTRA_ID_ISSUER: !!process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    AUTH_MICROSOFT_ALLOWED_TENANT_IDS: !!process.env.AUTH_MICROSOFT_ALLOWED_TENANT_IDS,
    AUTH_MICROSOFT_ADMIN_ROLES: !!process.env.AUTH_MICROSOFT_ADMIN_ROLES
  })
}
