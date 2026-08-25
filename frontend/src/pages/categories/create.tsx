import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "react-hot-toast"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function CategoryCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_id: "",
    is_school_list: false,
  })

  // Fetch categories on mount for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        // Only show top-level categories as possible parents
        const parentCats = (response.data || []).filter((c: any) => !c.parent_id)
        setCategories(parentCats)
      } catch (error) {
        console.error("Failed to fetch categories", error)
      }
    }
    fetchCategories()
  }, [])

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    setFormData(prev => ({ ...prev, name, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      await axios.post(`${API_URL}/categories`, {
        ...formData,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Rubrik berhasil dibuat")
      navigate("/admin/categories")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal membuat rubrik")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      title="Tambah Rubrik"
      description="Buat kategori baru untuk artikel berita."
    >
      <div className="max-w-2xl bg-white border border-slate-200 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Rubrik *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Misal: NGALOR"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="misal: ngalor"
                required
              />
              <p className="text-xs text-slate-500">Slug digunakan untuk URL kategori.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parent_id">Induk Navigasi / Level (Opsional)</Label>
              <select
                id="parent_id"
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">-- Main Navigasi (Tidak ada Induk) --</option>
                {categories.map((c) => (
                  <option key={c.ID} value={c.ID}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">Pilih jika rubrik ini adalah sub-menu dari rubrik lain.</p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="is_school_list"
                checked={formData.is_school_list}
                onCheckedChange={(checked) => setFormData({ ...formData, is_school_list: checked as boolean })}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="is_school_list"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Jadikan menu ini sebagai List Sekolah
                </Label>
                <p className="text-xs text-slate-500">
                  Jika dicentang, menu ini akan otomatis menampilkan daftar semua sekolah yang terdaftar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/categories">Batal</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Rubrik"}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
