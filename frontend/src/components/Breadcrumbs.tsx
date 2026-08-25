import { useLocation, Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"

// Map route segments ke label yang ramah
const routeLabels: Record<string, string> = {
  "siswa": "Data Siswa",
  "guru": "Data Guru",
  "create": "Tambah Baru",
  "edit": "Ubah Data",
  "show": "Detail",
}

function getLabel(segment: string): string {
  // Jika segment adalah UUID/number (halaman detail/edit), skip atau tampilkan "Detail"
  const isId = /^[0-9a-f-]{8,}$|^\d+$/.test(segment)
  if (isId) return ""
  return routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

export default function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter(Boolean)

  // Bangun breadcrumb items dari segments
  const crumbs: { label: string; href: string }[] = []
  let currentPath = ""

  for (let i = 0; i < pathnames.length; i++) {
    currentPath += `/${pathnames[i]}`
    const label = getLabel(pathnames[i])

    // Skip segment yang kosong labelnya (misal UUID yang bukan halaman utama)
    if (!label) {
      // Cek apakah segment berikutnya adalah "edit" atau "show"
      // kalau iya, biarkan saja — label akan diisi segment berikutnya
      continue
    }

    crumbs.push({ label, href: currentPath })
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      {/* Home */}
      <Link
        to="/admin"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            {isLast ? (
              <span className="text-sm font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
