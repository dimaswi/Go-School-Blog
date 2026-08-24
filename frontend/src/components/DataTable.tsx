import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
  emptySubMessage?: string
  enableSearch?: boolean
  searchPlaceholder?: string
  extraFilters?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyMessage = "Data tidak ditemukan",
  emptySubMessage,
  enableSearch = false,
  searchPlaceholder = "Cari...",
  extraFilters,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      globalFilter,
      pagination,
    },
  })

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      {(enableSearch || extraFilters) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            {enableSearch && (
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-9 pr-9"
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
                {globalFilter && (
                  <button onClick={() => setGlobalFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {extraFilters}
          </div>
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">
            {table.getFilteredRowModel().rows.length} total data
          </p>
        </div>
      )}

      <div className="border rounded-none bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={`h-10 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${(header.column.columnDef.meta as any)?.className || ""}`}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && !data.length ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-4 py-2.5">
                      <div className="h-4 bg-muted/50 rounded-none animate-pulse w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`transition-colors hover:bg-muted/30 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={`px-4 py-1 ${(cell.column.columnDef.meta as any)?.className || ""}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {emptySubMessage && <p className="text-xs mt-1">{emptySubMessage}</p>}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(table.getPageCount() > 1 || table.getFilteredRowModel().rows.length > 10) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pt-2 pb-0">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground font-medium">
              Halaman <span className="text-foreground">{table.getState().pagination.pageIndex + 1}</span> dari {table.getPageCount()}
            </div>
            <div className="flex items-center gap-2 border-l pl-4">
              <p className="text-sm font-medium text-muted-foreground hidden sm:block">Tampilkan</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                {[10, 20, 30, 40, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
