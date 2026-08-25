import type { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

export type Permission = {
  ID: string
  name: string
  description: string
}

export type Role = {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: "Role Name",
    cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    id: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const perms = row.original.permissions || []
      return (
        <div className="flex flex-wrap gap-1">
          {perms.slice(0, 3).map(p => (
            <Badge key={p.ID} variant="secondary" className="text-xs">{p.name}</Badge>
          ))}
          {perms.length > 3 && (
            <Badge variant="outline" className="text-xs">+{perms.length - 3} more</Badge>
          )}
        </div>
      )
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const role = row.original

      return (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/roles/${role.id}/edit`}>
              <Edit className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Edit Role</span>
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
