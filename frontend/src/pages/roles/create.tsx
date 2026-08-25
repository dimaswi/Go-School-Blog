import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function RoleCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permission_ids: [] as number[]
  })

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${API_URL}/permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPermissions(res.data || [])
      } catch (err) {
        console.error("Failed to fetch permissions", err)
      }
    }
    fetchPermissions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.post(`${API_URL}/roles`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Role berhasil dibuat")
      navigate("/admin/roles")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membuat role")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckboxChange = (id: number, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return { ...prev, permission_ids: [...prev.permission_ids, id] }
      } else {
        return { ...prev, permission_ids: prev.permission_ids.filter(pid => pid !== id) }
      }
    })
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/admin/roles">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Role Baru</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buat peran pengguna dan atur hak aksesnya.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 max-w-2xl">
              <Label htmlFor="name">Nama Role</Label>
              <Input 
                id="name" 
                placeholder="Misal: Manager" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2 max-w-2xl">
              <Label htmlFor="description">Deskripsi</Label>
              <Input 
                id="description" 
                placeholder="Penjelasan role ini" 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-4">Assign Permissions (Hak Akses)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {permissions.map(p => (
                  <div key={p.ID} className="flex items-start space-x-2">
                    <Checkbox 
                      id={`perm-${p.ID}`} 
                      checked={formData.permission_ids.includes(p.ID)}
                      onCheckedChange={(checked) => handleCheckboxChange(p.ID, checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`perm-${p.ID}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {p.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/admin/roles">Batal</Link>
        </Button>
        <Button type="submit" form="role-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Role
        </Button>
      </div>
    </div>
  )
}
