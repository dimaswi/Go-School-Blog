import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { useAuth } from "@/context/AuthContext"
import { Users, Shield, TrendingUp, Activity, Bell, Calendar, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total_users: 0, total_roles: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only fetch admin stats if user is admin or super admin
    if (user?.role?.toLowerCase() === "user") {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
        const res = await axios.get(`${API_URL}/dashboard/stats`)
        setStats(res.data.stats)
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user])

  const isRegularUser = user?.role?.toLowerCase() === "user"

  if (isRegularUser) {
    return (
      <PageShell
        title={`Selamat Datang, ${user?.identifier}!`}
        description="Pantau kegiatan dan informasi sekolah Anda di sini."
      >
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pengumuman</CardTitle>
                <Bell className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3 Baru</div>
                <p className="text-xs text-muted-foreground">
                  Informasi terbaru hari ini
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jadwal Belajar</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4 Mapel</div>
                <p className="text-xs text-muted-foreground">
                  Berakhir pada 14:00 WIB
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tugas Aktif</CardTitle>
                <BookOpen className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 Tugas</div>
                <p className="text-xs text-muted-foreground">
                  Batas pengumpulan minggu ini
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`Selamat Datang, ${user?.identifier}!`}
      description="Ini adalah ringkasan sistem Anda hari ini."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                Pengguna terdaftar di sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.total_roles}</div>
              <p className="text-xs text-muted-foreground">
                Tingkat akses aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem Aktif</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Online</div>
              <p className="text-xs text-muted-foreground">
                Semua layanan berjalan normal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trafik Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">
                Dibandingkan kemarin
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
