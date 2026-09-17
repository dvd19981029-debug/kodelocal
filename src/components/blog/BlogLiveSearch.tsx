// src/components/blog/BlogLiveSearch.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Sparkles, Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
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
      {/* Barra de Búsqueda y Filtros */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl mx-auto sm:mx-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema, ingrediente o inspiración (ej: fijación, sándalo, hombre)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-500 shadow-xs transition-all"
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

        {/* Píldoras de Categorías */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Indicador de resultados */}
        {(searchQuery || selectedCategory !== 'Todos') && (
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>
              Mostrando <strong>{filteredPosts.length}</strong> artículo{filteredPosts.length === 1 ? '' : 's'}
              {selectedCategory !== 'Todos' && ` en "${selectedCategory}"`}
              {searchQuery && ` para "${searchQuery}"`}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
              }}
              className="text-purple-700 font-bold hover:underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Grid de Artículos Reactivo */}
      {filteredPosts.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Imagen de portada */}
              <Link
                href={`/blog/${post.slug}`}
                className="block relative aspect-16/9 overflow-hidden bg-gradient-to-br from-purple-950 to-slate-900"
              >
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
                    <Sparkles className="w-10 h-10 text-amber-300/80 mb-2" />
                    <span className="text-xs tracking-widest uppercase font-bold text-amber-200/90">
                      Aromaniak SV
                    </span>
                  </div>
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 bg-purple-950/80 backdrop-blur-xs text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    {post.category}
                  </span>
                )}
              </Link>

              {/* Contenido de la tarjeta */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-slate-400 text-xs mb-2.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.publishedAt ? formatBlogDate(post.publishedAt) : ''}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTimeMin || 3} min
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug group-hover:text-purple-700 transition-colors line-clamp-2 mb-2">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
                  {post.excerpt}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-xs font-semibold text-slate-500">
                    {post.author || 'Equipo Aromaniak'}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform"
                  >
                    Leer artículo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        /* Empty State */
        <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
          <BookOpen className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">No se encontraron artículos</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            No encontramos ningún post que coincida con tus criterios de búsqueda. Intenta con otros términos o explora las categorías.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Todos');
            }}
            className="px-5 py-2.5 rounded-xl bg-purple-900 text-white text-xs font-black hover:bg-purple-950 transition-colors cursor-pointer"
          >
            Ver todos los artículos
          </button>
        </section>
      )}
    </div>
  );
}
