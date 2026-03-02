import { Role } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      tenantId?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    tenantId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role
    tenantId?: string
  }
}
