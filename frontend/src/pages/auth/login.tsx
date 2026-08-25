import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  // Handle SSO via URL parameter `?token=...`
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ssoToken = params.get("token")
    if (ssoToken) {
      setIsLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      axios.get(`${apiUrl}/me`, {
        headers: { Authorization: `Bearer ${ssoToken}` }
      })
      .then(res => {
        login(ssoToken, res.data)
        navigate("/admin")
      })
      .catch(err => {
        console.error("SSO Login Failed", err)
        setError("Login otomatis (SSO) gagal. Silakan login manual.")
        setIsLoading(false)
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      const response = await axios.post(`${apiUrl}/auth/login`, {
        username,
        password,
      })

      const { token, user } = response.data
      login(token, user)
      navigate("/admin")
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError("Gagal melakukan login. Periksa koneksi Anda.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
          <CardDescription>
            Masukkan username dan password Anda untuk masuk ke sistem.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Masuk"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
