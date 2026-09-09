import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { resolveAssetUrl, getApiBase } from '@/lib/runtime';
import { AlertCircle, Home } from 'lucide-react';

interface SiteConfig {
  appName: string;
  schoolName: string;
  logoUrl: string;
  phone: string;
  email: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
}

const SiteConfigContext = createContext<SiteConfig | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>({
    appName: "Literasi Digital",
    schoolName: "Literasi Digital",
    logoUrl: "",
    phone: "",
    email: "",
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: ""
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Determine if we are on a subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isSubdomain = parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'domain' && parts[0] !== 'literasidigital';

      axios.get(`${getApiBase()}/site-config`)
        .then(res => {
          let newConfig = {
            appName: res.data.app_name || res.data.school_name || "Literasi Digital",
            schoolName: res.data.school_name || "Literasi Digital",
            logoUrl: (res.data?.logo_url || res.data?.logo) ? resolveAssetUrl(res.data.logo_url || res.data.logo) : "",
            phone: res.data?.phone || "",
            email: res.data?.email || "",
            facebook: res.data?.facebook || "",
            twitter: res.data?.twitter || "",
            instagram: res.data?.instagram || "",
            youtube: res.data?.youtube || ""
          };

          // If Super Admin, enforce title defaults but keep the contact info
          if (!isSubdomain) {
            newConfig.schoolName = newConfig.appName || "Literasi Digital";
            // Don't override logoUrl if it's already set via settings
          }

          setConfig(newConfig);

          // Update DOM dynamically
          const isAdminRoute = window.location.pathname.startsWith('/admin');
          document.title = isAdminRoute 
            ? `${newConfig.appName || newConfig.schoolName} - Admin Portal`
            : `${newConfig.appName || newConfig.schoolName}`;

          // Update favicon
          if (newConfig.logoUrl) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = newConfig.logoUrl;
          }
          setIsChecking(false);
      })
      .catch((err) => {
        if (err.response?.status === 404 && err.response?.data?.message === "Tenant not found") {
          setIsBlocked(true);
        }
        setIsChecking(false);
        console.error(err);
      });
  }, []);

  if (isBlocked) {
    const host = window.location.host;
    const protocol = window.location.protocol;
    const parts = host.split('.');
    const baseHost = parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'domain' && parts[0] !== 'literasidigital' 
      ? host.replace(/^[^.]+\./, "") 
      : host;
    const mainDomainUrl = `${protocol}//${baseHost}`;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 text-center">
        <div className="mb-8 flex flex-col items-center">
          <AlertCircle className="h-20 w-20 text-red-500 mb-6" />
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">404 - Subdomain Tidak Ditemukan</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg">
            Maaf, subdomain ini tidak terdaftar di sistem <strong>{config.appName}</strong>. 
          </p>
        </div>
        <a 
          href={mainDomainUrl} 
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          <Home className="h-5 w-5" />
          Kembali ke Halaman Utama
        </a>
      </div>
    );
  }

  if (isChecking) {
    return null; // Or a simple loading spinner
  }

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}
