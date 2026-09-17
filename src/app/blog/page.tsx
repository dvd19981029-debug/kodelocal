// src/app/blog/page.tsx

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ChevronRight, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import BlogLiveSearch from '@/components/blog/BlogLiveSearch';

export const revalidate = 60; // Regeneración incremental cada 60 segundos

export const metadata: Metadata = {
  title: 'Blog de Perfumería y Fragancias de Lujo en El Salvador',
  description: 'Guías expertas, contratipos de alta fijación, notas olfativas y consejos para comprar perfumes en El Salvador. Envíos express a todo el país por Aromaniak SV.',
  keywords: [
    'blog de perfumes el salvador',
    'perfumes el salvador',
    'mejores contratipos el salvador',
    'perfumeria fina san salvador',
    'esencias de alta fijacion',
    'guia de perfumes hombre y mujer el salvador',
    'donde comprar perfumes en el salvador'
  ],
  alternates: {
    canonical: 'https://aromaniaksv.com/blog',
  },
  openGraph: {
    title: 'Blog de Perfumería y Fragancias | Aromaniak SV',
    description: 'Guías expertas de perfumes, contratipos de alta fijación y notas olfativas en El Salvador.',
    url: 'https://aromaniaksv.com/blog',
    siteName: 'Aromaniak SV',
    locale: 'es_SV',
    type: 'website',
  },
  other: {
    'geo.region': 'SV',
    'geo.placename': 'San Salvador, El Salvador',
  },
};

export default async function BlogIndexPage() {
  let posts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    author: string | null;
    category: string | null;
    tags: string | null;
    readingTimeMin: number | null;
    publishedAt: Date | null;
  }> = [];

  try {
    posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        author: true,
        category: true,
        tags: true,
        readingTimeMin: true,
        publishedAt: true,
      },
    });
  } catch (error) {
    console.error('Error al cargar posts para /blog:', error);
  }

  // Schema JSON-LD para Google (Colección de Blog)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de Perfumería Fina Aromaniak El Salvador',
    url: 'https://aromaniaksv.com/blog',
    description: 'Guías olfativas, contratipos premium y consejos de perfumería en El Salvador.',
    inLanguage: 'es-SV',
    publisher: {
      '@type': 'Organization',
      name: 'Aromaniak SV',
      url: 'https://aromaniaksv.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aromaniaksv.com/images/logo.png',
      },
      areaServed: {
        '@type': 'Country',
        name: 'El Salvador',
      },
    },
  };

  const categories = ['Todos', 'Guías', 'Tendencias', 'Reseñas', 'Cuidados & Fijación'];

  // Serializar fechas para el Client Component
  const serializedPosts = posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  }));

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10">
      {/* Microdatos estructurados */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Migas de pan */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <li>
            <Link href="/" className="hover:text-purple-700 transition-colors">
              Inicio
            </Link>
          </li>
          <li>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />
          </li>
          <li className="text-slate-900 font-bold" aria-current="page">
            Blog Aromaniak SV
          </li>
        </ol>
      </nav>

      {/* Cabecera del Blog con enfoque en SEO El Salvador y diseño Claymorphic */}
      <header className="mb-8 text-center sm:text-left border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/90 text-purple-900 text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
          Perfumería Fina en El Salvador
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Secretos Olfativos, Guías & Alta Fijación
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Aprende a elegir tu fragancia ideal, maximizar su duración y descubrir las inspiraciones de lujo con entrega a domicilio en todos los departamentos de El Salvador.
        </p>
      </header>

      {/* Buscador reactivo en tiempo real y Grid de Artículos */}
      <BlogLiveSearch initialPosts={serializedPosts} categories={categories} />

      {/* Banner de Conversión hacia el E-commerce (Local SEO El Salvador) */}
      <aside className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <span className="text-amber-400 text-xs font-black tracking-wider uppercase flex items-center justify-center sm:justify-start gap-1.5 mb-1">
            <Sparkles className="w-4 h-4" />
            Perfumería de Inspiración en El Salvador
          </span>
          <h3 className="text-xl sm:text-2xl font-black">
            ¿Buscas fragancias con más de 8 horas de duración?
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Explora más de 100 contratipos de lujo en esencias 100% puras importadas de alta fijación. Envíos express a los 14 departamentos de El Salvador.
          </p>

        </div>
        <Link
          href="/"
          className="shrink-0 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Ver Catálogo Aromaniak
        </Link>
      </aside>
    </div>
  );
}
