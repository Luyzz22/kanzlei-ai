import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    status: "debug endpoint enabled for local admin diagnostics only"
  })
}
