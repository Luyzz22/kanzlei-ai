import { PrismaAdapter } from "@auth/prisma-adapter"
import { Role, TenantRole } from "@prisma/client"
import { compare } from "bcryptjs"
import NextAuth, { type NextAuthConfig } from "next-auth"
import type { Adapter } from "next-auth/adapters"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const adapter = PrismaAdapter(prisma) as Adapter

function parseCsvEnv(name: string): string[] {
  const raw = process.env[name]
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function mapAdminFromEntraRoles(roles: unknown): boolean {
  const adminRoles = parseCsvEnv("AUTH_MICROSOFT_ADMIN_ROLES")
  const list = Array.isArray(roles) ? roles.map(String) : []
  if (!adminRoles.length) return false
  return list.some((r) => adminRoles.includes(r))
}

// --- SBS corporate domain auto-elevation ---
// Rule: Every user whose email ends with @sbsdeutschland.de or @sbsdeutschland.com
// is automatically granted ADMIN role + OWNER membership on the sbs-deutschland tenant.
// Enforced at every sign-in (not only JIT) so state stays consistent across providers.

const SBS_CORPORATE_DOMAINS = ["sbsdeutschland.de", "sbsdeutschland.com"]
const SBS_TENANT_SLUG = "sbs-deutschland"
const SBS_TENANT_NAME = "SBS Deutschland GmbH & Co. KG"

function isSbsCorporateEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  const atIndex = normalized.lastIndexOf("@")
  if (atIndex === -1) return false
  const domain = normalized.slice(atIndex + 1)
  return SBS_CORPORATE_DOMAINS.includes(domain)
}

async function ensureSbsCorporateElevation(userId: string): Promise<void> {
  // 1. Elevate global Role to ADMIN (idempotent)
  await prisma.user
    .update({ where: { id: userId }, data: { role: Role.ADMIN } })
    .catch((error) => {
      console.warn("[auth.sbs_elevation.role_update_failed]", {
        userId,
        error: error instanceof Error ? error.message : String(error)
      })
    })

  // 2. Ensure sbs-deutschland tenant exists
  const tenant = await prisma.tenant
    .upsert({
      where: { slug: SBS_TENANT_SLUG },
      update: {},
      create: { slug: SBS_TENANT_SLUG, name: SBS_TENANT_NAME }
    })
    .catch((error) => {
      console.error("[auth.sbs_elevation.tenant_upsert_failed]", {
        userId,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    })

  if (!tenant) return

  // 3. Attach user as OWNER of the sbs-deutschland tenant (idempotent upsert)
  await prisma.tenantMember
    .upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId } },
      update: { role: TenantRole.OWNER },
      create: { tenantId: tenant.id, userId, role: TenantRole.OWNER }
    })
    .catch((error) => {
      console.warn("[auth.sbs_elevation.membership_upsert_failed]", {
        userId,
        tenantId: tenant.id,
        error: error instanceof Error ? error.message : String(error)
      })
    })

  console.info("[auth.sbs_elevation.applied]", {
    userId,
    tenantId: tenant.id
  })
}

export const authConfig: NextAuthConfig = {
  adapter,
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 60
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Google (optional)
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET
          })
        ]
      : []),

    // Microsoft Entra ID (OIDC)
    ...(process.env.AUTH_MICROSOFT_ID && process.env.AUTH_MICROSOFT_SECRET && process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER
      ? [
          MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ID,
            clientSecret: process.env.AUTH_MICROSOFT_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER
          })
        ]
      : []),

    // Credentials
    Credentials({
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" }
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }
        })

        if (!user?.password) return null

        const isValid = await compare(parsed.data.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    // Enterprise gate: Tenant-Scoping + JIT Provisioning for Entra users
    // Plus: SBS corporate domain auto-elevation for ALL providers
    signIn: async ({ user, account, profile }) => {
      // --- Phase 1: SBS corporate domain auto-elevation (all providers) ---
      // Applies to Credentials, Google, Entra — any auth method.
      // If the signed-in email matches a SBS corporate domain, the user is
      // automatically promoted to ADMIN and attached as OWNER of sbs-deutschland.
      if (user?.id && isSbsCorporateEmail(user.email)) {
        await ensureSbsCorporateElevation(user.id)
      }

      // --- Phase 2: Entra-specific tenant gate + JIT provisioning ---
      if (account?.provider !== "microsoft-entra-id") return true

      const allowedTenants = parseCsvEnv("AUTH_MICROSOFT_ALLOWED_TENANT_IDS")
      const tid = (profile as { tid?: string } | null)?.tid

      if (allowedTenants.length) {
        if (!tid || !allowedTenants.includes(tid)) return false
      }

      if (!user?.id) return true

      const isAdmin = mapAdminFromEntraRoles((profile as { roles?: unknown } | null)?.roles)
      const newUserRole: Role = isAdmin ? Role.ADMIN : Role.ASSISTENT
      const newTenantRole: TenantRole = isAdmin ? TenantRole.ADMIN : TenantRole.MEMBER

      // Default tenant mapping: 1 Entra tenant => 1 KanzleiAI tenant
      if (tid) {
        const slug = `entra-${tid}`
        const tenant = await prisma.tenant.upsert({
          where: { slug },
          update: {},
          create: { slug, name: `Entra Tenant ${tid}` }
        })

        await prisma.tenantMember.upsert({
          where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
          update: { role: newTenantRole },
          create: { tenantId: tenant.id, userId: user.id, role: newTenantRole }
        })
      }

      // Persist internal Role on User (DB session uses user.role)
      // NOTE: For SBS corporate users, this would downgrade them from ADMIN → ASSISTENT
      // if Entra didn't provision admin roles. We skip this for SBS domain users.
      if (!isSbsCorporateEmail(user.email)) {
        await prisma.user
          .update({ where: { id: user.id }, data: { role: newUserRole } })
          .catch(() => null)
      }

      return true
    },

    jwt: async ({ token, user }) => {
      if (user) token.role = (user as { role?: Role }).role ?? Role.ASSISTENT
      return token
    },

    session: async ({ session, token }) => {
      if (session.user && token) {
        session.user.id = token.sub ?? ""
        session.user.role = (token.role as Role) ?? Role.ASSISTENT
      }
      return session
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
