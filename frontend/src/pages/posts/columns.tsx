import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import { format } from "date-fns"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export type Post = {
  ID: number
  title: string
  slug: string
  status: string
  views: number
  category: {
    name: string
  }
  author: {
    name: string
  }
  school?: {
    name: string
  }
  published_at?: string
}

export const columns = (onDeleted: () => void, isSuperAdmin: boolean): ColumnDef<Post>[] => {
  const cols: ColumnDef<Post>[] = [
    {
      accessorKey: "title",
      header: "Judul",
      cell: ({ row }) => {
        return <div className="font-medium max-w-[250px] truncate" title={row.original.title}>{row.original.title}</div>
      }
    },
    {
      id: "category",
      header: "Rubrik",
      cell: ({ row }) => row.original.category?.name || "-"
    },
    {
      id: "author",
      header: "Penulis",
      cell: ({ row }) => row.original.author?.name || "-"
    }
  ]

  if (isSuperAdmin) {
    cols.push({
      id: "school",
      header: "Sekolah",
      cell: ({ row }) => row.original.school?.name || "-"
    })
  }

  cols.push(
    {
      accessorKey: "views",
      header: () => <div className="text-right">Views</div>,
      cell: ({ row }) => <div className="text-right">{row.original.views}</div>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
            status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {status}
          </span>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const post = row.original

        const handleDelete = async () => {
          if (!confirm(`Hapus artikel "${post.title}"?`)) return
          
          try {
            const token = localStorage.getItem("token")
            await axios.delete(`${API_URL}/posts/${post.ID}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Artikel berhasil dihapus")
            onDeleted()
          } catch (error) {
            toast.error("Gagal menghapus artikel")
            console.error(error)
          }
        }

        return (
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/posts/${post.ID}/edit`}>
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Edit Artikel</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete Artikel</span>
            </Button>
          </div>
        )
      }
    }
  )

  return cols
}
