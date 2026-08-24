import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useNavigate, useParams, Link } from "react-router-dom"
import { toast } from "react-hot-toast"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function CategoryEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_id: "",
    is_school_list: false,
  })

  useEffect(() => {
    const fetchCategoryAndParents = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const allCats = response.data || []
        
        const category = allCats.find((c: any) => c.ID === Number(id))
        
        if (category) {
          setFormData({
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id ? category.parent_id.toString() : "",
            is_school_list: category.is_school_list || false,
          })
          
          // Set parent categories for dropdown (exclude itself to prevent circular reference)
          const parentCats = allCats.filter((c: any) => !c.parent_id && c.ID !== Number(id))
          setCategories(parentCats)
        } else {
          toast.error("Kategori tidak ditemukan")
          navigate("/categories")
        }
      } catch (error) {
        console.error("Failed to fetch category", error)
        toast.error("Gagal memuat data kategori")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategoryAndParents()
  }, [id, navigate])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    setFormData(prev => ({ ...prev, name, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem("token")
      await axios.put(`${API_URL}/categories/${id}`, {
        ...formData,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success("Rubrik berhasil diperbarui")
      navigate("/categories")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal memperbarui rubrik")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <PageShell
      title="Edit Rubrik"
      description="Perbarui informasi kategori artikel berita."
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
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
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
              <Link to="/categories">Batal</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
