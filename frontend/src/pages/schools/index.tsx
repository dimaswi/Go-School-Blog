import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAppDialog } from "@/context/AppDialogContext"

export type School = {
  ID: number
  name: string
  subdomain: string
  address: string
  CreatedAt: string
}

export default function SchoolsIndex() {
  const [data, setData] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { confirm } = useAppDialog()

  const fetchSchools = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      const token = localStorage.getItem("token")
      const response = await axios.get(`${apiUrl}/schools`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(response.data)
    } catch (error) {
      console.error("Failed to fetch schools:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const handleDelete = async (id: number, name: string) => {
    const isConfirmed = await confirm(
      `Apakah Anda yakin ingin menghapus sekolah "${name}"? Semua data pengguna (termasuk admin) terkait tenant ini akan ikut terhapus.`,
      "Hapus Sekolah"
    )

    if (isConfirmed) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
        const token = localStorage.getItem("token")
        await axios.delete(`${apiUrl}/schools/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        fetchSchools() // Refresh data
      } catch (error) {
        console.error("Failed to delete school:", error)
      }
    }
  }

  const columns: ColumnDef<School>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Nama Sekolah",
    },
    {
      accessorKey: "subdomain",
      header: "Subdomain",
      cell: ({ row }) => {
        const subdomain = row.original.subdomain
        const url = `http://${subdomain}.localhost:5173`
        return (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            {subdomain}.localhost:5173
          </a>
        )
      }
    },
    {
      accessorKey: "address",
      header: "Alamat",
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const school = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/schools/${school.ID}`)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" /> Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/schools/${school.ID}/edit`)} className="cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                <Edit className="mr-2 h-4 w-4" /> Edit Sekolah
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(school.ID, school.name)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }
  ], [navigate, confirm])

  return (
    <PageShell
      title="Manajemen Sekolah"
      description="Kelola daftar tenant sekolah di dalam sistem."
      actions={
        <Button asChild>
          <Link to="/schools/create">
            <Plus className="mr-2 h-4 w-4" /> Tambah Sekolah
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
            searchPlaceholder="Cari sekolah..."
          />
        )}
      </div>
    </PageShell>
  )
}
