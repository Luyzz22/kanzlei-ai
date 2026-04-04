import type { Metadata } from "next"
export const metadata: Metadata = { title: "Systemstatus", description: "Echtzeit-Status aller KanzleiAI-Systeme." }
export default function Layout({ children }: { children: React.ReactNode }) { return children }
