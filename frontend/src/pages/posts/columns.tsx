import type { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash, Send, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"


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
  main_domain_status?: string
}

export const columns = (
  onDeleted: () => void, 
  isSuperAdmin: boolean, 
  isSchoolAdmin: boolean,
  confirmAction: (msg: string, title?: string) => Promise<boolean>,
  handleMainDomainAction: (postId: number, action: 'request' | 'approve' | 'reject') => Promise<void>,
  handleSchoolAction: (postId: number, action: 'submit' | 'approve' | 'reject') => Promise<void>
): ColumnDef<Post>[] => {
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
        const mStatus = row.original.main_domain_status
        return (
          <div className="flex flex-wrap gap-1 items-center">
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
              status === 'published' ? 'bg-green-100 text-green-700' : 
              status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {status}
            </span>
            {mStatus && mStatus !== 'none' && (
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                mStatus === 'approved' ? 'bg-blue-100 text-blue-700' : 
                mStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                Pusat: {mStatus}
              </span>
            )}
          </div>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const post = row.original

        const handleDelete = async () => {
          const confirmed = await confirmAction(`Hapus artikel "${post.title}"?`, "Hapus Artikel");
          if (!confirmed) return
          
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
            {/* Actions for Main Domain Request */}
            {isSuperAdmin ? (
              // Super Admin viewing a pending request
              post.main_domain_status === 'pending' && (
                <>
                  <Button variant="outline" size="icon" onClick={() => handleMainDomainAction(post.ID, 'approve')} className="h-8 w-8 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100" title="Setujui (Main Domain)">
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Setujui</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleMainDomainAction(post.ID, 'reject')} className="h-8 w-8 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100" title="Tolak (Main Domain)">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Tolak</span>
                  </Button>
                </>
              )
            ) : isSchoolAdmin ? (
              // Tenant Admin Actions
              <>
                {post.status === 'pending' && (
                  <>
                    <Button variant="outline" size="icon" onClick={() => handleSchoolAction(post.ID, 'approve')} className="h-8 w-8 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100" title="Setujui Artikel">
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Setujui</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleSchoolAction(post.ID, 'reject')} className="h-8 w-8 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100" title="Tolak Artikel">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Tolak</span>
                    </Button>
                  </>
                )}
                {post.status === 'published' && (post.main_domain_status === 'none' || post.main_domain_status === 'rejected') && (
                  <Button variant="outline" size="icon" onClick={() => handleMainDomainAction(post.ID, 'request')} className="h-8 w-8 text-blue-600 hover:text-blue-700" title="Ajukan ke Pusat">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Ajukan ke Pusat</span>
                  </Button>
                )}
              </>
            ) : (
              // Regular User Actions
              post.status === 'draft' && (
                <Button variant="outline" size="icon" onClick={() => handleSchoolAction(post.ID, 'submit')} className="h-8 w-8 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100" title="Ajukan ke Admin Sekolah">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Ajukan ke Admin</span>
                </Button>
              )
            )}

            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link to={`/admin/posts/${post.ID}/edit`}>
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Edit Artikel</span>
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-600">
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
