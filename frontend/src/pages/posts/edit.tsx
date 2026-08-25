import { useState, useEffect, useRef } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate, useParams, Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import { resolveAssetUrl } from "@/lib/runtime"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"
import { useAuth } from "@/context/AuthContext"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function PostEdit() {
  const { user } = useAuth()
  const isSchoolAdmin = !!user?.school_id && user?.role?.toLowerCase() === "admin"
  const isSuperAdmin = !user?.school_id || user?.role?.toLowerCase() === "super admin"
  const canSetStatus = isSuperAdmin || isSchoolAdmin

  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    main_domain_status: "none"
  })

  useEffect(() => {
    const fetchCategories = async (token: string) => {
      try {
        const response = await axios.get(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCategories(response.data || [])
      } catch (error) {
        console.error("Failed to fetch categories", error)
      }
    }

    const fetchPost = async (token: string) => {
      try {
        const response = await axios.get(`${API_URL}/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const p = response.data
        setFormData({
          title: p.title,
          slug: p.slug,
          content: p.content,
          excerpt: p.excerpt,
          thumbnail_url: p.thumbnail_url,
          status: p.status,
          category_id: p.category_id.toString(),
          main_domain_status: p.main_domain_status || "none",
        })
      } catch (error) {
        console.error("Failed to fetch post", error)
        toast.error("Gagal memuat artikel")
        navigate("/admin/posts")
      } finally {
        setLoading(false)
      }
    }

    const token = localStorage.getItem("token")
    if (token) {
      fetchCategories(token)
      fetchPost(token)
    }
  }, [id, navigate])

  useEffect(() => {
    if (excerptRef.current) {
      excerptRef.current.style.height = "auto"
      excerptRef.current.style.height = excerptRef.current.scrollHeight + "px"
    }
  }, [formData.excerpt])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    setFormData(prev => ({ ...prev, title, slug }))
  }

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
    setSaving(true)

    try {
      const token = localStorage.getItem("token")
      await axios.put(`${API_URL}/posts/${id}`, {
        ...formData,
        category_id: Number(formData.category_id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Artikel berhasil diperbarui")
      navigate("/admin/posts")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal memperbarui artikel")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleMainDomainAction = async (action: "request" | "approve" | "reject") => {
    try {
      const token = localStorage.getItem("token")
      if (action === "request") {
        await axios.post(`${API_URL}/posts/${id}/request-main-domain`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setFormData(prev => ({ ...prev, main_domain_status: "pending" }))
      } else if (action === "approve") {
        await axios.put(`${API_URL}/posts/${id}/approve-main-domain`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setFormData(prev => ({ ...prev, main_domain_status: "approved" }))
      } else if (action === "reject") {
        await axios.put(`${API_URL}/posts/${id}/reject-main-domain`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setFormData(prev => ({ ...prev, main_domain_status: "rejected" }))
      }
      toast.success("Berhasil mengubah status pengajuan!")
    } catch (error) {
      toast.error("Gagal mengubah status pengajuan")
      console.error(error)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <PageShell
      title="Edit Artikel"
      description="Perbarui konten berita atau pengumuman sekolah."
      footer={
        <>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/posts">Batal</Link>
          </Button>
          <Button type="submit" form="post-form" disabled={saving} className="min-w-[140px]">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
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
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            )}

            {formData.status === 'published' && (
              <div className="grid gap-2 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <Label>Domain Utama (Pusat)</Label>
                <div className="flex flex-col gap-2 mt-1">
                  {formData.main_domain_status === 'none' && (
                    <span className="text-sm text-slate-500">Belum diajukan ke pusat.</span>
                  )}
                  {formData.main_domain_status === 'pending' && (
                    <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded w-fit">
                      Menunggu Persetujuan
                    </span>
                  )}
                  {formData.main_domain_status === 'approved' && (
                    <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded w-fit">
                      Tayang di Pusat
                    </span>
                  )}
                  {formData.main_domain_status === 'rejected' && (
                    <span className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-1 rounded w-fit">
                      Ditolak oleh Pusat
                    </span>
                  )}

                  {!isSuperAdmin && (formData.main_domain_status === 'none' || formData.main_domain_status === 'rejected') && (
                    <Button type="button" size="sm" variant="outline" onClick={() => handleMainDomainAction('request')} className="mt-2 text-blue-600 hover:text-blue-700 w-full">
                      Ajukan Tayang di Pusat
                    </Button>
                  )}

                  {isSuperAdmin && formData.main_domain_status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => handleMainDomainAction('approve')} className="flex-1 text-green-600 hover:text-green-700 bg-green-50">
                        Setujui
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleMainDomainAction('reject')} className="flex-1 text-red-600 hover:text-red-700 bg-red-50">
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="category">Rubrik *</Label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
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
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none overflow-hidden"
                form="post-form"
              />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
