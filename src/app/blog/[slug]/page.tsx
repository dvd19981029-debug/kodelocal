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
import BlogInlineProductCallout from '@/components/blog/BlogInlineProductCallout';
import BlogReadingSidebar from '@/components/blog/BlogReadingSidebar';
import BlogMobileStickyBar from '@/components/blog/BlogMobileStickyBar';
import { INITIAL_PRODUCTS, ProductItem } from '@/lib/store';

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

function getFeaturedProductForPost(postTitle: string, postContent: string, category?: string | null): ProductItem {
  const text = `${postTitle} ${postContent}`.toLowerCase();
  
  for (const prod of INITIAL_PRODUCTS) {
    if (prod.category !== 'Esencias para Perfume') continue;
    const official = (prod.officialName || '').toLowerCase();
    const name = prod.name.toLowerCase();
    if (official && text.includes(official)) return prod;
    if (name && text.includes(name)) return prod;
  }

  if (text.includes('dama') || text.includes('mujer') || (category && category.toLowerCase().includes('dama'))) {
    const damaProd = INITIAL_PRODUCTS.find(p => p.id === 'esencia-apae-013');
    if (damaProd) return damaProd;
  }

  return INITIAL_PRODUCTS[0];
}

function splitArticleContent(htmlContent: string): { before: string; after: string } {
  const h2Regex = /<h2[^>]*>/gi;
  const matches = [...htmlContent.matchAll(h2Regex)];

  if (matches.length >= 2) {
    const targetMatch = matches[1];
    const targetIndex = targetMatch.index!;
    return {
      before: htmlContent.slice(0, targetIndex),
      after: htmlContent.slice(targetIndex),
    };
  }

  const pRegex = /<\/p>/gi;
  const pMatches = [...htmlContent.matchAll(pRegex)];
  if (pMatches.length >= 4) {
    const splitIdx = pMatches[1].index! + 4;
    return {
      before: htmlContent.slice(0, splitIdx),
      after: htmlContent.slice(splitIdx),
    };
  }

  return { before: htmlContent, after: '' };
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

  const featuredProduct = getFeaturedProductForPost(post.title, post.content, post.category);
  const featuredBottle = INITIAL_PRODUCTS.find(p => p.id === 'bote-100ml-acanalado-blanco') || 
                         INITIAL_PRODUCTS.find(p => p.category === 'Botes') || 
                         INITIAL_PRODUCTS[1];
  const contentParts = splitArticleContent(post.content);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10">
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
            <Link href="/" className="hover:text-indigo-700 transition-colors">
              Inicio
            </Link>
          </li>
          <li>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />
          </li>
          <li>
            <Link href="/blog" className="hover:text-indigo-700 transition-colors">
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
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-700 mr-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Blog
          </Link>
          {post.category && (
            <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
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
              <User className="w-4 h-4 text-indigo-600" />
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
        <div className="relative aspect-16/9 rounded-3xl overflow-hidden mb-10 shadow-md border border-slate-200/60 bg-slate-100">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="relative aspect-16/9 sm:aspect-21/9 rounded-3xl overflow-hidden mb-10 shadow-md border border-slate-200/60 bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-100 flex flex-col items-center justify-center text-center p-6 text-slate-800">
          <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-white/90 px-3 py-1 rounded-lg shadow-2xs mb-2">Aromaniak SV</span>
          <h3 className="text-lg font-black text-slate-900">Perfumería Fina de Inspiración Olfativa</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Esencias 100% puras de inspiración olfativa sin diluir • Retiro en local o envíos a todo El Salvador</p>
        </div>
      )}

      {/* Grid Editorial: Columna Principal de Lectura + Columna Sticky de Compra */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* ================= COLUMNA PRINCIPAL DE LECTURA (8 Cols) ================= */}
        <article className="lg:col-span-8 min-w-0">
          {/* Índice de Contenidos desplegable para versión Móvil */}
          <div className="lg:hidden mb-6">
            <TableOfContents content={post.content} />
          </div>

          {/* Primera mitad del artículo */}
          <div 
            className="blog-prose leading-relaxed text-slate-800 text-base sm:text-lg"
            dangerouslySetInnerHTML={{ __html: contentParts.before }}
          />

          {/* ================= INCENTIVO DE COMPRA EN MEDIO DE LA LECTURA ================= */}
          <BlogInlineProductCallout product={featuredProduct} bottleProduct={featuredBottle} />

          {/* Segunda mitad del artículo */}
          {contentParts.after && (
            <div 
              className="blog-prose leading-relaxed text-slate-800 text-base sm:text-lg"
              dangerouslySetInnerHTML={{ __html: contentParts.after }}
            />
          )}

          {/* Showcase de Perfumes, Botes e Insumos Recomendados al final del artículo */}
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

          {/* Bloque Estratégico de Conversión hacia el E-commerce */}
          <section className="my-12 p-6 sm:p-8 rounded-3xl clay-card bg-white/95 border border-white/80 shadow-md">
            <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg mb-2">
              Inspiración Olfativa
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mt-1">
              Esencias Puras, Botes de Vidrio e Insumos de Perfumería
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-medium">
              En Aromaniak encuentras todo para crear y envasar tus fragancias: esencias 100% puras sin diluir, frascos de vidrio con atomizador de lujo, alcohol especial de perfumería y cajas de empaque.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/70 p-3 rounded-2xl shadow-2xs">
                <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Retiro en local o envíos a todo El Salvador</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/70 p-3 rounded-2xl shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pago seguro con tarjeta o transferencia</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/70 p-3 rounded-2xl shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Esencias puras y botes con atomizador</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto clay-btn clay-btn-primary px-6 py-3 rounded-xl text-white font-black text-xs sm:text-sm text-center shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Explorar Catálogo de Esencias
              </Link>
              <Link
                href="/?categoria=Botes"
                className="w-full sm:w-auto clay-btn clay-btn-light px-6 py-3 rounded-xl text-slate-700 font-bold text-xs sm:text-sm text-center transition-all border border-slate-200"
              >
                Ver Botes y Frascos de Vidrio
              </Link>
              <Link
                href="/?categoria=Arma+tu+perfume"
                className="w-full sm:w-auto clay-btn clay-btn-light px-6 py-3 rounded-xl text-slate-700 font-bold text-xs sm:text-sm text-center transition-all border border-slate-200"
              >
                Arma tu propio perfume (100ml)
              </Link>
            </div>
          </section>
        </article>

        {/* ================= COLUMNA LATERAL STICKY DE COMPRA (4 Cols - Solo Desktop) ================= */}
        <div className="hidden lg:block lg:col-span-4 min-w-0">
          <BlogReadingSidebar product={featuredProduct} bottleProduct={featuredBottle} content={post.content} />
        </div>

      </div>

      {/* ================= ARTÍCULOS RELACIONADOS (Ancho Completo) ================= */}
      {relatedPosts.length > 0 && (
        <section className="mt-14 pt-10 border-t border-slate-200">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
            Otros artículos que te pueden interesar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedPosts.map((rel) => (
              <article
                key={rel.id}
                className="clay-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01]"
              >
                <Link href={`/blog/${rel.slug}`} className="block relative aspect-16/10 overflow-hidden bg-slate-100 border-b border-slate-100">
                  {rel.coverImage ? (
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                      <span className="text-xs font-bold text-slate-400">Aromaniak SV</span>
                    </div>
                  )}
                  {rel.category && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-white/95 backdrop-blur-xs text-indigo-900 border border-slate-200/80 text-[9px] font-extrabold py-0.5 px-2 rounded-md shadow-xs uppercase tracking-wide">
                        {rel.category}
                      </span>
                    </div>
                  )}
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2 mb-2">
                    <Link href={`/blog/${rel.slug}`}>
                      {rel.title}
                    </Link>
                  </h4>
                  <div className="mt-auto text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rel.readingTimeMin || 3} min de lectura
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ================= BARRA FLOTANTE DE COMPRA RÁPIDA EN MÓVIL ================= */}
      <BlogMobileStickyBar product={featuredProduct} />
    </div>
  );
}
