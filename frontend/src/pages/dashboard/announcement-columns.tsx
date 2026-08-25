import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Announcement = {
  ID: number
  content: string
  is_active: boolean
  created_at: string
}

interface ActionProps {
  onActivate: (id: number) => void
  onDeactivate: (id: number) => void
  onDelete: (id: number) => void
}

export const getColumns = ({ onActivate, onDeactivate, onDelete }: ActionProps): ColumnDef<Announcement>[] => [
  {
    accessorKey: "content",
    header: "Teks Pengumuman",
    cell: ({ row }) => (
      <div className="max-w-[400px] font-medium truncate">
        {row.original.content}
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}>
          {isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.ID
      const isActive = row.original.is_active
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            {!isActive ? (
              <DropdownMenuItem onClick={() => onActivate(id)}>
                <Power className="mr-2 h-4 w-4 text-green-600" />
                <span>Aktifkan</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onDeactivate(id)}>
                <PowerOff className="mr-2 h-4 w-4 text-slate-600" />
                <span>Nonaktifkan</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Hapus</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
