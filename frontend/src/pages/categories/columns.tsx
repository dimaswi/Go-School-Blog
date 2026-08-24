import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Trash, CornerDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export type Category = {
  ID: number
  name: string
  slug: string
  parent_id?: number
  is_school_list?: boolean
  parent?: Category
}

export const columns = (onDeleted: () => void): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    header: "Nama Rubrik",
    cell: ({ row }) => {
      const isChild = !!row.original.parent_id
      return (
        <div className={`flex items-center gap-2 ${isChild ? "ml-6 text-muted-foreground" : "font-medium"}`}>
          {isChild && <CornerDownRight className="h-4 w-4 text-muted-foreground/50" />}
          <span>{row.original.name}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => {
      return (
        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">
          {row.original.slug}
        </span>
      )
    }
  },
  {
    accessorKey: "parent",
    header: "Level / Induk Nav",
    cell: ({ row }) => {
      const parent = row.original.parent
      if (parent) {
        return <span className="text-sm text-slate-600">Sub-Nav dari: <strong>{parent.name}</strong></span>
      }
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Main Nav</span>
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const category = row.original

      const handleDelete = async () => {
        if (!confirm(`Hapus rubrik ${category.name}?`)) return
        
        try {
          const token = localStorage.getItem("token")
          await axios.delete(`${API_URL}/categories/${category.ID}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          toast.success("Kategori berhasil dihapus")
          onDeleted()
        } catch (error) {
          toast.error("Gagal menghapus kategori")
          console.error(error)
        }
      }

      return (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/categories/${category.ID}/edit`}>
              <Edit className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Edit Kategori</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600">
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete Kategori</span>
          </Button>
        </div>
      )
    }
  }
]
