import { WorkspaceSidebar } from "@/components/workspace/sidebar"

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <WorkspaceSidebar />
      <main className="flex-1 bg-[#FAFAF7]">
        {children}
      </main>
    </div>
  )
}
