import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import {
  Plus, Edit, Trash2, GripVertical, ChevronRight,
  Folder, FolderOpen, FileText, Loader2, FolderTree, School,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import type { Category } from "./columns"
import {
  DragDropContext, Droppable, Draggable,
  type DropResult,
} from "@hello-pangea/dnd"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

type FlatNode = {
  id: number
  name: string
  slug: string
  parent_id: number | null
  is_school_list: boolean
  children: FlatNode[]
}

function buildTree(categories: Category[]): FlatNode[] {
  const map = new Map<number, FlatNode>()
  categories.forEach((c) =>
    map.set(c.ID, { id: c.ID, name: c.name, slug: c.slug, parent_id: c.parent_id ?? null, is_school_list: !!c.is_school_list, children: [] })
  )
  const roots: FlatNode[] = []
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

function flattenVisible(
  nodes: FlatNode[],
  collapsed: Set<number>,
  depth = 0
): Array<{ node: FlatNode; depth: number }> {
  const result: Array<{ node: FlatNode; depth: number }> = []
  for (const node of nodes) {
    result.push({ node, depth })
    if (node.children.length > 0 && !collapsed.has(node.id)) {
      result.push(...flattenVisible(node.children, collapsed, depth + 1))
    }
  }
  return result
}

export default function CategoriesIndex() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tree, setTree] = useState<FlatNode[]>([])
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const raw: Category[] = res.data || []
      setCategories(raw)
      setTree(buildTree(raw))
    } catch {
      toast.error("Gagal memuat kategori")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDelete = async (cat: FlatNode) => {
    if (!confirm(`Hapus rubrik "${cat.name}"?`)) return
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_URL}/categories/${cat.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Rubrik dihapus")
      fetchCategories()
    } catch {
      toast.error("Gagal menghapus rubrik")
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result
    if (source.index === destination.index) return

    // Reorder the flat visible list
    const flat = flattenVisible(tree, collapsed)
    const items = [...flat]
    const [moved] = items.splice(source.index, 1)
    items.splice(destination.index, 0, moved)

    // Infer new parent_id for each item from its position in the flat list:
    // A depth-1 item's parent = nearest item above it with depth 0.
    // A depth-0 item has no parent.
    const newCats: Category[] = items.map(({ node, depth }, i) => {
      const original = categories.find((c) => c.ID === node.id)!
      if (depth === 0) {
        return { ...original, parent_id: undefined }
      }
      // Find nearest ancestor above with depth - 1
      for (let j = i - 1; j >= 0; j--) {
        if (items[j].depth === depth - 1) {
          return { ...original, parent_id: items[j].node.id }
        }
      }
      // Fallback: no parent found, promote to root
      return { ...original, parent_id: undefined }
    })

    setCategories(newCats)
    setTree(buildTree(newCats))

    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const payload = newCats.map((c, i) => ({ id: c.ID, parent_id: c.parent_id ?? null, position: i }))
      await axios.put(`${API_URL}/categories/reorder`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Urutan disimpan", { id: "reorder" })
    } catch {
      toast.error("Gagal menyimpan urutan")
      fetchCategories()
    } finally {
      setSaving(false)
    }
  }

  const flatItems = flattenVisible(tree, collapsed)

  return (
    <PageShell
      title="Manajemen Rubrik"
      description="Kelola kategori rubrik artikel. Drag & drop untuk mengubah urutan dan hierarki."
      actions={
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Menyimpan...
            </span>
          )}
          <Button size="sm" asChild>
            <Link to="/categories/create">
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Rubrik
            </Link>
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="text-sm text-slate-400">Memuat data...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FolderTree className="h-8 w-8 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Belum ada rubrik</p>
            <p className="text-xs text-slate-400 mt-0.5">Mulai dengan menambah rubrik baru</p>
          </div>
          <Button size="sm" asChild>
            <Link to="/categories/create">
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Rubrik
            </Link>
          </Button>
        </div>
      ) : (
        <div className="w-full">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable
              droppableId="flat-list"
              renderClone={(provided, _snap, rubric) => {
                const { node, depth } = flatItems[rubric.source.index]
                const hasChildren = node.children.length > 0
                const isCollapsed = collapsed.has(node.id)
                return (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style as React.CSSProperties}
                    className="mb-2"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl border-indigo-300 bg-white ring-2 ring-indigo-200 cursor-grabbing">
                      <div className="shrink-0 text-indigo-400"><GripVertical className="h-4 w-4" /></div>
                      {/* Icon */}
                      <div className="shrink-0">
                        {depth === 0 ? (
                          hasChildren ? (
                            isCollapsed
                              ? <Folder className="h-5 w-5 text-amber-500" />
                              : <FolderOpen className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Folder className="h-5 w-5 text-amber-500" />
                          )
                        ) : (
                          <FileText className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      {/* Text */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-slate-800 truncate">{node.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 truncate">{node.slug}</span>
                      </div>
                      {/* Badge */}
                      {depth === 0 ? (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-wider">Utama</span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">Sub</span>
                      )}
                    </div>
                  </div>
                )
              }}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[60px] transition-all duration-200 ${snapshot.isDraggingOver ? "bg-indigo-50/40" : ""
                    }`}
                >
                  {flatItems.map(({ node, depth }, index) => {
                    const isCollapsed = collapsed.has(node.id)
                    const hasChildren = node.children.length > 0
                    const indent = depth * 32

                    return (
                      <Draggable key={`cat-${node.id}`} draggableId={`cat-${node.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={provided.draggableProps.style as React.CSSProperties}
                            className="mb-2"
                          >
                            {/* Indent wrapper */}
                            <div style={{ marginLeft: `${indent}px` }}>
                              <div
                                {...provided.dragHandleProps}
                                className={[
                                  "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing",
                                  snapshot.isDragging
                                    ? "opacity-30 bg-slate-100 border-slate-200 shadow-none"
                                    : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md",
                                ].join(" ")}
                              >
                                {/* Drag handle */}
                                <div className="shrink-0 text-slate-300 group-hover:text-indigo-400 transition-colors">
                                  <GripVertical className="h-4 w-4" />
                                </div>

                                {/* Collapse toggle */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); hasChildren && toggleCollapse(node.id) }}
                                  className={[
                                    "shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors",
                                    hasChildren ? "hover:bg-slate-100 cursor-pointer" : "pointer-events-none opacity-0",
                                  ].join(" ")}
                                >
                                  {hasChildren && (
                                    <ChevronRight
                                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"
                                        }`}
                                    />
                                  )}
                                </button>

                                {/* Icon */}
                                <div className="shrink-0">
                                  {depth === 0 ? (
                                    hasChildren ? (
                                      isCollapsed
                                        ? <Folder className="h-5 w-5 text-amber-500" />
                                        : <FolderOpen className="h-5 w-5 text-amber-400" />
                                    ) : (
                                      <Folder className="h-5 w-5 text-amber-500" />
                                    )
                                  ) : (
                                    <FileText className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>

                                {/* Text */}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className={`text-sm truncate ${depth === 0 ? "font-bold text-slate-800" : "font-medium text-slate-700"
                                    }`}>
                                    {node.name}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400 truncate">
                                    {node.slug}
                                  </span>
                                </div>

                                {/* Badge */}
                                <div className="flex gap-2">
                                  {node.is_school_list && (
                                    <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-600 uppercase tracking-wider">
                                      <School className="h-3 w-3" /> List Sekolah
                                    </span>
                                  )}
                                  {depth === 0 ? (
                                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-wider">
                                      Utama
                                    </span>
                                  ) : (
                                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
                                      Sub
                                    </span>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                                    asChild
                                  >
                                    <Link to={`/categories/${node.id}/edit`}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
                                    onClick={() => handleDelete(node)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </PageShell>
  )
}
