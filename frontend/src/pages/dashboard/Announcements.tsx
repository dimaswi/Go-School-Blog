import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getApiBase } from '@/lib/runtime';
import { Button } from '@/components/ui/button';
import PageShell from '@/components/PageShell';
import { DataTable } from '@/components/DataTable';
import { useAppDialog } from '@/context/AppDialogContext';
import { getColumns, type Announcement } from './announcement-columns';
import { toast } from 'react-hot-toast';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const { confirm } = useAppDialog();

  const fetchAnnouncements = () => {
    setLoading(true);
    axios.get(`${getApiBase()}/announcements`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setAnnouncements(res.data.data || []))
      .catch(err => {
        console.error(err);
        toast.error("Gagal mengambil data pengumuman");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    axios.post(`${getApiBase()}/announcements`, { content: newContent }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setNewContent('');
      setIsAddOpen(false);
      toast.success("Pengumuman berhasil ditambahkan");
      fetchAnnouncements();
    }).catch(err => {
      console.error(err);
      toast.error("Gagal menambahkan pengumuman");
    });
  };

  const handleActivate = (id: number) => {
    axios.post(`${getApiBase()}/announcements/${id}/activate`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      toast.success("Pengumuman berhasil diaktifkan");
      fetchAnnouncements();
    }).catch(err => {
      console.error(err);
      toast.error("Gagal mengaktifkan pengumuman");
    });
  };

  const handleDeactivate = (id: number) => {
    axios.post(`${getApiBase()}/announcements/${id}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      toast.success("Pengumuman berhasil dinonaktifkan");
      fetchAnnouncements();
    }).catch(err => {
      console.error(err);
      toast.error("Gagal menonaktifkan pengumuman");
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm(
      "Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.",
      "Hapus Pengumuman"
    );
    
    if (!confirmed) return;

    axios.delete(`${getApiBase()}/announcements/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      toast.success("Pengumuman berhasil dihapus");
      fetchAnnouncements();
    }).catch(err => {
      console.error(err);
      toast.error("Gagal menghapus pengumuman");
    });
  };

  const columns = getColumns({
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
    onDelete: handleDelete,
  });

  return (
    <PageShell
      title="Pengumuman"
      description="Kelola pengumuman yang ditampilkan pada marquee halaman utama."
      actions={
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Tambah Pengumuman
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengumuman Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Isi Pengumuman</label>
                <textarea
                  className="w-full border rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Ketik pengumuman di sini..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={announcements}
            enableSearch={true}
            searchPlaceholder="Cari pengumuman..."
          />
        )}
      </div>
    </PageShell>
  );
}
