// src/app/blog/[slug]/page.tsx

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  ArrowLeft, 
  Sparkles, 
  Tag, 
  CheckCircle2, 
  Truck, 
  ShieldCheck,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatBlogDate } from '@/lib/blog';
import ShareButtons from '@/components/blog/ShareButtons';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCatalogShowcase from '@/components/blog/BlogCatalogShowcase';

export const revalidate = 60; // Regeneración incremental cada 60 segundos

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Metadatos dinámicos para Google SEO, Meta Ads y OpenGraph
 */
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: {
        title: true,
        excerpt: true,
        metaTitle: true,
        metaDescription: true,
        canonicalUrl: true,
        coverImage: true,
        author: true,
        publishedAt: true,
        isPublished: true,
      },
    });

    if (!post || !post.isPublished) {
      return {
        title: 'Artículo no encontrado | Aromaniak SV',
        robots: { index: false, follow: false },
      };
    }

    const title = post.metaTitle || `${post.title} | Aromaniak SV`;
    const description = post.metaDescription || post.excerpt || 'Artículo de perfumería fina en El Salvador por Aromaniak.';
    const canonical = post.canonicalUrl || `https://aromaniaksv.com/blog/${slug}`;
    const cover = post.coverImage || 'https://aromaniaksv.com/images/logo.png';

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        type: 'article',
        title,
        description,
        url: canonical,
        siteName: 'Aromaniak SV',
        locale: 'es_SV',
        publishedTime: post.publishedAt?.toISOString(),
        authors: post.author ? [post.author] : ['Aromaniak SV'],
        images: [
          {
            url: cover,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [cover],
      },
      other: {
        'geo.region': 'SV',
        'geo.placename': 'San Salvador, El Salvador',
      },
    };
  } catch (error) {
    return {
      title: 'Blog | Aromaniak SV',
    };
  }
}

export default async function BlogPostDetailPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.isPublished) {
    notFound();
  }

  // Cargar artículos relacionados para navegación continua
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      id: { not: post.id },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      category: true,
      readingTimeMin: true,
      publishedAt: true,
    },
  });

  const canonicalUrl = post.canonicalUrl || `https://aromaniaksv.com/blog/${post.slug}`;
  const publishedIso = post.publishedAt ? post.publishedAt.toISOString() : post.createdAt.toISOString();
  const modifiedIso = post.updatedAt ? post.updatedAt.toISOString() : publishedIso;

  // Schema.org BlogPosting para Rich Snippets en Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.coverImage ? [post.coverImage] : ['https://aromaniaksv.com/images/logo.png'],
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: {
      '@type': 'Organization',
      name: post.author || 'Aromaniak SV',
      url: 'https://aromaniaksv.com',
    },
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
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    inLanguage: 'es-SV',
  };

  const tagList = post.tags
    ? post.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Barra de progreso de lectura interactiva */}
      <ReadingProgressBar />

      {/* Microdatos estructurados para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Migas de pan */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center space-x-2 text-xs text-slate-500 font-medium">
          <li>
            <Link href="/" className="hover:text-purple-700 transition-colors">
              Inicio
            </Link>
          </li>
          <li>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />
          </li>
          <li>
            <Link href="/blog" className="hover:text-purple-700 transition-colors">
              Blog
            </Link>
          </li>
          <li>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />
          </li>
          <li className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* Cabecera del Artículo */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-purple-700 mr-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Blog
          </Link>
          {post.category && (
            <span className="bg-purple-100 text-purple-900 text-xs font-bold px-3 py-0.5 rounded-full">
              {post.category}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 font-medium">
            {post.excerpt}
          </p>
        )}

        {/* Metadatos de Autor, Fecha y Botones de Compartir */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200/80">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <User className="w-4 h-4 text-purple-600" />
              {post.author || 'Equipo Aromaniak'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {post.publishedAt ? formatBlogDate(post.publishedAt) : ''}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readingTimeMin || 3} min de lectura
            </span>
          </div>

          <ShareButtons url={canonicalUrl} title={post.title} />
        </div>
      </header>

      {/* Imagen destacada con fallback elegante */}
      {post.coverImage ? (
        <div className="relative aspect-16/9 rounded-3xl overflow-hidden mb-8 shadow-md border border-slate-200/60 bg-slate-100">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="relative aspect-16/9 sm:aspect-21/9 rounded-3xl overflow-hidden mb-8 shadow-md border border-slate-200/60 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-center p-6 text-white">
          <Sparkles className="w-10 h-10 text-amber-300 mb-2" />
          <span className="text-xs font-black tracking-widest uppercase text-amber-300">Aromaniak SV</span>
          <span className="text-xs text-slate-300 mt-1">Esencias 100% Puras de Perfumería Fina</span>
        </div>
      )}


      {/* Tabla de Contenidos interactiva para navegación rápida */}
      <TableOfContents content={post.content} />

      {/* Cuerpo del Artículo con formato enriquecido */}
      <div 
        className="blog-prose leading-relaxed text-slate-800 text-base sm:text-lg"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Showcase Interactivo de Perfumes Recomendados (Conversión Directa) */}
      <BlogCatalogShowcase limit={3} />

      {/* Etiquetas / Tags */}
      {tagList.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400 mr-1" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
            Temas relacionados:
          </span>
          {tagList.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* =========================================================================
          BLOQUE ESTRATÉGICO DE CONVERSIÓN HACIA EL E-COMMERCE (SEO LOCAL EL SALVADOR)
          Convierte el tráfico orgánico del blog en ventas del catálogo Aromaniak
         ========================================================================= */}
      <section className="my-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white shadow-xl">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-black tracking-widest uppercase mb-2">
          <Sparkles className="w-4 h-4" />
          Perfumería Fina de Inspiración en El Salvador
        </div>
        <h2 className="text-xl sm:text-2xl font-black leading-snug">
          Prueba las Fragancias que Inspiraron este Artículo
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
          En Aromaniak distribuimos esencias 100% puras de perfumería fina e importadas para garantizar máxima fijación y estela prolongada en cada aplicación.
        </p>


        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2 bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
            <Truck className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Envíos a todo El Salvador</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Pago seguro con Wompi SV</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Esencias importadas de lujo</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm text-center shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Explorar Perfumes en Aromaniak
          </Link>
          <Link
            href="/?categoria=Arma+tu+perfume"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm text-center transition-all"
          >
            Arma tu propio perfume (100ml)
          </Link>
        </div>
      </section>

      {/* Artículos Relacionados */}
      {relatedPosts.length > 0 && (
        <section className="mt-14 pt-10 border-t border-slate-200">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
            Otros artículos que te pueden interesar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedPosts.map((rel) => (
              <article
                key={rel.id}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <Link href={`/blog/${rel.slug}`} className="block relative aspect-16/10 overflow-hidden bg-purple-950">
                  {rel.coverImage ? (
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-300/80">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  )}
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  {rel.category && (
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                      {rel.category}
                    </span>
                  )}
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-2">
                    <Link href={`/blog/${rel.slug}`}>
                      {rel.title}
                    </Link>
                  </h4>
                  <div className="mt-auto text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rel.readingTimeMin || 3} min
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
