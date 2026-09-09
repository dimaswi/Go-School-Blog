import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { useSiteConfig } from '@/context/SiteConfigContext';

export default function NotFound({ type = "page" }: { type?: "page" | "article" }) {
  const { appName, schoolName } = useSiteConfig();
  const name = appName || schoolName || 'Literasi Digital';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 text-center">
      <div className="mb-8 flex flex-col items-center">
        <FileQuestion className="h-20 w-20 text-slate-400 dark:text-slate-500 mb-6" />
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
          {type === "article" ? "404 - Artikel Tidak Ditemukan" : "404 - Halaman Tidak Ditemukan"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg mt-2">
          Maaf, {type === "article" ? "artikel" : "halaman"} yang Anda cari tidak tersedia di <strong>{name}</strong>.
        </p>
      </div>
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
      >
        <Home className="h-5 w-5" />
        Kembali ke Halaman Utama
      </Link>
    </div>
  );
}
