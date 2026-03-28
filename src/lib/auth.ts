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

export const authConfig: NextAuthConfig = {
  adapter,
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 60
  },
  pages: {
    signIn: "/login"
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
    signIn: async ({ user, account, profile }) => {
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
      await prisma.user
        .update({ where: { id: user.id }, data: { role: newUserRole } })
        .catch(() => null)

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
