import { useEffect, useRef } from "react"
import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useAppDialog } from "../context/AppDialogContext"

interface RoleRouteProps {
  permissions?: string[]
}

export default function RoleRoute({ permissions }: RoleRouteProps) {
  const { user } = useAuth()
  const dialog = useAppDialog()
  const navigate = useNavigate()
  const hasShownRef = useRef(false)
  
  // Check if user has any of the required permissions
  const isUnauthorized = Boolean(
    user && 
    permissions && 
    permissions.length > 0 && 
    !permissions.some(p => user.permissions?.includes(p))
  )
  
  const fallback = "/"

  useEffect(() => {
    if (!isUnauthorized || !user || hasShownRef.current) return
    hasShownRef.current = true
    const run = async () => {
      await dialog.alert("Anda tidak memiliki akses ke fitur ini.", "Akses Ditolak")
      navigate(fallback, { replace: true })
    }
    run()
  }, [isUnauthorized, user, dialog, navigate, fallback])

  if (!user) return <Navigate to="/admin/login" replace />
  if (isUnauthorized) return null

  return <Outlet />
}
