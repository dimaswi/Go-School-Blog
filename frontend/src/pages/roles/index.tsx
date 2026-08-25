import { useState, useEffect } from "react"
import axios from "axios"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, X } from "lucide-react"
import { Link } from "react-router-dom"
import { columns } from "./columns"
import type { Role } from "./columns"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function RolesIndex() {
  const [data, setData] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData(response.data || [])
      } catch (error) {
        console.error("Failed to fetch roles", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRoles()
  }, [])

  const filtered = data.filter((r) => 
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageShell
      title="Manajemen Role"
      description="Kelola peran dan hak akses sistem."
      actions={
        <Button size="sm" asChild>
          <Link to="/admin/roles/create">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Role
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama role..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="h-9 pl-9 pr-9 shadow-xs bg-transparent" 
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">{filtered.length} total data</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </PageShell>
  )
}
