// src/components/blog/BlogLiveSearch.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { formatBlogDate } from '@/lib/blog';

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string | null;
  category: string | null;
  tags?: string | null;
  readingTimeMin: number | null;
  publishedAt: string | Date | null;
}

interface BlogLiveSearchProps {
  initialPosts: BlogPostSummary[];
  categories: string[];
}

export default function BlogLiveSearch({ initialPosts, categories }: BlogLiveSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCat = params.get('category') || params.get('categoria');
      if (urlCat) {
        const match = categories.find((c) => c.toLowerCase() === urlCat.toLowerCase());
        if (match) {
          setSelectedCategory(match);
        } else {
          setSelectedCategory(urlCat);
        }
      }
    }
  }, [categories]);

  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      // Filtro por categoría
      if (selectedCategory !== 'Todos') {
        if (!post.category || post.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = post.title.toLowerCase().includes(query);
        const inExcerpt = post.excerpt?.toLowerCase().includes(query) || false;
        const inTags = post.tags?.toLowerCase().includes(query) || false;
        if (!inTitle && !inExcerpt && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [initialPosts, selectedCategory, searchQuery]);

  return (
    <div className="w-full">
      {/* Barra de Búsqueda y Filtros con diseño de la tienda */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema, ingrediente o inspiración..."
            className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Píldoras de Categorías alineadas al diseño de tabs de la tienda */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'clay-btn-primary text-white shadow-xs font-black'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Indicador de resultados */}
        {(searchQuery || selectedCategory !== 'Todos') && (
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
            <span>
              Mostrando <strong>{filteredPosts.length}</strong> artículo{filteredPosts.length === 1 ? '' : 's'}
              {selectedCategory !== 'Todos' && ` en ${selectedCategory}`}
              {searchQuery && ` para "${searchQuery}"`}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
              }}
              className="text-indigo-700 font-bold hover:underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Grid de Artículos con alineación estricta y alturas uniformes */}
      {filteredPosts.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="clay-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] bg-white/95 h-full border border-slate-200/70 shadow-xs"
            >
              <div className="flex flex-col flex-1">
                {/* Imagen de portada con aspect-ratio uniforme 16/10 */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="block relative w-full aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100 shrink-0"
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
                  {post.category && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-white/95 backdrop-blur-xs text-indigo-900 border border-slate-200/80 text-[9px] font-extrabold py-0.5 px-2 rounded-md shadow-xs uppercase tracking-wide">
                        {post.category}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Detalles de la tarjeta con alturas simétricas */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-2 font-medium h-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{post.publishedAt ? formatBlogDate(post.publishedAt) : ''}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{post.readingTimeMin || 3} min</span>
                      </span>
                    </div>

                    <div className="h-14 flex items-start mb-1.5">
                      <Link href={`/blog/${post.slug}`} className="block group/title w-full">
                        <h2 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-2 leading-snug group-hover/title:text-indigo-700 transition-colors">
                          {post.title}
                        </h2>
                      </Link>
                    </div>

                    <div className="h-10 overflow-hidden">
                      {post.excerpt && (
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie de la tarjeta perfectamente alineado al fondo */}
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3.5 border-t border-slate-100/90 flex items-center justify-between mt-auto bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[140px]">
                  {post.author || 'Equipo Aromaniak'}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors shrink-0"
                >
                  <span>Leer artículo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        /* Empty State */
        <section className="clay-card rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
          <BookOpen className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">No se encontraron artículos</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
            No encontramos ningún post que coincida con tu búsqueda. Intenta con otros términos.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Todos');
            }}
            className="clay-btn clay-btn-primary px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Ver todos los artículos
          </button>
        </section>
      )}
    </div>
  );
}
