import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import Header from "./Header"

export default function Layout({ children }: { children: React.ReactNode }) {
  // Persist sidebar open/close state ke localStorage
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("Literasi Digital-sidebar-open")
    return saved !== null ? saved === "true" : true
  })

  useEffect(() => {
    localStorage.setItem("Literasi Digital-sidebar-open", String(open))
  }, [open])

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col min-w-0 bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
