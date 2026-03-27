import type { ReactNode } from "react"

type PageShellProps = {
  children: ReactNode
  width?: "narrow" | "default" | "wide"
  className?: string
}

const widthClasses = {
  narrow: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-7xl"
}

export function PageShell({ children, width = "wide", className }: PageShellProps) {
  return <main className={`mx-auto w-full ${widthClasses[width]} space-y-12 px-5 py-16 sm:px-8 lg:px-10 ${className ?? ""}`}>{children}</main>
}
