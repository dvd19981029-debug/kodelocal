// src/components/ecommerce/HomeBlogSection.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { formatBlogDate } from '@/lib/blog';

interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string | null;
  category: string | null;
  readingTimeMin: number | null;
  publishedAt: string | null;
}

export default function HomeBlogSection() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/blog/posts?limit=3')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data)) {
          setPosts(data.data);
        }
      })
      .catch((err) => console.error('Error cargando artículos en HomeBlogSection:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && posts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Encabezado de la sección con diseño claymórfico de la tienda */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="clay-badge text-[10px] sm:text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
            Guías & Artículos del Blog
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Aprende sobre Perfumería, Fórmulas & Rendimiento
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 max-w-2xl">
            Técnicas de fijación, selección de inspiraciones olfativas y consejos para emprender en perfumería en El Salvador.
          </p>
        </div>

        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors shrink-0"
        >
          <span>Ver todos los artículos</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid de los últimos artículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="clay-card rounded-2xl overflow-hidden p-4 space-y-3 bg-white/70 animate-pulse"
              >
                <div className="w-full aspect-16/9 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-full" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              </div>
            ))
          : posts.map((post, idx) => (
              <article
                key={post.id}
                className="clay-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] bg-white/95"
              >
                <div>
                  {/* Portada del artículo con badge de categoría y badge de NUEVO para el más reciente */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block relative w-full aspect-16/9 overflow-hidden bg-slate-100 border-b border-slate-100"
                  >
                    <img
                      src={post.coverImage || '/images/promo/banner_aromas.webp'}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      {post.category && (
                        <span className="bg-white/95 backdrop-blur-xs text-indigo-900 border border-slate-200/80 text-[9px] font-extrabold py-0.5 px-2 rounded-md shadow-xs uppercase tracking-wide">
                          {post.category}
                        </span>
                      )}
                      {idx === 0 && (
                        <span className="bg-purple-600 text-white text-[9px] font-black py-0.5 px-2 rounded-md shadow-xs uppercase tracking-wide">
                          Nuevo
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Metadatos y títulos */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-2 font-medium">
                      {post.publishedAt && (
                        <>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatBlogDate(post.publishedAt)}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {post.readingTimeMin || 3} min
                      </span>
                    </div>

                    <Link href={`/blog/${post.slug}`} className="block group/title">
                      <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug group-hover/title:text-indigo-700 transition-colors">
                        {post.title}
                      </h3>
                    </Link>

                    {post.excerpt && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pie de tarjeta con autor y enlace */}
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-slate-100/80 flex items-center justify-between mt-auto">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {post.author || 'Equipo Aromaniak'}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                  >
                    <span>Leer artículo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
}
