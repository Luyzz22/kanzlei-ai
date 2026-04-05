import type { Metadata } from "next"
export const metadata: Metadata = { title: "Mein Profil", description: "Persoenliche Einstellungen und Zugangsdaten." }
export default function Layout({ children }: { children: React.ReactNode }) { return children }
