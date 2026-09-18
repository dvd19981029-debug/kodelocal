// src/components/ecommerce/HomeBlogSection.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
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

const INITIAL_BLOG_POSTS: BlogPostSummary[] = [
  {
    id: 'post-emprender-sv',
    slug: 'por-que-aromaniak-es-la-mejor-opcion-para-emprender-en-el-salvador',
    title: 'Por Qué Aromaniak es la Mejor Opción para Emprender en El Salvador',
    excerpt: 'Descubre por qué Aromaniak SV es el distribuidor directo líder para emprender en perfumería en El Salvador con bajo presupuesto.',
    coverImage: '/images/promo/emprender_aromaniak_el_salvador.jpg',
    author: 'Equipo Aromaniak',
    category: 'Emprendimiento',
    readingTimeMin: 4,
    publishedAt: '2026-09-17T00:00:00.000Z',
  },
  {
    id: 'post-como-armar',
    slug: 'como-armar-tu-propio-perfume-en-casa-con-esencias',
    title: 'Cómo armar tu propio perfume en casa con esencias Aromaniak',
    excerpt: 'Guía práctica para crear y envasar tus fragancias con esencias 100% puras, frascos con atomizador y alcohol de perfumería.',
    coverImage: '/images/promo/banner_aromas.webp',
    author: 'Equipo Aromaniak',
    category: 'Guías',
    readingTimeMin: 3,
    publishedAt: '2026-09-16T00:00:00.000Z',
  },
  {
    id: 'post-como-vender',
    slug: 'como-vender-perfumes-desde-casa-el-salvador-e3de2e19',
    title: 'Guía para principiantes: cómo empezar a vender perfumes desde casa en El Salvador',
    excerpt: 'Aprende a iniciar tu negocio de perfumería fina con esencias 100% puras, fórmulas de alta fijación y entrega en todo El Salvador.',
    coverImage: '/images/promo/banner_emprendedor.webp',
    author: 'Equipo Aromaniak',
    category: 'Emprendimiento',
    readingTimeMin: 4,
    publishedAt: '2026-09-15T00:00:00.000Z',
  },
];

export default function HomeBlogSection() {
  const [posts, setPosts] = useState<BlogPostSummary[]>(INITIAL_BLOG_POSTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/blog/posts?limit=3')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPosts(data.data);
        }
      })
      .catch((err) => console.error('Error cargando artículos en HomeBlogSection:', err));

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

      {/* Grid perfectamente alineado de los últimos 3 artículos con diseño moderno */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="clay-card rounded-3xl p-3.5 sm:p-4 bg-white/70 animate-pulse h-[390px] flex flex-col justify-between border border-white/80"
              >
                <div className="w-full aspect-[16/10] bg-slate-200 rounded-2xl shrink-0 mb-3.5" />
                <div className="space-y-2 flex-1 px-1">
                  <div className="h-3 bg-slate-200 rounded-md w-1/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded-md w-4/5" />
                  <div className="h-3 bg-slate-200 rounded-md w-full" />
                  <div className="h-3 bg-slate-200 rounded-md w-2/3" />
                </div>
                <div className="h-8 bg-slate-200 rounded-xl w-full mt-3" />
              </div>
            ))
          : posts.map((post, idx) => (
              <article
                key={post.id}
                className="clay-card rounded-3xl p-3.5 sm:p-4 bg-white/95 border border-white/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group"
              >
                <div className="flex flex-col flex-1">
                  {/* Portada flotante tipo cápsula con proporción 16/10 */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shadow-2xs mb-3.5 shrink-0"
                  >
                    <img
                      src={post.coverImage || '/images/promo/banner_aromas.webp'}
                      alt={post.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/promo/banner_aromas.webp';
                      }}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Efecto de degradado al pasar el mouse */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Insignia de categoría */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      {post.category && (
                        <span className="bg-white/95 backdrop-blur-md text-[#7c3aed] border border-purple-100 text-[9.5px] font-black py-1 px-2.5 rounded-lg shadow-xs uppercase tracking-wider">
                          {post.category}
                        </span>
                      )}
                      {idx === 0 && (
                        <span className="bg-[#7c3aed] text-white text-[9.5px] font-black py-1 px-2.5 rounded-lg shadow-xs uppercase tracking-wider">
                          Nuevo
                        </span>
                      )}
                    </div>

                    {/* Duración de lectura en chip flotante */}
                    <div className="absolute bottom-2.5 right-2.5 z-10 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold py-0.5 px-2 rounded-md shadow-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white/90" />
                      <span>{post.readingTimeMin || 3} min</span>
                    </div>
                  </Link>

                  {/* Cuerpo del contenido editorial */}
                  <div className="px-1 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Fecha de publicación */}
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-2 font-medium h-4">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatBlogDate(post.publishedAt)}</span>
                          </span>
                        )}
                      </div>

                      {/* Título de 2 líneas fijas */}
                      <div className="h-14 flex items-start mb-1.5">
                        <Link href={`/blog/${post.slug}`} className="block group/title w-full">
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug tracking-tight group-hover/title:text-[#7c3aed] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                        </Link>
                      </div>

                      {/* Resumen del post */}
                      <div className="h-10 overflow-hidden mb-3">
                        {post.excerpt && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie de tarjeta moderno con botón de acción estilizado */}
                <div className="px-1 pt-3 border-t border-slate-100/90 flex items-center justify-between mt-auto">
                  <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[130px]">
                    {post.author || 'Equipo Aromaniak'}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] bg-purple-50 group-hover:bg-[#7c3aed] group-hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
                  >
                    <span>Leer artículo</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
}
