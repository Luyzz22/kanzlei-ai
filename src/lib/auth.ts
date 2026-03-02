import { PrismaAdapter } from "@auth/prisma-adapter"
import { Role } from "@prisma/client"
import { compare } from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantIdentifier: z.string().min(1)
})

export async function resolveTenantId(tenantIdentifier: string) {
  const normalized = tenantIdentifier.trim().toLowerCase()

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: normalized }, { domain: normalized }, { name: tenantIdentifier.trim() }]
    },
    select: { id: true }
  })

  return tenant?.id
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 60 * 30,
    updateAge: 60 * 5
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Google,
    MicrosoftEntraID,
    Credentials({
      credentials: {
        tenantIdentifier: { label: "Kanzlei / Tenant", type: "text" },
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" }
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) {
          return null
        }

        const tenantId = await resolveTenantId(parsed.data.tenantIdentifier)
        if (!tenantId) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            tenantId_email: {
              tenantId,
              email: parsed.data.email
            }
          }
        })

        if (!user?.password) {
          return null
        }

        const isValid = await compare(parsed.data.password, user.password)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          tenantId: user.tenantId,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.ASSISTENT
        token.tenantId = (user as { tenantId?: string }).tenantId
      }
      return token
    },
    session: async ({ session, user, token }) => {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
        session.user.tenantId = user.tenantId
      }

      if (!session.user?.tenantId && token.tenantId) {
        session.user.tenantId = token.tenantId
      }

      return session
    }
  }
})
