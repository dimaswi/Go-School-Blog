import type { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import { resolveAssetUrl } from "@/lib/runtime"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export type Ad = {
  id: number
  title: string
  image_url: string
  link_url: string
  position: string
  page_target: string
  target_post_id: number | null
  is_active: boolean
}

export const columns = (onDeleted: () => void, confirmAction: (msg: string, title?: string) => Promise<boolean>): ColumnDef<Ad>[] => {
  return [
    {
      id: "image",
      header: "Gambar",
      cell: ({ row }) => (
        <img src={resolveAssetUrl(row.original.image_url)} alt={row.original.title} className="h-12 w-auto max-w-[100px] object-cover rounded" />
      )
    },
    {
      accessorKey: "title",
      header: "Info Iklan",
      cell: ({ row }) => {
        const ad = row.original
        return (
          <div>
            <div className="font-medium text-slate-900 dark:text-white">{ad.title}</div>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                {ad.page_target === 'post' ? 'Post' : 'Beranda'}
              </span>
              {ad.link_url && (
                <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">
                  Link Tujuan
                </a>
              )}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "position",
      header: "Posisi",
      cell: ({ row }) => {
        const position = row.original.position
        let label = position
        if (position === 'below_slider_large') label = 'Bawah Slider (Besar)'
        else if (position === 'below_slider_small') label = 'Bawah Slider (Kecil)'
        else if (position === 'sidebar_1') label = 'Samping (Slot 1)'
        else if (position === 'sidebar_2') label = 'Samping (Slot 2)'
        else if (position === 'above_footer') label = 'Atas Footer'
        else if (position === 'atas_artikel') label = 'Atas Artikel'
        else if (position === 'bawah_artikel') label = 'Bawah Artikel'

        return <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{label}</span>
      }
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const ad = row.original
        return (
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
            ad.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {ad.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const ad = row.original

        const handleDelete = async () => {
          const confirmed = await confirmAction(`Hapus iklan "${ad.title}"?`, "Hapus Iklan");
          if (!confirmed) return
          
          try {
            const token = localStorage.getItem("token")
            await axios.delete(`${API_URL}/admin/ads/${ad.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Iklan berhasil dihapus")
            onDeleted()
          } catch (error) {
            toast.error("Gagal menghapus iklan")
            console.error(error)
          }
        }

        const handleToggleStatus = async () => {
           try {
              const token = localStorage.getItem("token")
              await axios.put(`${API_URL}/admin/ads/${ad.id}`, {
                title: ad.title,
                link_url: ad.link_url,
                position: ad.position,
                page_target: ad.page_target,
                target_post_id: ad.target_post_id,
                is_active: !ad.is_active
              }, {
                headers: { Authorization: `Bearer ${token}` }
              })
              toast.success("Status iklan berhasil diubah")
              onDeleted()
           } catch (error) {
              toast.error("Gagal mengubah status iklan")
           }
        }

        return (
          <div className="flex items-center gap-2 justify-end">
             <Button variant="outline" size="sm" onClick={handleToggleStatus} className={ad.is_active ? "text-amber-500 hover:text-amber-600" : "text-green-500 hover:text-green-600"}>
                {ad.is_active ? 'Nonaktifkan' : 'Aktifkan'}
             </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/ads/${ad.id}/edit`}>
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Edit Iklan</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete Iklan</span>
            </Button>
          </div>
        )
      }
    }
  ]
}
