import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { resolveAssetUrl, getApiBase } from '@/lib/runtime';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Post {
  ID: number;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail_url: string;
  published_at: string;
  views?: number;
  author: {
    name: string;
  };
  category: {
    name: string;
    slug: string;
  };
  school?: {
    name: string;
  };
}

interface Ad {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
}

export default function Home() {
  const [mainPosts, setMainPosts] = useState<Post[]>([]);
  const [secondaryPosts, setSecondaryPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    // Reset page when slug changes
    setPage(1);
  }, [slug]);

  useEffect(() => {
    const mainUrl = slug 
      ? `${getApiBase()}/public/posts?category=${slug}&limit=12&page=${page}`
      : `${getApiBase()}/public/posts?sort=views&limit=10`;
      
    const adsUrl = `${getApiBase()}/public/ads?page_target=home`;
    const secondaryUrl = `${getApiBase()}/public/posts?limit=6`;
      
    Promise.all([
      axios.get(mainUrl),
      axios.get(adsUrl),
      axios.get(secondaryUrl)
    ]).then(([mainRes, adsRes, secondaryRes]) => {
      // Handle paginated response for mainRes
      const resData = mainRes.data;
      if (resData && typeof resData === 'object' && 'data' in resData) {
        setMainPosts(resData.data || []);
        setTotalPages(resData.last_page || 1);
      } else {
        setMainPosts(Array.isArray(resData) ? resData : []);
        setTotalPages(1);
      }
      setAds(adsRes.data || []);

      // Handle secondaryRes
      const secData = secondaryRes.data;
      if (secData && typeof secData === 'object' && 'data' in secData) {
        setSecondaryPosts(secData.data || []);
      } else {
        setSecondaryPosts(Array.isArray(secData) ? secData : []);
      }
    }).catch(console.error);
  }, [slug, page]);

  const adBelowSliderLarge = ads.find(ad => ad.position === 'below_slider_large');
  const adBelowSliderSmall = ads.find(ad => ad.position === 'below_slider_small');
  const adSidebar1 = ads.find(ad => ad.position === 'sidebar_1');
  const adSidebar2 = ads.find(ad => ad.position === 'sidebar_2');
  const adAboveFooter = ads.find(ad => ad.position === 'above_footer');
  const hasSidebarAds = !!(adSidebar1 || adSidebar2)

  // We only show the grid list for items after the slider or we show all if no slider
  const gridPosts = mainPosts;

  // Ensure slider always has enough slides for loop to fill left+right without gaps
  const sliderPosts = mainPosts.length === 0 ? [] : (
    mainPosts.length >= 5 ? mainPosts :
    Array.from({ length: Math.ceil(6 / mainPosts.length) }, () => mainPosts).flat()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Modern Slider section - ONLY show on homepage (no slug) */}
      {!slug && mainPosts.length > 0 && (
        <div className="mb-12 relative w-full overflow-hidden">
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView={'auto'}
            coverflowEffect={{
              rotate: 30,
              stretch: 0,
              depth: 150,
              modifier: 1,
              slideShadows: true,
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={true}
            modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
            className="w-full pb-12 pt-4"
          >
            {sliderPosts.map((post, idx) => (
              <SwiperSlide key={`slide-${post.ID}-${idx}`} className="max-w-4xl w-[90%] md:w-[80%]">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl group h-[400px] md:h-[500px]">
                  <img 
                    src={resolveAssetUrl(post.thumbnail_url)} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl border border-white/20">
                      {post.category?.name || 'Berita'}
                    </span>
                    <Link to={`/post/${post.slug}`}>
                      <h1 className="text-xl md:text-2xl font-extrabold text-white mt-4 leading-tight hover:text-blue-300 transition-colors drop-shadow-md line-clamp-2">
                        {post.title}
                      </h1>
                    </Link>
                    <div className="flex items-center gap-3 mt-4 text-slate-300 text-xs md:text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white text-xs">
                          {post.author?.name?.charAt(0) || 'A'}
                        </span>
                        {post.author?.name || 'Admin'}
                      </span>
                      <span>&bull;</span>
                      <span>{post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy', { locale: id }) : 'Unknown date'}</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Below Slider Ads section */}
      {(adBelowSliderLarge || adBelowSliderSmall) && (
        <div className="mb-12 w-full flex flex-col gap-4">
          {adBelowSliderLarge && (
            <div className="bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm relative w-full flex items-center justify-center">
              {adBelowSliderLarge.link_url ? (
                <a href={adBelowSliderLarge.link_url} target="_blank" rel="noreferrer" className="block w-full h-full text-center">
                  <img src={resolveAssetUrl(adBelowSliderLarge.image_url)} alt={adBelowSliderLarge.title} className="w-full h-auto mx-auto" />
                </a>
              ) : (
                <img src={resolveAssetUrl(adBelowSliderLarge.image_url)} alt={adBelowSliderLarge.title} className="w-full h-auto mx-auto" />
              )}
              <span className="absolute top-3 right-3 bg-yellow-400 text-slate-900 text-sm px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-lg z-10 border-2 border-white/20">Iklan</span>
            </div>
          )}
          {adBelowSliderSmall && (
            <div className="bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm relative w-full flex items-center justify-center">
              {adBelowSliderSmall.link_url ? (
                <a href={adBelowSliderSmall.link_url} target="_blank" rel="noreferrer" className="block w-full h-full text-center">
                  <img src={resolveAssetUrl(adBelowSliderSmall.image_url)} alt={adBelowSliderSmall.title} className="w-full h-auto mx-auto" />
                </a>
              ) : (
                <img src={resolveAssetUrl(adBelowSliderSmall.image_url)} alt={adBelowSliderSmall.title} className="w-full h-auto mx-auto" />
              )}
              <span className="absolute top-3 right-3 bg-yellow-400 text-slate-900 text-sm px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-lg z-10 border-2 border-white/20">Iklan</span>
            </div>
          )}
        </div>
      )}

      {/* hasSidebarAds: true if any sidebar ad slot is filled */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column (Main Posts) */}
        <div className={hasSidebarAds ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-l-4 border-blue-600 pl-3">
              {slug ? `Kategori: ${slug.replace(/-/g, ' ')}` : 'Terpopuler'}
            </h2>
          </div>

          {gridPosts.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Belum ada tulisan saat ini.
            </div>
          ) : slug ? (
            // Layout for Category Page (Grid of Cards)
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {gridPosts.map(post => (
                  <Link to={`/post/${post.slug}`} key={post.ID} className="flex flex-col gap-3 group">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      <img
                        src={resolveAssetUrl(post.thumbnail_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519681393784-d120267933ba' }}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <span>{post.published_at ? format(new Date(post.published_at), 'MMM dd, yyyy', { locale: id }) : ''}</span>
                        <span>•</span>
                        <span>{post.author?.name || 'Admin'}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {post.excerpt || '...'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    &laquo;
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    // Show current page, first, last, and pages close to current
                    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                            page === p 
                              ? 'bg-blue-600 text-white border border-blue-600' 
                              : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    } else if (p === page - 2 || p === page + 2) {
                      return <span key={p} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                  
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Layout for Home Page (List + Featured)
            <div className="flex flex-col gap-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-0">
              {/* Left: numbered list */}
              <div className="flex flex-col h-full divide-y divide-slate-100 dark:divide-slate-800 pr-0 lg:pr-6 border-r-0 lg:border-r border-slate-100 dark:border-slate-800 order-2 lg:order-1">
                {gridPosts.slice(0, 7).map((post, idx) => (
                  <Link to={`/post/${post.slug}`} key={post.ID} className="flex gap-4 py-5 group">
                    <span className="text-4xl font-extrabold text-slate-200 dark:text-slate-700 w-12 shrink-0 leading-tight select-none mt-1">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col gap-1 justify-center">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {post.published_at ? format(new Date(post.published_at), 'MMM dd, yyyy', { locale: id }) : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right: featured + 2 smaller */}
              <div className="flex flex-col gap-4 pl-0 lg:pl-6 order-1 lg:order-2">
                {/* Featured card */}
                {gridPosts[0] && (
                  <Link to={`/post/${gridPosts[0].slug}`} className="relative rounded-xl overflow-hidden block group aspect-[16/9]">
                    <img
                      src={resolveAssetUrl(gridPosts[0].thumbnail_url)}
                      alt={gridPosts[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519681393784-d120267933ba' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg border border-white/20">
                        {gridPosts[0].author?.name || 'Admin'}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-white font-extrabold text-base leading-snug line-clamp-2">{gridPosts[0].title}</h3>
                      <span className="text-slate-300 text-xs mt-1 block">
                        {gridPosts[0].published_at ? format(new Date(gridPosts[0].published_at), 'MMM dd, yyyy', { locale: id }) : ''}
                      </span>
                    </div>
                  </Link>
                )}

                {/* 2 smaller cards */}
                <div className="grid grid-cols-2 gap-4">
                  {gridPosts.slice(1, 3).map(post => (
                    <Link to={`/post/${post.slug}`} key={post.ID} className="flex flex-col gap-2 group">
                      <div className="aspect-[4/3] overflow-hidden rounded-lg">
                        <img
                          src={resolveAssetUrl(post.thumbnail_url)}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519681393784-d120267933ba' }}
                        />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {post.published_at ? format(new Date(post.published_at), 'MMM dd, yyyy', { locale: id }) : ''}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

              {/* Terbaru section (bottom) */}
              {secondaryPosts.length > 0 && (
                <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-l-4 border-emerald-500 pl-3">
                      Terbaru
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {secondaryPosts.map(post => (
                      <Link to={`/post/${post.slug}`} key={`pop-${post.ID}`} className="flex flex-col gap-3 group">
                        <div className="aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                          <img
                            src={resolveAssetUrl(post.thumbnail_url)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519681393784-d120267933ba' }}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-red-500 transition-colors mb-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{post.published_at ? format(new Date(post.published_at), 'MMM dd, yyyy', { locale: id }) : ''}</span>
                            <span className="font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              Baru
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar (Ads) — only rendered when there is at least 1 ad */}
        {hasSidebarAds && (
        <aside className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-6">
            {[adSidebar1, adSidebar2].filter(Boolean).map((ad) => ad && (
              <div key={`ad-sidebar-${ad.id}`} className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 w-full relative shadow-sm hover:shadow-md transition-shadow">
                {ad.link_url ? (
                  <a href={ad.link_url} target="_blank" rel="noreferrer" className="block w-full h-full">
                    <img src={resolveAssetUrl(ad.image_url)} alt={ad.title} className="w-full object-contain" />
                  </a>
                ) : (
                  <img src={resolveAssetUrl(ad.image_url)} alt={ad.title} className="w-full object-contain" />
                )}
                <span className="absolute top-3 right-3 bg-yellow-400 text-slate-900 text-sm px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-lg z-10 border-2 border-white/20">Iklan</span>
              </div>
            ))}
          </div>
        </aside>
        )}
      </div>

      {/* Above Footer Ad */}
      {adAboveFooter && (
        <div className="mt-12 w-full">
          <div className="bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm relative w-full flex items-center justify-center">
            {adAboveFooter.link_url ? (
              <a href={adAboveFooter.link_url} target="_blank" rel="noreferrer" className="block w-full h-full text-center">
                <img src={resolveAssetUrl(adAboveFooter.image_url)} alt={adAboveFooter.title} className="w-full h-auto mx-auto" />
              </a>
            ) : (
              <img src={resolveAssetUrl(adAboveFooter.image_url)} alt={adAboveFooter.title} className="w-full h-auto mx-auto" />
            )}
            <span className="absolute top-3 right-3 bg-yellow-400 text-slate-900 text-sm px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-lg z-10 border-2 border-white/20">Iklan</span>
          </div>
        </div>
      )}
    </div>
  );
}
