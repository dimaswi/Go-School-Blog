import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveAssetUrl, getApiBase } from '@/lib/runtime';

export default function SettingsIndex() {
  const [loading, setLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    app_name: '',
    phone: '',
    email: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    name: '',
    subdomain: '',
    address: '',
    logo: ''
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isSub = parts.length > 2 && parts[0] !== 'www';
    setIsSuperAdmin(!isSub);

    if (!isSub) {
      // Super Admin: Fetch global settings
      axios.get(`${getApiBase()}/settings`, { withCredentials: true })
        .then(res => {
          setFormData(prev => ({
            ...prev,
            app_name: res.data.app_name || '',
            phone: res.data.phone || '',
            email: res.data.email || '',
            facebook: res.data.facebook || '',
            twitter: res.data.twitter || '',
            instagram: res.data.instagram || '',
            youtube: res.data.youtube || '',
            logo: res.data.logo_url || res.data.logo || ''
          }));
        })
        .catch(err => {
          toast.error("Gagal mengambil pengaturan global");
          console.error(err);
        });
    } else {
      // School Admin: Fetch from /site-config
      axios.get(`${getApiBase()}/site-config`, { withCredentials: true })
        .then(res => {
          setFormData(prev => ({
            ...prev,
            phone: res.data.phone || '',
            email: res.data.email || '',
            facebook: res.data.facebook || '',
            twitter: res.data.twitter || '',
            instagram: res.data.instagram || '',
            youtube: res.data.youtube || ''
          }));
        })
        .catch(console.error);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file melebihi batas (Maksimal 2MB)");
      return;
    }
    
    const uploadData = new FormData();
    uploadData.append("file", file);

    setUploadingLogo(true);

    try {
      const apiUrl = getApiBase();
      const token = localStorage.getItem("token");
      
      const res = await axios.post(`${apiUrl}/upload`, uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData(prev => ({ ...prev, logo: res.data.url }));
      toast.success("Logo berhasil diunggah");
    } catch (err: any) {
      console.error("Failed to upload logo:", err);
      toast.error("Gagal mengunggah logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSuperAdmin) {
        await axios.put(`${getApiBase()}/settings`, formData, { withCredentials: true });
        toast.success("Pengaturan berhasil disimpan");
      } else {
        await axios.put(`${getApiBase()}/settings/school`, formData, { withCredentials: true });
        toast.success("Pengaturan berhasil disimpan");
      }
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Kontak & Media Sosial</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Atur informasi kontak yang akan ditampilkan di web publik.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 w-full">
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Misal: 08123456789" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Misal: info@sekolah.com" />
              </div>
            </div>

            {isSuperAdmin && (
              <>
                <div className="space-y-2 mt-6">
                  <Label htmlFor="app_name">Nama Aplikasi (Khusus Utama)</Label>
                  <Input id="app_name" name="app_name" value={formData.app_name} onChange={handleChange} placeholder="Misal: Literasi Digital" />
                </div>
                <div className="space-y-2 border-b border-slate-100 pb-6 mt-4">
                  <Label htmlFor="logo">Logo Aplikasi (Khusus Utama)</Label>
                <div className="flex items-center gap-4 mt-2">
                  {formData.logo && (
                    <div className="h-16 w-16 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                      <img src={resolveAssetUrl(formData.logo)} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input id="logo" name="logo" type="file" accept="image/*" onChange={handleFileChange} disabled={uploadingLogo} className="cursor-pointer" />
                    <p className="text-xs text-slate-500 mt-1">Pilih gambar untuk mengunggah dan mengganti logo utama.</p>
                  </div>
                  {uploadingLogo && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </div>
              </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input id="facebook" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="https://facebook.com/..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X URL</Label>
              <Input id="twitter" name="twitter" value={formData.twitter} onChange={handleChange} placeholder="https://twitter.com/..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="https://instagram.com/..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube URL</Label>
              <Input id="youtube" name="youtube" value={formData.youtube} onChange={handleChange} placeholder="https://youtube.com/..." />
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/admin">Batal</Link>
        </Button>
        <Button type="submit" form="settings-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}
