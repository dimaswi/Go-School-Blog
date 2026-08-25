import { useState, useEffect, useRef } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import { resolveAssetUrl } from "@/lib/runtime"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"
import { useAuth } from "@/context/AuthContext"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function PostCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isSchoolAdmin = !!user?.school_id && user?.role?.toLowerCase() === "admin"
  const isSuperAdmin = !user?.school_id || user?.role?.toLowerCase() === "super admin"
  const canSetStatus = isSuperAdmin || isSchoolAdmin

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const excerptRef = useRef<HTMLTextAreaElement>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    thumbnail_url: "",
    status: "draft",
    category_id: "",
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCategories(response.data || [])
      } catch (error) {
        console.error("Failed to fetch categories", error)
      }
    }
    fetchCategories()
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    setFormData(prev => ({ ...prev, title, slug }))
  }

  useEffect(() => {
    if (excerptRef.current) {
      excerptRef.current.style.height = "auto"
      excerptRef.current.style.height = excerptRef.current.scrollHeight + "px"
    }
  }, [formData.excerpt])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    const data = new FormData()
    data.append("file", file)

    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(`${API_URL}/upload`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      })
      setFormData(prev => ({ ...prev, thumbnail_url: response.data.url }))
      toast.success("Gambar berhasil diupload")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengupload gambar")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      await axios.post(`${API_URL}/posts`, {
        ...formData,
        category_id: Number(formData.category_id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Artikel berhasil disimpan")
      navigate("/admin/posts")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menyimpan artikel")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      title="Tulis Artikel Baru"
      description="Buat konten berita atau pengumuman sekolah."
      footer={
        <>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/posts">Batal</Link>
          </Button>
          <Button type="submit" form="post-form" disabled={loading} className="min-w-[140px]">
            {loading ? "Menyimpan..." : "Simpan Artikel"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <form id="post-form" onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Judul Artikel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Masukkan judul..."
                  className="text-lg"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="content">Konten Berita *</Label>
                <div className="bg-white rounded-md">
                  <ReactQuill 
                    theme="snow"
                    value={formData.content}
                    onChange={(val) => setFormData({ ...formData, content: val })}
                    className="quill-dynamic"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            {canSetStatus && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="category">Rubrik *</Label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
                form="post-form"
              >
                <option value="">Pilih Rubrik...</option>
                {categories.map((c) => (
                  <option key={c.ID} value={c.ID}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label>Thumbnail / Cover</Label>
              {formData.thumbnail_url && (
                <div className="rounded overflow-hidden border border-slate-200 mb-2">
                  <img src={resolveAssetUrl(formData.thumbnail_url)} alt="Thumbnail" className="w-full h-auto" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && <p className="text-xs text-blue-500">Mengupload...</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="excerpt">Kutipan Singkat (Excerpt)</Label>
              <textarea
                id="excerpt"
                ref={excerptRef}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Ringkasan berita..."
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
                form="post-form"
              />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
