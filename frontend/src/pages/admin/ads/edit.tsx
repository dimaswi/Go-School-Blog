import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate, Link, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { resolveAssetUrl } from "@/lib/runtime"
import { SearchableSelect } from "@/components/SearchableSelect"
import { OrientationWarningModal } from "@/components/OrientationWarningModal"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function AdEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [existingAds, setExistingAds] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    link_url: "",
    position: "below_slider_large",
    image_url: "",
    page_target: "home",
    target_post_id: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait' | 'square' | null>(null)
  const [showOrientationWarning, setShowOrientationWarning] = useState(false)

  // Portrait-only positions (sidebar)
  const portraitPositions = ['sidebar_1', 'sidebar_2']
  // Landscape-only positions (banners)
  const landscapePositions = ['below_slider_large', 'below_slider_small', 'above_footer', 'atas_artikel', 'bawah_artikel']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile && selectedFile.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file melebihi batas (Maksimal 2MB)");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile)
    setImageOrientation(null)
    setShowOrientationWarning(false)
    if (!selectedFile) return
    const url = URL.createObjectURL(selectedFile)
    const img = new Image()
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight
      const orientation = ratio > 1.1 ? 'landscape' : ratio < 0.9 ? 'portrait' : 'square'
      setImageOrientation(orientation)
      if (orientation === 'portrait' && landscapePositions.includes(formData.position)) {
        setShowOrientationWarning(true)
        setFormData(prev => ({ ...prev, position: 'sidebar_1' }))
      } else if (orientation === 'landscape' && portraitPositions.includes(formData.position)) {
        setShowOrientationWarning(true)
        setFormData(prev => ({ ...prev, position: 'below_slider_large' }))
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${API_URL}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPosts(res.data || [])
      } catch (err) {
        console.error("Failed to fetch posts", err)
      }
    }
    fetchPosts()
  }, [])

  useEffect(() => {
    const fetchExistingAds = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${API_URL}/admin/ads`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExistingAds(res.data || [])
      } catch (err) {
        console.error("Failed to fetch existing ads", err)
      }
    }
    fetchExistingAds()
  }, [])

  // Taken positions, excluding the current ad (self) being edited
  const takenHomePositions = existingAds
    .filter(ad => ad.is_active && ad.page_target === 'home' && String(ad.id) !== id)
    .map(ad => ad.position)

  const takenPostPositions = formData.target_post_id
    ? existingAds
        .filter(ad => ad.is_active && ad.page_target === 'post' && String(ad.target_post_id) === formData.target_post_id && String(ad.id) !== id)
        .map(ad => ad.position)
    : []

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/admin/ads/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = response.data
        if (data) {
          setFormData({
            title: data.title || "",
            link_url: data.link_url || "",
            position: data.position || "below_slider_large",
            image_url: data.image_url || "",
            page_target: data.page_target || "home",
            target_post_id: data.target_post_id ? data.target_post_id.toString() : "",
          })
        }
      } catch (error) {
        toast.error("Gagal memuat data iklan")
        navigate("/admin/ads")
      } finally {
        setFetching(false)
      }
    }
    
    if (id) {
      fetchAd()
    }
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      let imageUrl = formData.image_url
      if (file) {
        const uploadData = new FormData()
        uploadData.append("file", file)
        const uploadRes = await axios.post(`${API_URL}/upload`, uploadData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        })
        imageUrl = uploadRes.data.url
      }

      const adData = {
        title: formData.title,
        link_url: formData.link_url,
        position: formData.position,
        image_url: imageUrl,
        page_target: formData.page_target,
        target_post_id: formData.page_target === "post" && formData.target_post_id ? parseInt(formData.target_post_id) : null,
      }

      await axios.put(`${API_URL}/admin/ads/${id}`, adData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      })
      toast.success("Iklan berhasil diperbarui")
      navigate("/admin/ads")
    } catch (error) {
      toast.error("Gagal memperbarui iklan")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <PageShell
      title="Edit Iklan"
      description="Ubah informasi atau gambar iklan."
      footer={
        <>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/ads">Batal</Link>
          </Button>
          <Button
            type="submit"
            form="ad-form"
            disabled={loading || (imageOrientation !== null && imageOrientation !== 'square' && (
              (imageOrientation === 'portrait' && landscapePositions.includes(formData.position)) ||
              (imageOrientation === 'landscape' && portraitPositions.includes(formData.position))
            ))}
            className="min-w-[140px]"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </>
      }
    >
      <OrientationWarningModal
        orientation={showOrientationWarning ? imageOrientation : null}
        onClose={() => setShowOrientationWarning(false)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <form id="ad-form" onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="title">Judul / Nama Iklan</Label>
            <Input 
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Promo Pendaftaran 2026"
            />
          </div>

        <div className="space-y-2">
          <Label htmlFor="page_target">Target Halaman</Label>
          <select 
            id="page_target"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.page_target}
            onChange={(e) => {
              const page_target = e.target.value
              setFormData({ 
                ...formData, 
                page_target, 
                position: page_target === 'home' ? 'below_slider_large' : 'atas_artikel' 
              })
            }}
          >
            <option value="home">Beranda & Kategori</option>
            <option value="post">Spesifik Artikel (Post)</option>
          </select>
        </div>

        {formData.page_target === "post" && (
          <div className="space-y-2">
            <Label htmlFor="target_post_id">Pilih Artikel</Label>
            <SearchableSelect
              id="target_post_id"
              options={posts.map(p => ({ 
                value: String(p.ID), 
                label: `${p.title} — oleh ${p.author?.name || 'Admin'}` 
              }))}
              value={formData.target_post_id}
              onChange={(val) => setFormData({ ...formData, target_post_id: val })}
              placeholder="-- Pilih Artikel --"
              searchPlaceholder="Ketik judul artikel..."
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="position">Posisi</Label>
          <select 
            id="position"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          >
            {formData.page_target === "home" ? (
              <>
                {[
                  { value: 'below_slider_large', label: 'Bawah Slider (Besar Panjang)' },
                  { value: 'below_slider_small', label: 'Bawah Slider (Kecil Panjang)' },
                  { value: 'sidebar_1', label: 'Samping (Slot 1)' },
                  { value: 'sidebar_2', label: 'Samping (Slot 2)' },
                  { value: 'above_footer', label: 'Atas Footer (Kecil Panjang)' },
                ].map(opt => (
                  <option key={opt.value} value={opt.value} disabled={takenHomePositions.includes(opt.value)}>
                    {opt.label}{takenHomePositions.includes(opt.value) ? ' — Sudah Terisi' : ''}
                  </option>
                ))}
              </>
            ) : (
              <>
                {[
                  { value: 'atas_artikel', label: 'Atas Artikel' },
                  { value: 'bawah_artikel', label: 'Bawah Artikel' },
                ].map(opt => (
                  <option key={opt.value} value={opt.value} disabled={takenPostPositions.includes(opt.value)}>
                    {opt.label}{takenPostPositions.includes(opt.value) ? ' — Sudah Terisi' : ''}
                  </option>
                ))}
              </>
            )}
          </select>
          {(formData.page_target === 'home' ? takenHomePositions : takenPostPositions).includes(formData.position) && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠ Posisi ini sudah terisi iklan aktif. Pilih posisi lain.
            </p>
          )}
          <p className="text-xs text-muted-foreground">Ukuran gambar akan otomatis menyesuaikan posisi (fit).</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="link_url">Link Tujuan (Opsional)</Label>
          <Input 
            id="link_url"
            type="url"
            value={formData.link_url}
            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Gambar Iklan</Label>
          {formData.image_url && (
            <div className="mb-2">
               <img src={resolveAssetUrl(formData.image_url)} alt="Current Ad" className="h-24 w-auto max-w-[200px] object-contain border rounded-md" />
            </div>
          )}
          <Input 
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground mt-1">Biarkan kosong jika tidak ingin mengubah gambar.</p>
          </div>
          </form>
        </div>

        <div className="space-y-6">
          {/* Dynamic size guide based on selected position */}
          {(() => {
            const guides: Record<string, { title: string; width: string; height: string; ratio: string; note: string }> = {
              below_slider_large: { title: 'Bawah Slider (Besar Panjang)', width: '1200px', height: 'maks. 250px', ratio: '21:9 atau lebih lebar', note: 'Spanduk banner lebar penuh, tampil paling menonjol.' },
              below_slider_small: { title: 'Bawah Slider (Kecil Panjang)', width: '1200px', height: 'maks. 150px', ratio: '8:1 atau lebih lebar', note: 'Banner ramping di bawah banner besar.' },
              sidebar_1: { title: 'Samping — Slot 1', width: '400px', height: '400–500px', ratio: '1:1 atau 4:5 (vertikal)', note: 'Tampil di sidebar kanan halaman beranda.' },
              sidebar_2: { title: 'Samping — Slot 2', width: '400px', height: '400–500px', ratio: '1:1 atau 4:5 (vertikal)', note: 'Slot sidebar kedua di bawah Slot 1.' },
              above_footer: { title: 'Atas Footer', width: '1200px', height: 'maks. 150px', ratio: '8:1 atau lebih lebar', note: 'Banner panjang tepat di atas footer.' },
              atas_artikel: { title: 'Atas Artikel', width: '800px', height: 'maks. 250px', ratio: '16:5 atau lebih lebar', note: 'Tampil sebelum isi konten artikel.' },
              bawah_artikel: { title: 'Bawah Artikel', width: '800px', height: 'maks. 250px', ratio: '16:5 atau lebih lebar', note: 'Tampil setelah isi konten artikel selesai.' },
            }
            const g = guides[formData.position]
            return g ? (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">📐</span>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Panduan Ukuran: {g.title}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-900">
                    <div className="text-xs text-slate-400 mb-1">Lebar</div>
                    <div className="font-bold text-slate-800 dark:text-white text-base">{g.width}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-900">
                    <div className="text-xs text-slate-400 mb-1">Tinggi</div>
                    <div className="font-bold text-slate-800 dark:text-white text-base">{g.height}</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-blue-100 dark:border-blue-900 mb-2">
                  <span className="text-xs text-slate-400">Rasio ideal: </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{g.ratio}</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">{g.note}</p>
              </div>
            ) : null
          })()}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-sm mb-3">💡 Tips Upload</h3>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li>• Format: <b>JPG, PNG, WebP</b></li>
              <li>• Maks. ukuran file: <b>2 MB</b></li>
              <li>• Gunakan gambar tajam &amp; tidak buram</li>
              <li>• Hindari teks terlalu kecil di gambar</li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
