import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

export default function SchoolCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    address: "",
    logo: "",
  })

  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    const uploadData = new FormData()
    uploadData.append("file", file)

    setUploadingLogo(true)
    setError("")

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      const token = localStorage.getItem("token")
      
      const res = await axios.post(`${apiUrl}/upload`, uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setFormData({ ...formData, logo: res.data.url })
    } catch (err: any) {
      console.error("Failed to upload logo:", err)
      setError("Gagal mengunggah logo.")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      const token = localStorage.getItem("token")
      
      await axios.post(`${apiUrl}/schools`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      navigate("/schools")
    } catch (err: any) {
      console.error("Failed to create school:", err)
      setError(err.response?.data?.message || "Gagal membuat sekolah")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/schools">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Sekolah Baru</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buat tenant sekolah baru beserta akun admin utamanya.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 w-full">
          <form id="school-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Informasi Sekolah</h3>
              
              <div className="space-y-2 w-full">
                <Label htmlFor="name">Nama Sekolah</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: SMA Negeri 1 Jakarta"
                />
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    name="subdomain"
                    value={formData.subdomain}
                    onChange={handleChange}
                    required
                    placeholder="sman1jkt"
                    className="flex-1"
                  />
                  <span className="text-slate-500 text-sm whitespace-nowrap">.yourdomain.com</span>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Alamat lengkap sekolah"
                />
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="logo">Logo (Opsional)</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploadingLogo}
                  />
                  {uploadingLogo && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                </div>
                {formData.logo && (
                  <div className="mt-2">
                    <img src={`http://localhost:8080${formData.logo}`} alt="Preview" className="h-16 w-auto object-contain rounded border bg-slate-50 p-1" />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/schools">Batal</Link>
        </Button>
        <Button type="submit" form="school-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Sekolah
        </Button>
      </div>
    </div>
  )
}
