import { WorkspaceSidebar } from "@/components/workspace/sidebar"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard", description: "Ueberblick ueber Ihre Vertragsanalysen und Workflows." }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <WorkspaceSidebar />
      <main className="flex-1 bg-[#FAFAF7]">
        {children}
      </main>
    </div>
  )
}
