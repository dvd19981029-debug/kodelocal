// src/app/blog/[slug]/page.tsx

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
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
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCatalogShowcase from '@/components/blog/BlogCatalogShowcase';
import BlogInlineProductCallout from '@/components/blog/BlogInlineProductCallout';
import BlogReadingSidebar from '@/components/blog/BlogReadingSidebar';
import BlogMobileStickyBar from '@/components/blog/BlogMobileStickyBar';
import BlogFloatingCartButton from '@/components/blog/BlogFloatingCartButton';
import { INITIAL_PRODUCTS, ProductItem } from '@/lib/store';
import { getRecommendationsForPost } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Carga en vivo inmediata de cualquier slug recién publicado

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
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
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
  if (!htmlContent) return { before: '', after: '' };
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

  // Consultar catálogo activo en tiempo real desde la base de datos
  const dbProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isAvailableOnline: true,
    },
    include: {
      category: true,
    },
    orderBy: [
      { stock: 'desc' },
      { sku: 'asc' },
    ],
  });

  const liveCatalog: ProductItem[] = dbProducts.length > 0
    ? dbProducts.map((p) => ({
        id: p.id,
        sku: p.sku || '',
        barcode: p.barcode || '',
        name: p.name,
        officialName: (p as any).officialName || '',
        brand: (p.category?.name === 'Botes' || p.brand === 'Yahua Industrial' || p.brand === 'APAESA') ? '' : (p.brand || ''),
        gender: p.gender || 'Unisex',
        category: p.category?.name || 'Esencias para Perfume',
        unit: p.unit || 'Onza',
        price: Number(p.price),
        priceHalfOunce: p.priceHalfOunce != null ? Number(p.priceHalfOunce) : (p.category?.name === 'Esencias para Perfume' || !p.category?.name ? Number((Number(p.price) / 2).toFixed(2)) : undefined),
        finishedPerfumePrice: p.finishedPerfumePrice != null ? Number(p.finishedPerfumePrice) : (p.category?.name === 'Esencias para Perfume' || !p.category?.name ? 15.00 : undefined),
        cost: Number(p.cost || 0),
        stock: p.stock,
        minStock: p.minStock,
        imageUrl: (p.category?.name === 'Botes' || p.category?.name === 'Botes & Envases')
          ? (p.imageUrl && p.imageUrl.startsWith('/images/botes/') ? p.imageUrl : '/images/botes/bote_100ml_degrade_azul_noche.jpg')
          : (p.category?.name === 'Esencias para Perfume' || !p.category?.name)
          ? `/images/esencias/esencia_${p.sku || p.id}.webp?v=aroma_official_v3`
          : (p.imageUrl || '/images/essence_bottle_blank.webp'),
        description: p.description || '',
        isAvailableOnline: p.isAvailableOnline,
        puesto: (p as any).puesto || '',
      }))
    : INITIAL_PRODUCTS;

  const recommendations = getRecommendationsForPost(post.title, post.content, post.category, liveCatalog);
  const featuredProduct = recommendations.primaryProduct || liveCatalog.find(p => p.category === 'Esencias para Perfume') || liveCatalog[0];
  const featuredBottle = recommendations.recommendedBottles[0] ||
                         liveCatalog.find(p => p.id === 'bote-100ml-acanalado-blanco') || 
                         liveCatalog.find(p => p.category === 'Botes') || 
                         liveCatalog[1];
  const availableBottles = recommendations.recommendedBottles.length > 0
    ? recommendations.recommendedBottles
    : liveCatalog.filter(p => 
        p.category === 'Botes' && p.imageUrl && p.imageUrl.startsWith('/images/botes/')
      );
  const contentParts = splitArticleContent(post.content);

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-4 sm:py-10 min-w-0 overflow-hidden">
      {/* Barra de progreso de lectura interactiva */}
      <ReadingProgressBar />

      {/* Microdatos estructurados para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cabecera del Artículo (Diseño Editorial Limpio y Llamativo) */}
      <header className="mb-8 sm:mb-10 space-y-4 sm:space-y-5">
        {/* Barra Superior: Volver al Blog + Categoría Enlazada + Tiempo de Lectura */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#7c3aed] bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Blog</span>
          </Link>

          <div className="flex items-center gap-2">
            {post.category && (
              <Link
                href={`/blog?category=${encodeURIComponent(post.category)}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-50 hover:bg-purple-100 text-[#7c3aed] border border-purple-200/80 shadow-2xs transition-colors cursor-pointer"
                title={`Ver artículos en ${post.category}`}
              >
                {post.category}
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100/90 border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {post.readingTimeMin || 3} min de lectura
            </span>
          </div>
        </div>

        {/* Título Principal de Gran Escala Editorial */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.14] sm:leading-[1.1]">
          {post.title}
        </h1>

        {/* Bajada Editorial / Resumen sin bordes pesados */}
        {post.excerpt && (
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed max-w-4xl">
            {post.excerpt}
          </p>
        )}

        {/* Ficha Editorial de Autor y Procedencia */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 pb-2 border-t border-slate-200/80 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7c3aed] to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-2xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  {post.author || 'Equipo Aromaniak'}
                </span>
                <span className="text-[10px] uppercase font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  Perfumería Fina
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {post.publishedAt ? formatBlogDate(post.publishedAt) : ''} • San Salvador, El Salvador
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Inspiración Olfativa • 100% Pura</span>
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full max-w-full min-w-0">
        
        {/* ================= COLUMNA PRINCIPAL DE LECTURA (8 Cols) ================= */}
        <article className="lg:col-span-8 min-w-0 w-full max-w-full overflow-hidden">
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
          <BlogInlineProductCallout
            product={featuredProduct}
            bottleProduct={featuredBottle}
            availableBottles={availableBottles}
            recommendations={recommendations}
            catalog={liveCatalog}
          />

          {/* Segunda mitad del artículo */}
          {contentParts.after && (
            <div 
              className="blog-prose leading-relaxed text-slate-800 text-base sm:text-lg"
              dangerouslySetInnerHTML={{ __html: contentParts.after }}
            />
          )}

          {/* Showcase de Perfumes, Botes e Insumos Recomendados al final del artículo */}
          <BlogCatalogShowcase limit={3} recommendations={recommendations} catalog={liveCatalog} />

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
                Ver todo el catálogo
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
          <BlogReadingSidebar
            product={featuredProduct}
            bottleProduct={featuredBottle}
            availableBottles={availableBottles}
            recommendations={recommendations}
            content={post.content}
            catalog={liveCatalog}
          />
        </div>

      </div>

      {/* ================= ARTÍCULOS RELACIONADOS (Ancho Completo) ================= */}
      {relatedPosts.length > 0 && (
        <section className="mt-14 pt-10 border-t border-slate-200">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
            Otros artículos que te pueden interesar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
            {relatedPosts.map((rel) => (
              <article
                key={rel.id}
                className="clay-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] bg-white/95 h-full border border-slate-200/70 shadow-xs"
              >
                <div className="flex flex-col flex-1">
                  <Link href={`/blog/${rel.slug}`} className="block relative w-full aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100 shrink-0">
                    <img
                      src={rel.coverImage || '/images/promo/banner_aromas.webp'}
                      alt={rel.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    {rel.category && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="bg-white/95 backdrop-blur-xs text-indigo-900 border border-slate-200/80 text-[9px] font-extrabold py-0.5 px-2 rounded-md shadow-xs uppercase tracking-wide">
                          {rel.category}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                    <div className="h-11 flex items-start mb-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">
                        <Link href={`/blog/${rel.slug}`}>
                          {rel.title}
                        </Link>
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-slate-100/90 flex items-center justify-between mt-auto bg-slate-50/50">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rel.readingTimeMin || 3} min de lectura
                  </div>
                  <Link
                    href={`/blog/${rel.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors shrink-0"
                  >
                    <span>Leer</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ================= BOTÓN FINAL: VER TODO EL CATÁLOGO ================= */}
      <div className="mt-12 mb-8 pt-8 border-t border-slate-200/80 flex flex-col items-center justify-center text-center">
        <Link
          href="/"
          className="w-full sm:w-auto clay-btn clay-btn-primary px-8 py-4 rounded-2xl text-white font-black text-sm sm:text-base text-center shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2.5"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Ver todo el catálogo</span>
        </Link>
      </div>

      {/* ================= BOTÓN FLOTANTE DE CARRITO (Se muestra solo si hay productos en el carrito) ================= */}
      <BlogFloatingCartButton />

      {/* ================= BARRA FLOTANTE DE COMPRA RÁPIDA EN MÓVIL ================= */}
      <BlogMobileStickyBar product={featuredProduct} catalog={liveCatalog} />
    </div>
  );
}
