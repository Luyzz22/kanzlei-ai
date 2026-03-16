import type { ReactNode } from "react"

type PageShellProps = {
  children: ReactNode
  width?: "narrow" | "default" | "wide"
  className?: string
}

const widthClasses: Record<NonNullable<PageShellProps["width"]>, string> = {
  narrow: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-7xl"
}

export function PageShell({ children, width = "wide", className }: PageShellProps) {
  return <main className={`mx-auto w-full ${widthClasses[width]} space-y-10 px-4 py-10 sm:px-6 lg:px-8 ${className ?? ""}`}>{children}</main>
}
