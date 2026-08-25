import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Edit3, CheckCircle, School, ExternalLink, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getApiBase } from '@/lib/runtime'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const hostname = window.location.hostname
  const parts = hostname.split(".")
  const isSubdomain =
    parts.length >= 2 &&
    parts[0] !== "www" &&
    parts[0] !== "localhost" &&
    parts[0] !== "domain" &&
    parts[0] !== "literasidigital"

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL = getApiBase()
        const token = localStorage.getItem("token")
        const res = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
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
        description="Pantau kegiatan dan informasi Anda di sini."
        actions={
          <Button variant="outline" asChild size="sm">
            <a href="/" target="_blank" rel="noopener noreferrer">
              Lihat Blog <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tulisan Anda</CardTitle>
                <Edit3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.user_posts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Semua draf dan publikasi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tulisan Terbit</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.user_published || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Bisa dibaca publik
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draf Tulisan</CardTitle>
                <FileText className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.user_drafts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Belum dipublikasikan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tayangan</CardTitle>
                <Eye className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.total_views || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Dibaca oleh pengunjung
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {stats.posts_per_day && stats.posts_per_day.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tren Aktivitas Anda (30 Hari)</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.posts_per_day}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" fontSize={12} tickFormatter={(val) => val.split("-").slice(1).join("/")} />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <RechartsTooltip labelFormatter={(label) => `Tanggal: ${label}`} />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} name="Artikel Baru" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {stats.top_posts && stats.top_posts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Top 5 Artikel Anda (Terbanyak Dilihat)</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.top_posts} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={12} allowDecimals={false} />
                      <YAxis type="category" dataKey="title" fontSize={12} width={120} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                      <RechartsTooltip />
                      <Bar dataKey="views" fill="#a855f7" name="Tayangan" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`Selamat Datang, ${user?.identifier}!`}
      description="Ini adalah ringkasan sistem Anda hari ini."
      actions={
        <Button variant="outline" asChild size="sm" className="bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 border-indigo-200">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Lihat Blog
          </a>
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {!isSubdomain && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sekolah</CardTitle>
                <School className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.total_schools || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Cabang/tenant terdaftar
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pengguna terdaftar di sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Artikel</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.total_posts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Semua artikel blog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tayangan</CardTitle>
              <Eye className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.total_views || 0}</div>
              <p className="text-xs text-muted-foreground">
                Dilihat oleh pengunjung
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          {stats.posts_per_day && stats.posts_per_day.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tren Publikasi Artikel (30 Hari)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.posts_per_day}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} tickFormatter={(val) => val.split("-").slice(1).join("/")} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <RechartsTooltip labelFormatter={(label) => `Tanggal: ${label}`} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} name="Total Publikasi" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {stats.top_posts && stats.top_posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top 5 Artikel Terpopuler (Views)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.top_posts} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="title" fontSize={12} width={120} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                    <RechartsTooltip />
                    <Bar dataKey="views" fill="#a855f7" name="Tayangan" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  )
}
