import { useEffect, useState } from "react"
import axios from "axios"
import { columns } from "./columns"
import type { User } from "./columns"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { getApiBase } from "@/lib/runtime"

export default function UsersIndex() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const apiUrl = getApiBase()
        const response = await axios.get(`${apiUrl}/users`)
        setData(response.data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

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
