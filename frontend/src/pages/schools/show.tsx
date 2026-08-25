import { useState, useEffect, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Edit, Building2, UserPlus, Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { getApiBase, getTenantUrl, resolveAssetUrl } from '@/lib/runtime'
import { DataTable } from "@/components/DataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { useAppDialog } from "@/context/AppDialogContext"

export default function SchoolShow() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [school, setSchool] = useState<any>(null)
  const [tenantUsers, setTenantUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("detail")
  const { alert } = useAppDialog()

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [assigning, setAssigning] = useState(false)

  const fetchUsers = async () => {
    try {
      const apiUrl = getApiBase()
      const token = localStorage.getItem("token")
      const res = await axios.get(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data)
    } catch (err) {
      console.error("Failed to fetch users:", err)
    }
  }

  useEffect(() => {
    if (isAssignModalOpen) {
      fetchUsers()
      setSelectedUserIds(tenantUsers.map(a => Number(a.ID || a.id)))
    }
  }, [isAssignModalOpen, tenantUsers])

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleAssignAdmin = async () => {
    setAssigning(true)
    try {
      const apiUrl = getApiBase()
      const token = localStorage.getItem("token")

      const currentAdminIds = tenantUsers.map(a => a.id)

      // Find who to add
      const toAdd = selectedUserIds.filter(id => !currentAdminIds.includes(id))
      // Find who to remove
      const toRemove = currentAdminIds.filter(id => !selectedUserIds.includes(id))

      // Perform adds
      for (const userId of toAdd) {
        await axios.post(`${apiUrl}/schools/${id}/assign-admin`, { user_id: Number(userId) }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      // Perform removes
      for (const userId of toRemove) {
        await axios.post(`${apiUrl}/schools/${id}/unassign-admin`, { user_id: Number(userId) }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      setIsAssignModalOpen(false)

      // Refresh school data
      const res = await axios.get(`${apiUrl}/schools/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.school) {
        setSchool(res.data.school)
        setTenantUsers(res.data.users || res.data.admins || [])
      }
    } catch (err: any) {
      console.error(err)
      await alert(err.response?.data?.message || "Gagal meng-update admin")
    } finally {
      setAssigning(false)
    }
  }

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const apiUrl = getApiBase()
        const token = localStorage.getItem("token")

        const res = await axios.get(`${apiUrl}/schools/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.data.school) {
          setSchool(res.data.school)
          setTenantUsers(res.data.users || res.data.admins || [])
        } else {
          setSchool(res.data)
        }
      } catch (err: any) {
        console.error("Failed to fetch school:", err)
        setError("Gagal memuat data sekolah.")
      } finally {
        setLoading(false)
      }
    }
    fetchSchool()
  }, [id])

  const userColumns: ColumnDef<any>[] = useMemo(() => [
    {
      id: "status",
      meta: { className: "w-[60px] text-center px-2" },
      header: "Status",
      cell: ({ row }) => {
        const u = row.original
        const isSelected = selectedUserIds.includes(Number(u.id))
        return (
          <div className="flex justify-center">
            {isSelected ? (
              <Check className="w-5 h-5 text-blue-600 stroke-[3]" />
            ) : (
              <X className="w-5 h-5 text-red-500 stroke-[3]" />
            )}
          </div>
        )
      }
    },
    {
      accessorKey: "name",
      header: "Pengguna",
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
              {u.name.substring(0, 2)}
            </div>
            <div className="flex flex-col">
              <label htmlFor={`user-${u.id}`} className="cursor-pointer font-medium text-slate-900 leading-tight">
                {u.name}
              </label>
              <span className="text-xs text-slate-500 mt-0.5">{u.username}</span>
            </div>
          </div>
        )
      }
    },
    {
      id: "select",
      meta: { className: "w-[60px] text-center px-2" },
      header: "Pilih",
      cell: ({ row }) => {
        const u = row.original
        const isSelected = selectedUserIds.includes(Number(u.id))
        return (
          <div className="flex justify-center">
            <Checkbox
              id={`user-${u.id}`}
              checked={isSelected}
              onCheckedChange={() => toggleUserSelection(Number(u.id))}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 w-5 h-5"
            />
          </div>
        )
      }
    }
  ], [selectedUserIds])

  const adminColumns: ColumnDef<any>[] = useMemo(() => [
    {
      id: "no",
      meta: { className: "w-[60px] text-center px-2" },
      header: "No",
      cell: ({ row }) => {
        return <div className="text-center font-medium text-slate-400">{row.index + 1}</div>
      }
    },
    {
      accessorKey: "name",
      header: "Profil User",
      cell: ({ row }) => {
        const admin = row.original
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
              {admin.name.substring(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">{admin.name}</span>
              <span className="text-xs text-slate-500 mt-0.5">{admin.username}</span>
            </div>
          </div>
        )
      }
    },
    {
      id: "role",
      header: () => <div className="text-right">Role</div>,
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
              {u.role || 'User'}
            </span>
          </div>
        )
      }
    }
  ], [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !school) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="text-red-500 mb-4">{error || "Sekolah tidak ditemukan"}</div>
        <Button asChild variant="outline">
          <Link to="/admin/schools">Kembali ke Daftar Sekolah</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 h-9 w-9 shrink-0">
            <Link to="/admin/schools">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          {school.logo ? (
            <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden">
              <img src={resolveAssetUrl(school.logo)} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{school.name}</h1>
            <p className="text-sm text-blue-600 mt-0.5">
              <a href={getTenantUrl(school.subdomain)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {getTenantUrl(school.subdomain).replace(/^https?:\/\//, '')}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col px-4 md:px-6 lg:px-8 flex-1 pt-2">

        <div className="w-full">
          <div className="flex border-b mb-2">
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors ${activeTab === 'detail' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('detail')}
            >
              Informasi Sekolah
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors ${activeTab === 'admin' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('admin')}
            >
              User Tenant
            </button>
          </div>

          {activeTab === 'detail' && (
            <div className="bg-white border border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">ID Sekolah</div>
                  <div className="text-base text-slate-900">{school.ID}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Tanggal Dibuat</div>
                  <div className="text-base text-slate-900">
                    {new Date(school.CreatedAt).toLocaleDateString("id-ID", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-slate-500 mb-1">Alamat Lengkap</div>
                  <div className="text-base text-slate-900 whitespace-pre-line">
                    {school.address || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="bg-white border border-slate-200 overflow-hidden w-full">
              <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Daftar User</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Kelola pengguna yang memiliki akses di sekolah ini.</p>
                </div>

                <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" /> Assign User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl sm:max-w-5xl w-full">
                    <DialogHeader>
                      <DialogTitle>Assign User</DialogTitle>
                      <DialogDescription>
                        Pilih user yang ada untuk ditugaskan di tenant {school.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 px-2 max-h-[60vh] overflow-y-auto">
                      <DataTable
                        columns={userColumns}
                        data={users}
                        enableSearch={true}
                        searchPlaceholder="Cari pengguna..."
                        emptyMessage="Pengguna tidak ditemukan."
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Batal</Button>
                      <Button onClick={handleAssignAdmin} disabled={assigning}>
                        {assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Simpan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="p-4 bg-white">
                <DataTable
                  columns={adminColumns}
                  data={tenantUsers}
                  enableSearch={true}
                  searchPlaceholder="Cari user..."
                  emptyMessage="Belum ada user yang ditugaskan."
                  emptySubMessage="Silakan assign user untuk tenant sekolah ini melalui tombol di atas."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/admin/schools">Kembali</Link>
        </Button>
        <Button asChild className="min-w-[140px]">
          <Link to={`/admin/schools/${school.ID}/edit`}>
            <Edit className="h-4 w-4 mr-2" /> Edit Sekolah
          </Link>
        </Button>
      </div>
    </div>
  )
}
