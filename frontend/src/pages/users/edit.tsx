import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, KeyRound } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import { useAppDialog } from "@/context/AppDialogContext"
import { toast } from "react-hot-toast"
import { getApiBase } from "@/lib/runtime"

const API_URL = getApiBase()

export default function UserEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialog = useAppDialog()
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [roles, setRoles] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role_id: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}` }
        
        const [rolesRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/roles`, { headers }),
          axios.get(`${API_URL}/users`, { headers }) // Mock fetching single user via array for now
        ])
        
        setRoles(rolesRes.data || [])
        
        const user = usersRes.data.find((u: any) => u.id === id)
        if (user) {
          // Cari role_id berdasarkan nama role karena API getUsers mungkin cuma kirim nama role
          const userRole = rolesRes.data.find((r: any) => r.name === user.role)
          setFormData({
            name: user.name,
            username: user.username,
            role_id: userRole ? userRole.id : ""
          })
        }
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.put(`${API_URL}/users/${id}`, {
        ...formData,
        role_id: Number(formData.role_id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("User berhasil diperbarui")
      navigate("/admin/users")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui user")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    const newPassword = await dialog.prompt({
      title: "Ubah Password",
      message: "Masukkan password baru (minimal 6 karakter).",
      placeholder: "Password baru",
      password: true,
    })
    if (!newPassword) return
    if (newPassword.length < 6) {
      await dialog.alert("Password minimal 6 karakter")
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.put(`${API_URL}/users/${id}/password`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Password berhasil diperbarui")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah password")
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit User</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Ubah data pengguna ID: {id}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          {initialLoading ? (
            <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
          ) : (
            <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 max-w-2xl">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2 max-w-2xl">
                <Label htmlFor="username">Username</Label>
                <Input id="username" required value={formData.username} onChange={handleChange} />
              </div>
              <div className="space-y-2 max-w-2xl">
                <Label htmlFor="role_id">Role</Label>
                <Select value={formData.role_id} onValueChange={v => setFormData({ ...formData, role_id: v })} required>
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

              <div className="pt-4 border-t max-w-2xl">
                <h3 className="text-sm font-medium mb-4">Keamanan</h3>
                <Button type="button" variant="outline" onClick={handlePasswordChange}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Ubah Password Pengguna
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/admin/users">Batal</Link>
        </Button>
        <Button type="submit" form="user-form" disabled={loading || initialLoading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  )
}
