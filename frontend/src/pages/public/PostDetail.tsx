import { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { resolveAssetUrl, getApiBase } from '@/lib/runtime';

interface Ad {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
}

interface Post {
  ID: number;
  title: string;
  slug: string;
  content: string;
  thumbnail_url: string;
  published_at: string;
  author: {
    name: string;
  };
  school_id?: number | null;
  school?: {
    name: string;
    subdomain: string;
  };
  category: {
    name: string;
    slug: string;
  };
}

export default function PostDetail() {
  const { slug } = useParams();
  const { setActiveCategorySlug } = useOutletContext<{ setActiveCategorySlug: (slug: string) => void }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${getApiBase()}/public/posts/${slug}`)
      .then(res => {
        setPost(res.data);
        if (res.data?.category?.slug) {
          setActiveCategorySlug(res.data.category.slug);
        }
        // Fetch ads for this specific post
        if (res.data?.ID) {
          axios.get(`${getApiBase()}/public/ads?page_target=post&post_id=${res.data.ID}`)
            .then(adRes => setAds(adRes.data || []))
            .catch(err => console.error("Failed to fetch ads", err));
        }
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      setActiveCategorySlug('');
    };
  }, [slug, setActiveCategorySlug]);

  const adAtasArtikel = ads.find(ad => ad.position === 'atas_artikel');
  const adBawahArtikel = ads.find(ad => ad.position === 'bawah_artikel');

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center">Loading...</div>;
  }

  if (!post) {
    return <div className="container mx-auto px-4 py-20 text-center">Post not found</div>;
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center text-sm text-slate-600 dark:text-slate-400 gap-x-4 gap-y-2">
          {/* Author & School */}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {post.author.name} {post.school?.name && <span className="text-slate-500 font-normal">({post.school.name})</span>}
          </span>
          <span className="hidden sm:inline">&bull;</span>

          {/* Date */}
          <span>
            {post.published_at ? format(new Date(post.published_at), 'EEEE, dd MMMM yyyy', { locale: id }) : 'Unknown date'}
          </span>
          <span className="hidden sm:inline">&bull;</span>

          {/* Category */}
          {post.school && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? (
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">
              {post.category.name}
            </span>
          ) : (
            <Link to={`/category/${post.category.slug}`} className="text-blue-600 font-bold tracking-widest uppercase text-xs hover:underline">
              {post.category.name}
            </Link>
          )}
        </div>
      </div>

      {post.thumbnail_url && (
        <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
          <img
            src={resolveAssetUrl(post.thumbnail_url)}
            alt={post.title}
            className="w-full h-auto max-h-[600px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      {adAtasArtikel && (
        <div className="mb-8 bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm relative w-full flex items-center justify-center">
          {adAtasArtikel.link_url ? (
            <a href={adAtasArtikel.link_url} target="_blank" rel="noreferrer" className="block w-full h-full text-center">
              <img src={resolveAssetUrl(adAtasArtikel.image_url)} alt={adAtasArtikel.title} className="w-full h-auto mx-auto" />
            </a>
          ) : (
            <img src={resolveAssetUrl(adAtasArtikel.image_url)} alt={adAtasArtikel.title} className="w-full h-auto mx-auto" />
          )}
          <span className="absolute top-3 right-3 bg-yellow-400 text-slate-900 text-sm px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-lg z-10 border-2 border-white/20">Iklan</span>
        </div>
      )}

      <div 
        className="prose prose-lg dark:prose-invert max-w-none prose-blue prose-p:leading-relaxed prose-p:my-4 prose-headings:my-5 prose-li:my-1 [&>p:has(>br:only-child)]:hidden break-words"
        dangerouslySetInnerHTML={{ __html: post.content.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ') }}
      />

      {adBawahArtikel && (
        <div className="mt-8 bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm relative w-full flex items-center justify-center">
          {adBawahArtikel.link_url ? (
            <a href={adBawahArtikel.link_url} target="_blank" rel="noreferrer" className="block w-full h-full text-center">
              <img src={resolveAssetUrl(adBawahArtikel.image_url)} alt={adBawahArtikel.title} className="w-full h-auto mx-auto" />
            </a>
          ) : (
            <img src={resolveAssetUrl(adBawahArtikel.image_url)} alt={adBawahArtikel.title} className="w-full h-auto mx-auto" />
          )}
          <span className="absolute top-3 right-3 bg-yellow-400 text-slate-900 text-sm px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-lg z-10 border-2 border-white/20">Iklan</span>
        </div>
      )}
    </article>
  );
}
