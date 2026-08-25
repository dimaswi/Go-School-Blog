import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { Search, Moon, Sun, Phone, ChevronDown, Mail, Check, Megaphone, Menu, X } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { getApiBase, getTenantUrl } from '@/lib/runtime';

const FacebookIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const TwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
);
const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
);
const YoutubeIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>
);
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Category {
  ID: number;
  name: string;
  slug: string;
  parent_id: number | null;
  is_school_list: boolean;
  children?: Category[];
}

interface School {
  ID: number;
  name: string;
  subdomain: string;
  logo: string;
}

export default function BlogLayout() {
  const { appName, schoolName, logoUrl, phone, email, facebook, twitter, instagram, youtube } = useSiteConfig();
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Check dark mode
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // Fetch categories
    axios.get(`${getApiBase()}/public/categories`)
      .then(res => {
        const allCats: Category[] = res.data || [];
        const map = new Map<number, Category>();

        allCats.forEach(c => map.set(c.ID, { ...c, children: [] }));

        const topLevel: Category[] = [];
        map.forEach(c => {
          if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.children!.push(c);
          } else {
            topLevel.push(c);
          }
        });

        setCategories(topLevel);
      })
      .catch(console.error);

    // Fetch public schools
    axios.get(`${getApiBase()}/public/schools`)
      .then(res => setSchools(res.data || []))
      .catch(console.error);

    // Fetch active announcement
    axios.get(`${getApiBase()}/public/announcement`)
      .then((res) => {
        if (res.data.data) {
          setAnnouncement(res.data.data.content);
        }
      })
      .catch((err) => console.error("Gagal mengambil pengumuman", err));
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      axios.get(`http://localhost:8080/api/public/posts?search=${encodeURIComponent(searchQuery)}&limit=10`)
        .then(res => {
          setSearchResults(res.data.data || []);
        })
        .catch(err => console.error(err))
        .finally(() => setIsSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Top Bar */}
      <div className="bg-[#002855] text-white py-3 shadow-sm z-50 relative">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 overflow-hidden pr-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-6 sm:h-8 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow flex items-center justify-center font-extrabold text-sm sm:text-lg group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/20">
                {appName ? appName.charAt(0) : (schoolName ? schoolName.charAt(0) : 'L')}
              </div>
            )}
            <span className="hidden md:inline-block font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-50 to-blue-200 drop-shadow-sm font-sans truncate" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              {appName || schoolName}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">
                <FacebookIcon size={16} />
              </a>
            )}
            {twitter && (
              <a href={twitter} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">
                <TwitterIcon size={16} />
              </a>
            )}
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">
                <InstagramIcon size={16} />
              </a>
            )}
            {youtube && (
              <a href={youtube} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">
                <YoutubeIcon size={16} />
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="hover:text-slate-300">
                <Mail size={16} />
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-1 hover:text-slate-300">
                <Phone size={16} />
              </a>
            )}
            {!phone && !facebook && !twitter && !instagram && !youtube && !email && (
              <Phone size={16} className="cursor-pointer hover:text-slate-300" />
            )}
          </div>
        </div>
      </div>

      {/* Marquee Pengumuman */}
      {announcement && (
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white text-sm py-2 overflow-hidden flex items-center relative z-40 border-b border-red-700/50">
          <div className="container mx-auto px-4 flex items-center whitespace-nowrap">
            <div className="font-bold mr-4 shrink-0 flex items-center gap-2 uppercase tracking-wider text-xs sm:text-sm">
              <Megaphone size={16} className="animate-pulse drop-shadow-sm" />
            </div>
            <div className="overflow-hidden w-full relative flex-1">
              <div className="border-l border-red-400/50 pl-4 h-full flex items-center w-full">
                <p className="animate-marquee inline-block font-medium drop-shadow-sm tracking-wide">{announcement}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Dynamic Navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-start gap-2 font-medium text-[15px] h-full">
            {categories.map(cat => {
              const isChildActiveInUrl = cat.children?.some(c => location.pathname === `/category/${c.slug}`);
              const isActive = location.pathname === `/category/${cat.slug}` || (cat.is_school_list && location.pathname === '/schools') || activeCategorySlug === cat.slug || (cat.children && cat.children.some(c => c.slug === activeCategorySlug)) || isChildActiveInUrl;
              const hasChildren = cat.children && cat.children.length > 0;
              const isSchoolList = cat.is_school_list || cat.slug === 'sekolahku';

              if (isSchoolList) {
                const displaySchools = schools.slice(0, 5);
                const hasMore = schools.length > 5;
                return (
                  <DropdownMenu key={cat.ID}>
                    <DropdownMenuTrigger className={`flex items-center gap-1.5 h-full px-4 border-b-2 transition-colors duration-200 focus:outline-none cursor-pointer data-[state=open]:border-blue-600 data-[state=open]:text-blue-600 dark:data-[state=open]:border-blue-400 dark:data-[state=open]:text-blue-400 ${isActive ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'text-slate-700 dark:text-slate-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                      {cat.name} <ChevronDown size={14} className="opacity-70 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={0} className="w-60 bg-white dark:bg-slate-950 p-2 rounded-none shadow-xl border-x border-b border-t-0 border-slate-200 dark:border-slate-800">
                      {displaySchools.map(school => (
                        <DropdownMenuItem asChild key={school.ID} className="rounded-none cursor-pointer">
                          <a href={getTenantUrl(school.subdomain)} className="w-full text-sm py-2.5 px-2">
                            {school.name}
                          </a>
                        </DropdownMenuItem>
                      ))}

                      {schools.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />}

                      {(hasMore || (!hasMore && schools.length > 0)) && (
                        <DropdownMenuItem asChild className="rounded-none bg-slate-50 dark:bg-slate-900/50 mt-1 cursor-pointer">
                          <Link to="/schools" onClick={scrollToTop} className="w-full text-sm font-semibold text-blue-600 dark:text-blue-400 py-2.5 px-2">
                            {hasMore ? "Lihat Selengkapnya..." : "Semua Sekolah"}
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {schools.length === 0 && (
                        <div className="px-3 py-4 text-sm text-slate-500 text-center">Belum ada sekolah</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              if (hasChildren) {
                return (
                  <DropdownMenu key={cat.ID}>
                    <DropdownMenuTrigger className={`flex items-center gap-1.5 h-full px-4 border-b-2 transition-colors duration-200 focus:outline-none cursor-pointer data-[state=open]:border-blue-600 data-[state=open]:text-blue-600 dark:data-[state=open]:border-blue-400 dark:data-[state=open]:text-blue-400 ${isActive ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'text-slate-700 dark:text-slate-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                      {cat.name} <ChevronDown size={14} className="opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={0} className="w-60 bg-white dark:bg-slate-950 p-2 rounded-none shadow-xl border-x border-b border-t-0 border-slate-200 dark:border-slate-800">

                      {(() => {
                        const isCatActive = location.pathname === `/category/${cat.slug}` || activeCategorySlug === cat.slug;
                        return (
                          <DropdownMenuItem asChild className={`mb-1 rounded-none cursor-pointer ${isCatActive ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold focus:bg-blue-100 dark:focus:bg-blue-900/40' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium focus:bg-slate-100 dark:focus:bg-slate-800'}`}>
                            <Link to={`/category/${cat.slug}`} onClick={scrollToTop} className="w-full py-2.5 px-3 flex items-center justify-between">
                              Semua {cat.name}
                              {isCatActive && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })()}

                      {cat.children!.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5 mx-2" />}

                      {cat.children!.map(child => {
                        const isChildActive = location.pathname === `/category/${child.slug}` || activeCategorySlug === child.slug;
                        return (
                          <DropdownMenuItem asChild key={child.ID} className={`rounded-none cursor-pointer ${isChildActive ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}>
                            <Link to={`/category/${child.slug}`} onClick={scrollToTop} className={`w-full py-2.5 px-3 flex items-center justify-between ${isChildActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                              {child.name}
                              {isChildActive && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={cat.ID}
                  to={`/category/${cat.slug}`}
                  onClick={scrollToTop}
                  className={`flex items-center h-full px-4 border-b-2 transition-colors duration-200 focus:outline-none ${isActive ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'text-slate-700 dark:text-slate-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-slate-700'}`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors bg-slate-100 dark:bg-slate-900 py-1.5 px-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-600"
            >
              <Search size={16} />
              <span className="hidden lg:inline-block opacity-80 text-xs font-medium mr-1">Pencarian</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 font-mono text-[10px] opacity-70">
                <span className="text-xs leading-none">/</span>
              </kbd>
            </button>
            <button
              onClick={toggleDarkMode}
              className="text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors ml-1 p-1"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 flex flex-col max-h-[70vh] overflow-y-auto">
            {categories.map(cat => {
              const isSchoolList = cat.is_school_list || cat.slug === 'sekolahku';
              const targetPath = isSchoolList ? "/schools" : `/category/${cat.slug}`;
              const isActive = location.pathname === targetPath || activeCategorySlug === cat.slug;
              const hasChildren = cat.children && cat.children.length > 0;
              const isExpanded = expandedMobileCats.includes(cat.ID);

              return (
                <div key={cat.ID} className="flex flex-col border-b border-slate-100 dark:border-slate-800/50 last:border-0 py-1">
                  <div className="flex items-center justify-between">
                    <Link
                      to={targetPath}
                      onClick={() => { setIsMobileMenuOpen(false); scrollToTop(); }}
                      className={`flex-1 py-2 ${isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300 font-medium'}`}
                    >
                      {cat.name}
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={() => setExpandedMobileCats(prev => prev.includes(cat.ID) ? prev.filter(id => id !== cat.ID) : [...prev, cat.ID])}
                        className="p-2 text-slate-500"
                      >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="flex flex-col gap-1 pb-2">
                      <Link
                        to={`/category/${cat.slug}`}
                        onClick={() => { setIsMobileMenuOpen(false); scrollToTop(); }}
                        className={`py-1.5 pl-4 text-sm flex items-center ${isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        <div className="w-1 h-1 rounded-full bg-current opacity-50 mr-2" />
                        Semua {cat.name}
                      </Link>
                      {cat.children!.map(child => {
                        const isChildActive = location.pathname === `/category/${child.slug}` || activeCategorySlug === child.slug;
                        return (
                          <Link
                            key={child.ID}
                            to={`/category/${child.slug}`}
                            onClick={() => { setIsMobileMenuOpen(false); scrollToTop(); }}
                            className={`py-1.5 pl-4 text-sm flex items-center ${isChildActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
                          >
                            <div className="w-1 h-1 rounded-full bg-current opacity-50 mr-2" />
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </header>

      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} shouldFilter={false}>
        <CommandInput placeholder="Ketik untuk mencari artikel..." value={searchQuery} onValueChange={setSearchQuery} />
        <CommandList>
          {isSearching && <CommandEmpty>Mencari...</CommandEmpty>}
          {!isSearching && searchResults.length === 0 && searchQuery && <CommandEmpty className="py-12 text-center text-slate-500">Tidak ada hasil untuk "{searchQuery}".</CommandEmpty>}
          {!isSearching && searchResults.length > 0 && (
            <CommandGroup heading="Hasil Pencarian" className="p-2">
              {searchResults.map((post) => (
                <CommandItem
                  key={post.ID}
                  onSelect={() => {
                    navigate(`/post/${post.slug}`);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="cursor-pointer p-4 aria-selected:bg-blue-50/60 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-300 rounded-xl mb-1 last:mb-0 transition-colors"
                >
                  <div className="flex flex-col items-start overflow-hidden w-full gap-1.5">
                    <span className="font-semibold text-[15px] truncate w-full">{post.title}</span>
                    <span className="text-[13px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded font-medium text-slate-600 dark:text-slate-300">{post.category?.name || 'Umum'}</span>
                      <span className="opacity-50">&bull;</span>
                      <span>{new Date(post.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        <Outlet context={{ setActiveCategorySlug }} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 dark:bg-[#050505] text-slate-400 py-10 md:py-16 mt-12 border-t-4 border-blue-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8">
            {/* Column 1: Brand */}
            <div className="flex flex-col gap-3 md:gap-4">
              <Link to="/" className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 md:h-10 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg flex items-center justify-center font-black text-lg md:text-xl">
                    {appName ? appName.charAt(0) : (schoolName ? schoolName.charAt(0) : 'L')}
                  </div>
                )}
                <span className="font-extrabold text-xl md:text-2xl tracking-tight text-white font-sans" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                  {appName || schoolName}
                </span>
              </Link>
              <p className="text-[15px] md:text-sm leading-relaxed mt-2 text-slate-400 w-full md:max-w-xs">
                Portal informasi dan literasi digital sekolah. Mewujudkan ekosistem pendidikan yang cerdas, kreatif, dan inspiratif melalui tulisan dan karya.
              </p>
              <div className="flex items-center gap-3 md:gap-4 mt-3 md:mt-2">
                {facebook && (
                  <a href={facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                    <FacebookIcon size={14} />
                  </a>
                )}
                {twitter && (
                  <a href={twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-colors">
                    <TwitterIcon size={14} />
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                    <InstagramIcon size={14} />
                  </a>
                )}
                {youtube && (
                  <a href={youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
                    <YoutubeIcon size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-0">
              <h4 className="text-white font-bold text-lg mb-1 md:mb-2">Kategori Pilihan</h4>
              <ul className="flex flex-col gap-2 text-[15px] md:text-sm">
                {categories.slice(0, 5).map(cat => (
                  <li key={cat.ID}>
                    <Link
                      to={cat.is_school_list || cat.slug === 'sekolahku' ? '/schools' : `/category/${cat.slug}`}
                      onClick={scrollToTop}
                      className="group flex items-center py-1 text-slate-400 hover:text-white hover:translate-x-1 transition-all"
                    >
                      <span className="capitalize">{cat.name.toLowerCase()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-0">
              <h4 className="text-white font-bold text-lg mb-1 md:mb-2">Hubungi Kami</h4>
              <ul className="flex flex-col gap-5 md:gap-4 text-[15px] md:text-sm">
                {email && (
                  <li className="flex items-start gap-3">
                    <Mail size={18} className="text-slate-500 mt-1 md:mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-slate-500 text-xs mb-1">Email</span>
                      <a href={`mailto:${email}`} className="text-slate-300 hover:text-white transition-colors break-all">{email}</a>
                    </div>
                  </li>
                )}
                {phone && (
                  <li className="flex items-start gap-3">
                    <Phone size={18} className="text-slate-500 mt-1 md:mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-slate-500 text-xs mb-1">Telepon</span>
                      <a href={`tel:${phone}`} className="text-slate-300 hover:text-white transition-colors">{phone}</a>
                    </div>
                  </li>
                )}
                {!email && !phone && (
                  <li className="text-slate-500 text-sm italic">Informasi kontak belum tersedia.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 md:mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] md:text-sm text-center md:text-left">
            <div className="text-slate-500">
              &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-400">PPM EMCL PDPM Bojonegoro | Literasi Digital</span>. Hak Cipta Dilindungi.
            </div>
            <div className="text-slate-500 flex items-center gap-1">
              Dibuat dengan <span className="text-red-500">&hearts;</span> untuk pendidikan.
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 p-3 md:p-4 rounded-xl bg-blue-600 text-white shadow-xl shadow-blue-900/20 hover:bg-blue-500 hover:-translate-y-1 transition-all duration-300 z-50 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Kembali ke atas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
      </button>
    </div>
  );
}
