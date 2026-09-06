import { useEffect, useState } from "react"
import axios from "axios"
import { getColumns } from "./columns"
import type { User } from "./columns"
import { useAppDialog } from "@/context/AppDialogContext"
import { toast } from "react-hot-toast"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { getApiBase } from "@/lib/runtime"

export default function UsersIndex() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const { confirm } = useAppDialog()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const apiUrl = getApiBase()
      const token = localStorage.getItem("token")
      const response = await axios.get(`${apiUrl}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      setData(response.data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm(
      `Apakah Anda yakin ingin menghapus user "${name}"?`,
      "Hapus User"
    )

    if (isConfirmed) {
      try {
        const apiUrl = getApiBase()
        const token = localStorage.getItem("token")
        await axios.delete(`${apiUrl}/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        toast.success("User berhasil dihapus")
        fetchUsers()
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Gagal menghapus user")
        console.error("Failed to delete user:", error)
      }
    }
  }

  const columns = getColumns(handleDelete)

  return (
    <PageShell
      title="Manajemen User"
      description="Kelola daftar pengguna sistem dan hak akses mereka."
      actions={
        <Button asChild>
          <Link to="/admin/users/create">
            <Plus className="mr-2 h-4 w-4" /> Tambah User
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            enableSearch={true}
            searchPlaceholder="Cari nama atau username..."
          />
        )}
      </div>
    </PageShell>
  )
}
