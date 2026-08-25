import { useEffect, useState } from 'react';
import axios from 'axios';
import { resolveAssetUrl, getApiBase, getTenantUrl } from '@/lib/runtime';

interface School {
  ID: number;
  name: string;
  subdomain: string;
  logo: string;
}

export default function PublicSchools() {
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    axios.get(`${getApiBase()}/public/schools`)
      .then(res => setSchools(res.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-l-4 border-blue-600 pl-3">
          Daftar Sekolah Terdaftar
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map(school => (
          <a
            key={school.ID}
            href={getTenantUrl(school.subdomain)}
            className="flex flex-col items-center p-6 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
          >
            {school.logo ? (
              <img src={resolveAssetUrl(school.logo)} alt={school.name} className="w-24 h-24 object-contain mb-4 group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#002855] flex items-center justify-center text-white text-3xl font-bold mb-4 group-hover:scale-105 transition-transform">
                {school.name.charAt(0)}
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center group-hover:text-blue-600 transition-colors">
              {school.name}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Kunjungi Web
            </p>
          </a>
        ))}

        {schools.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            Belum ada sekolah yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
}
