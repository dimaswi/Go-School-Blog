import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import type { User } from "./columns"

export default function UserShow() {
  const { id } = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock fetch
    setTimeout(() => {
      setUser({ id: id || "1", name: "Admin Utama", username: "admin", role: "Admin" })
      setLoading(false)
    }, 500)
  }, [id])

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/admin/users">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Detail User</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Informasi lengkap pengguna.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          {loading ? (
            <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
          ) : user ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-muted-foreground font-medium text-sm">Nama Lengkap</div>
                <div className="col-span-2 font-medium text-slate-900">{user.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-muted-foreground font-medium text-sm">Username</div>
                <div className="col-span-2 text-slate-900">{user.username}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-muted-foreground font-medium text-sm">Role</div>
                <div className="col-span-2">
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-semibold">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">User tidak ditemukan.</div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button variant="outline" asChild>
          <Link to="/admin/users">Kembali</Link>
        </Button>
        <Button asChild className="min-w-[140px]">
          <Link to={`/admin/users/${user?.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Link>
        </Button>
      </div>
    </div>
  )
}
