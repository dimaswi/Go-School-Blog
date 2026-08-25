import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Users,
  LayoutDashboard,
  Settings,
  School,
  LogOut,
  Tag,
  FileText,
  ChevronRight,
  ExternalLink,
  Megaphone,
  Bell,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useSiteConfig } from "../context/SiteConfigContext"
import axios from "axios"

type SchoolItem = {
  ID: number
  name: string
  subdomain: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { appName, schoolName, logoUrl } = useSiteConfig()
  const [schools, setSchools] = React.useState<SchoolItem[]>([])
  const [schoolsOpen, setSchoolsOpen] = React.useState(false)

  const hostname = window.location.hostname
  const parts = hostname.split(".")
  const isSubdomain =
    parts.length >= 2 &&
    parts[0] !== "www" &&
    parts[0] !== "localhost" &&
    parts[0] !== "domain"

  const isAdmin =
    user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "super admin"

  // Fetch schools for sub-nav (only on main domain)
  React.useEffect(() => {
    if (isSubdomain) return
    const token = localStorage.getItem("token")
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
    axios
      .get(`${apiUrl}/schools`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSchools(res.data || []))
      .catch(() => { })
  }, [isSubdomain])

  const navGroups: any[] = []

  // Menu Utama
  navGroups.push({
    title: "Utama",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  })

  // Menu Konten
  const kontenItems: any[] = []
  if (isAdmin || user?.permissions?.includes("categories.view")) {
    kontenItems.push({ title: "Rubrik (Nav)", url: "/admin/categories", icon: Tag })
  }
  if (isAdmin || user?.permissions?.includes("posts.view")) {
    kontenItems.push({ title: "Artikel Berita", url: "/admin/posts", icon: FileText })
  }
  if (isAdmin) {
    kontenItems.push({ title: "Manajemen Iklan", url: "/admin/ads", icon: Megaphone })
  }
  if (isAdmin) {
    kontenItems.push({ title: "Pengumuman", url: "/admin/announcements", icon: Bell })
  }
  if (kontenItems.length > 0) {
    navGroups.push({ title: "Konten", items: kontenItems })
  }

  // Menu Sistem
  const sistemItems: any[] = []
  if (isSubdomain) {
    if (isAdmin || user?.permissions?.includes("users.view")) {
      sistemItems.push({ title: "Pengguna", url: "/admin/users", icon: Users })
    }
    if (isAdmin) {
      sistemItems.push({ title: "Pengaturan", url: "/admin/settings", icon: Settings })
    }
  } else {
    if (isAdmin || user?.permissions?.includes("users.view")) {
      sistemItems.push({ title: "Pengguna", url: "/admin/users", icon: Users })
    }
    if (isAdmin || user?.permissions?.includes("roles.view")) {
      sistemItems.push({ title: "Roles & Akses", url: "/admin/roles", icon: Settings })
    }
    if (isAdmin) {
      sistemItems.push({ title: "Pengaturan", url: "/admin/settings", icon: Settings })
    }
  }
  if (sistemItems.length > 0) {
    navGroups.push({ title: "Sistem", items: sistemItems })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Brand Header ── */}
      <SidebarHeader className="h-[60px] border-b border-sidebar-border p-0">
        <div className="flex h-full w-full items-center px-4 gap-3 overflow-hidden group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
            ) : (
              <School className="h-6 w-6 text-slate-300" />
            )}
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-accent-foreground leading-tight truncate">
              {appName || schoolName}
            </span>
            <span className="text-[11px] text-sidebar-foreground/50 leading-tight">
              Admin Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav Content ── */}
      <SidebarContent className="px-2 pt-2 pb-2">
        {navGroups.map((group, idx) => (
          <SidebarGroup key={group.title} className={`p-0 ${idx > 0 ? "mt-1" : ""}`}>
            <SidebarGroupLabel className="h-6 px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item: any) => {
                  const isActive =
                    location.pathname === item.url ||
                    (item.url !== "/" && item.url !== "/admin" && location.pathname.startsWith(item.url))
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-8 rounded-md text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* ── Sekolah collapsible sub-nav (main domain only) ── */}
        {!isSubdomain && (
          <SidebarGroup className="p-0 mt-1">
            <SidebarGroupLabel className="h-6 px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
              Sekolah
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {/* Link ke halaman manajemen sekolah */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/schools" || (location.pathname.startsWith("/schools") && schools.length === 0)}
                    tooltip="Manajemen Sekolah"
                    className="h-8 rounded-md text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
                  >
                    <Link to="/admin/schools">
                      <School className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">Semua Sekolah</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Sub-item tiap sekolah */}
                {schools.length > 0 && (
                  <Collapsible open={schoolsOpen} onOpenChange={setSchoolsOpen} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip="Daftar Sekolah"
                          className="h-8 rounded-md text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
                        >
                          <School className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm flex-1">Daftar Sekolah</span>
                          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {schools.map((school) => {
                            const token = localStorage.getItem("token")
                            const subdomainUrl = `http://${school.subdomain}.localhost:5173/admin/login?token=${token}`
                            return (
                              <SidebarMenuSubItem key={school.ID}>
                                <SidebarMenuSubButton asChild className="h-7">
                                  <a
                                    href={subdomainUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sidebar-foreground/60 hover:text-sidebar-accent-foreground"
                                  >
                                    <span className="text-xs truncate flex-1">{school.name}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer ── */}
      <div className="mt-auto border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Keluar"
              className="h-8 rounded-md text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>

      <SidebarRail />
    </Sidebar>
  )
}
