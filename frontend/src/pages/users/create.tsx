import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"
import { getApiBase } from "@/lib/runtime"

const API_URL = getApiBase()

export default function UserCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role_id: ""
  })

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${API_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRoles(res.data || [])
      } catch (err) {
        console.error("Failed to fetch roles", err)
      }
    }
    fetchRoles()
  }, [])

  const hostname = window.location.hostname
  const parts = hostname.split('.')
  const isSubdomain = parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'domain' && parts[0] !== 'literasidigital'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.post(`${API_URL}/users`, {
        ...formData,
        role_id: Number(formData.role_id) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("User berhasil dibuat")
      navigate("/admin/users")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membuat user")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah User Baru</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buat akun pengguna baru untuk sistem ini.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 w-full">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 w-full">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" placeholder="Masukkan nama lengkap" required value={formData.name} onChange={handleChange} />
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Masukkan username" required value={formData.username} onChange={handleChange} />
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Masukkan password" required value={formData.password} onChange={handleChange} />
              </div>

              {!isSubdomain && (
                <div className="space-y-2 w-full">
                  <Label htmlFor="role_id">Role Akses</Label>
                  <Select value={formData.role_id} onValueChange={v => setFormData({ ...formData, role_id: v })} required={!isSubdomain}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/admin/users">Batal</Link>
        </Button>
        <Button type="submit" form="user-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan User
        </Button>
      </div>
    </div>
  )
}
