import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { resolveAssetUrl } from '@/lib/runtime';

interface SiteConfig {
  schoolName: string;
  logoUrl: string;
}

const SiteConfigContext = createContext<SiteConfig | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>({
    schoolName: "SiAK",
    logoUrl: ""
  });

  useEffect(() => {
    // Determine if we are on a subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isSubdomain = parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'domain';

    axios.get("http://localhost:8080/api/site-config")
      .then(res => {
        let newName = "SiAK";
        let newLogo = "";

        if (res.data?.school_name) {
          newName = res.data.school_name;
        }
        if (res.data?.logo_url) {
          newLogo = resolveAssetUrl(res.data.logo_url);
        }

        // If Super Admin, enforce defaults visually except title might just be SiAK Admin Portal
        if (!isSubdomain) {
          newName = "SiAK";
          newLogo = "";
        }

        setConfig({ schoolName: newName, logoUrl: newLogo });

        // Update DOM dynamically
        document.title = `${newName} - Admin Portal`;

        // Update favicon
        if (newLogo) {
          const img = new Image();
          img.crossOrigin = "Anonymous"; // In case of CORS
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const size = Math.max(img.width, img.height);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const x = (size - img.width) / 2;
              const y = (size - img.height) / 2;
              ctx.drawImage(img, x, y);
              
              const dataUrl = canvas.toDataURL("image/png");
              const existingLinks = document.querySelectorAll("link[rel~='icon']");
              existingLinks.forEach(l => l.remove());
    
              const newLink = document.createElement('link');
              newLink.rel = 'icon';
              newLink.href = dataUrl;
              document.head.appendChild(newLink);
            }
          };
          img.src = newLogo;
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
