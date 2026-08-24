import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export type User = {
  id: string
  name: string
  username: string
  role: string
  school?: string
  subdomain?: string
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "subdomain",
    header: "Subdomain/Sekolah",
    cell: ({ row }) => {
      const user = row.original
      if (!user.subdomain) return <span className="text-gray-400">-</span>
      
      const protocol = window.location.protocol
      const host = window.location.host
      let tenantUrl = ""
      
      if (host.includes("localhost") || host.includes("127.0.0.1")) {
        // Handle localhost cases like admin.localhost:5173 or just localhost:5173
        const baseHost = host.replace(/^[^.]+\./, "") // admin.localhost:5173 -> localhost:5173
        tenantUrl = `${protocol}//${user.subdomain}.${baseHost.includes("localhost") ? baseHost : "localhost:5173"}`
      } else {
        // Production: replace current subdomain with tenant subdomain
        const baseDomain = host.substring(host.indexOf(".") + 1)
        tenantUrl = `${protocol}//${user.subdomain}.${baseDomain}`
      }

      return (
        <div className="flex flex-col">
          <a href={tenantUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
            {user.subdomain}
          </a>
          <span className="text-xs text-slate-500">{user.school}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/users/${user.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">View Details</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/users/${user.id}/edit`}>
              <Edit className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Edit User</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      )
    },
  },
]
