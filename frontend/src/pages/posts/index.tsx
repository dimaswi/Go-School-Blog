import { useState, useEffect } from "react"
import axios from "axios"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, X } from "lucide-react"
import { Link } from "react-router-dom"
import { columns } from "./columns"
import type { Post } from "./columns"
import { useAuth } from "@/context/AuthContext"
import { useAppDialog } from "@/context/AppDialogContext"
import { toast } from "react-hot-toast"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function PostsIndex() {
  const { user } = useAuth()
  const { confirm } = useAppDialog()
  const [data, setData] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all")

  const isSuperAdmin = !user?.school_id || user?.role?.toLowerCase() === "super admin"
  const isSchoolAdmin = !!user?.school_id && user?.role?.toLowerCase() === "admin"

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token")
      const url = `${API_URL}/posts`

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(response.data || [])
    } catch (error) {
      console.error("Failed to fetch posts", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchPosts()
  }, [])

  const handleMainDomainAction = async (postId: number, action: "request" | "approve" | "reject") => {
    let msg = ""
    if (action === "request") msg = "Anda yakin ingin mengajukan artikel ini ke Domain Utama?"
    if (action === "approve") msg = "Setujui artikel ini untuk tampil di Domain Utama?"
    if (action === "reject") msg = "Tolak pengajuan artikel ini?"

    const isConfirmed = await confirm(msg, "Konfirmasi Tindakan")
    if (!isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      if (action === "request") {
        await axios.post(`${API_URL}/posts/${postId}/request-main-domain`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else if (action === "approve") {
        await axios.put(`${API_URL}/posts/${postId}/approve-main-domain`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else if (action === "reject") {
        await axios.put(`${API_URL}/posts/${postId}/reject-main-domain`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      toast.success("Berhasil mengubah status pengajuan!")
      fetchPosts()
    } catch (error) {
      toast.error("Gagal mengubah status pengajuan")
      console.error(error)
    }
  }

  const handleSchoolAction = async (postId: number, action: "submit" | "approve" | "reject") => {
    let msg = ""
    if (action === "submit") msg = "Ajukan artikel ini ke Admin Sekolah?"
    if (action === "approve") msg = "Setujui artikel ini agar tayang di website sekolah?"
    if (action === "reject") msg = "Tolak pengajuan artikel ini?"

    const isConfirmed = await confirm(msg, "Konfirmasi Tindakan")
    if (!isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      if (action === "submit") {
        await axios.post(`${API_URL}/posts/${postId}/submit-school`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else if (action === "approve") {
        await axios.put(`${API_URL}/posts/${postId}/approve-school`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else if (action === "reject") {
        await axios.put(`${API_URL}/posts/${postId}/reject-school`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      toast.success("Berhasil memperbarui status artikel!")
      fetchPosts()
    } catch (error) {
      toast.error("Gagal memperbarui status artikel")
      console.error(error)
    }
  }

  let pendingCount = 0
  let displayedData = data

  if (isSuperAdmin) {
    pendingCount = data.filter(p => p.main_domain_status === "pending").length
    if (activeTab === "pending") {
      displayedData = data.filter(p => p.main_domain_status === "pending")
    } else {
      displayedData = data.filter(p => p.main_domain_status !== "pending")
    }
  } else if (isSchoolAdmin) {
    pendingCount = data.filter(p => p.status === "pending").length
    if (activeTab === "pending") {
      displayedData = data.filter(p => p.status === "pending")
    } else {
      displayedData = data.filter(p => p.status !== "pending")
    }
  }

  const filtered = displayedData.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase())) ||
    (p.author?.name && p.author.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell
      title="Artikel Berita"
      description="Kelola publikasi artikel berita portal sekolah."
      actions={
        <Button size="sm" asChild>
          <Link to="/admin/posts/create">
            <Plus className="mr-2 h-4 w-4" />
            Tulis Artikel
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {(isSuperAdmin || isSchoolAdmin) && (
          <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "all" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            >
              Semua Artikel
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === "pending" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            >
              {isSuperAdmin ? "Pengajuan Domain Utama" : "Menunggu Persetujuan"}
              {pendingCount > 0 && (
                <span className="flex items-center justify-center bg-red-500 text-white text-[11px] font-bold h-5 min-w-[20px] px-1.5 rounded-full shadow-sm">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari judul, penulis, rubrik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-9 shadow-xs bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">{filtered.length} total artikel</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <DataTable
            columns={columns(fetchPosts, isSuperAdmin, isSchoolAdmin, confirm, handleMainDomainAction, handleSchoolAction)}
            data={filtered}
            enableSearch={false}
          />
        )}
      </div>
    </PageShell>
  )
}
