import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { resolveAssetUrl, getApiBase } from '@/lib/runtime';

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

  useEffect(() => {
    // Determine if we are on a subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isSubdomain = parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'domain';

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
      })
      .catch(console.error);
  }, []);

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
