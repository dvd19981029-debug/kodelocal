import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Truck,
  MapPin,
  Droplets,
  Package,
  CheckCircle2,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Esencias y Fragancias en El Salvador | Distribuidora Aromaniak SV',
  description:
    'Compra esencias puras y fragancias finas calidad europea AAA+ en El Salvador. Más de 110 aromas desde $1.90 (½ oz) y $3.75 (1 oz), botes de vidrio y alcohol perfumero. Envíos a todo el país y tienda en San Salvador.',
  keywords: [
    'esencias y fragancias',
    'esencias y fragancias el salvador',
    'esencias y fragancias san salvador',
    'venta de esencias y fragancias el salvador',
    'distribuidora de esencias y fragancias',
    'esencias puras para perfume el salvador',
    'esencias AAA+ el salvador',
    'comprar esencias de perfume san salvador',
    'aromaniak el salvador',
  ],
  alternates: {
    canonical: 'https://aromaniaksv.com/esencias-y-fragancias-el-salvador',
  },
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    url: 'https://aromaniaksv.com/esencias-y-fragancias-el-salvador',
    siteName: 'Aromaniak SV',
    title: 'Esencias y Fragancias en El Salvador | Aromaniak SV',
    description:
      'Distribuidora líder de esencias puras y fragancias finas AAA+ sin diluir en El Salvador. Envíos a los 14 departamentos y tienda oficial en C.C. El Rosal, San Salvador.',
    images: [{ url: '/images/og-default.jpg?v=normal2026', width: 1200, height: 630 }],
  },
};

const FEATURED_FRAGRANCES = [
  { name: 'Baccarat Rouge 540 Extrait', house: 'Maison Francis Kurkdjian', type: 'Unisex • Ámbar Floral', href: '/producto/esencia-111' },
  { name: 'Baccarat Rouge 540', house: 'Maison Francis Kurkdjian', type: 'Unisex • Ámbar Floral', href: '/producto/esencia-60' },
  { name: 'Khamrah', house: 'Lattafa', type: 'Unisex • Ámbar Especiado', href: '/producto/esencia-109' },
  { name: 'Amber Oud', house: 'Al Haramain', type: 'Unisex • Ámbar Vainilla', href: '/producto/esencia-110' },
  { name: 'Sauvage Elixir H', house: 'Dior', type: 'Caballero • Aromática Especiada', href: '/producto/esencia-49' },
  { name: 'Santal 33', house: 'Le Labo', type: 'Unisex • Amaderada Aromática', href: '/producto/esencia-1' },
  { name: 'MYSLF Intense H', house: 'Yves Saint Laurent', type: 'Caballero • Amaderada Floral', href: '/producto/esencia-108' },
  { name: 'Hawas Fire H', house: 'Rasasi', type: 'Caballero • Ámbar Especiado', href: '/producto/esencia-106' },
];

const FAQS = [
  {
    q: '¿Dónde comprar esencias puras y fragancias en El Salvador?',
    a: 'En Aromaniak SV puedes comprar esencias concentradas y fragancias finas 100% puras calidad europea AAA+ en línea en aromaniaksv.com con entrega a domicilio a todo El Salvador, o directamente en nuestra tienda física en Centro Comercial El Rosal, Calle El Progreso, San Salvador.',
  },
  {
    q: '¿Cuánto cuestan las esencias para perfume en Aromaniak?',
    a: 'Ofrecemos esencias puras desde $1.90 la media onza (½ oz) y $3.75 la onza completa (1 oz), además de precios preferenciales para emprendedores y mayoristas.',
  },
  {
    q: '¿Cómo garantizar que una esencia para perfume es 100% pura y sin diluir?',
    a: 'Todas las esencias de Aromaniak se entregan selladas en su envase oficial de 1 oz o ½ oz con etiqueta de trazabilidad Aromaniak, consistencia oleosa pura de perfumería fina y sin mezclas previas con alcohol ni solventes.',
  },
  {
    q: '¿Venden también botes de vidrio, alcohol perfumero y cajas para emprender?',
    a: 'Sí. Además de más de 110 esencias y fragancias finas, contamos con botes de vidrio 100ml con atomizador, alcohol perfumero con fijador, cajas listas para sellar, pisetas dosificadoras, mini embudos y stickers.',
  },
];

export default function EsenciasYFraganciasElSalvadorPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://aromaniaksv.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Esencias y Fragancias en El Salvador',
        item: 'https://aromaniaksv.com/esencias-y-fragancias-el-salvador',
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Esencias y Fragancias Más Buscadas en El Salvador — Aromaniak SV',
    itemListElement: FEATURED_FRAGRANCES.map((f, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `Inspirado en ${f.name} (${f.house})`,
      url: `https://aromaniaksv.com${f.href}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* HERO EDITORIAL */}
      <section className="bg-white border-b border-slate-200/80 pt-10 pb-14 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#48266c] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Distribuidora Oficial en El Salvador</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#260e40] leading-[1.1]">
            Esencias Puras y Fragancias Finas en El Salvador
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            En <strong className="text-[#48266c]">Aromaniak SV</strong> encuentras más de{' '}
            <strong>110 esencias y fragancias de perfumería fina calidad europea AAA+</strong> sin diluir,
            envases de vidrio de lujo y materias primas con envíos rápidos a los 14 departamentos.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/?categoria=Esencias+para+Perfume"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#48266c] hover:bg-[#381b57] text-white font-black text-sm shadow-md transition-colors"
            >
              <span>Ver Catálogo de Esencias y Fragancias</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/?categoria=Arma+tu+perfume"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#48266c] border border-purple-200 font-black text-sm transition-colors"
            >
              <span>Arma tu Propio Perfume</span>
            </Link>
          </div>

          {/* Métricas de confianza */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <p className="text-xl sm:text-2xl font-black text-[#48266c]">110+</p>
              <p className="text-xs font-bold text-slate-600">Esencias puras AAA+ en stock</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <p className="text-xl sm:text-2xl font-black text-[#48266c]">$1.90 / $3.75</p>
              <p className="text-xs font-bold text-slate-600">Media onza y onza completa</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <p className="text-xl sm:text-2xl font-black text-[#48266c]">24–48h</p>
              <p className="text-xs font-bold text-slate-600">Envíos a todo El Salvador</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <p className="text-xl sm:text-2xl font-black text-[#48266c]">100% Puras</p>
              <p className="text-xs font-bold text-slate-600">Sin diluir y selladas de origen</p>
            </div>
          </div>
        </div>
      </section>

      {/* GARANTÍA DE PUREZA Y CALIDAD */}
      <section className="max-w-5xl mx-auto px-4 pt-12 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            ¿Por qué elegir las esencias y fragancias de Aromaniak?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Transparencia total en concentración, precios publicados en línea y frescura garantizada en cada lote.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#48266c] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Pureza AAA+ Sin Diluir</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cada envase de 1 oz y ½ oz se llena directamente desde bidones cerrados de perfumería fina europea,
              conservando sus notas de salida, corazón y fondo intactas.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#48266c] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Todo para Emprender</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Encuentra esencias, botes de vidrio con atomizador de 100ml, alcohol perfumero con fijador, cajas de
              envío, pisetas, embudos y etiquetas en un mismo pedido.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#48266c] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Tienda Online 24/7 y Envíos</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Consulta stock real al instante, paga con tarjeta o transferencia y recibe en todo El Salvador con guía
              rastreable C807 Express o retira en C.C. El Rosal.
            </p>
          </div>
        </div>
      </section>

      {/* FRAGANCIAS DESTACADAS (URLs limpias /producto/esencia-[sku] sin mencionar proveedores) */}
      <section className="max-w-5xl mx-auto px-4 pt-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Esencias y Fragancias Más Buscadas
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Inspiraciones de diseñador, perfumería árabe y nicho disponibles hoy mismo.
            </p>
          </div>
          <Link
            href="/?categoria=Esencias+para+Perfume"
            className="text-sm font-black text-[#48266c] hover:underline inline-flex items-center gap-1"
          >
            <span>Explorar las 110+ esencias</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {FEATURED_FRAGRANCES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 p-4 shadow-xs transition-all flex flex-col justify-between gap-2"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700">
                  {item.house}
                </span>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-[#48266c] mt-0.5">
                  Inspirado en {item.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{item.type}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-black text-[#48266c]">
                <span>1 Oz $3.75 · ½ Oz $1.90</span>
                <Droplets className="w-3.5 h-3.5 opacity-70" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* UBICACIÓN Y GUÍAS */}
      <section className="max-w-5xl mx-auto px-4 pt-12">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Visítanos en San Salvador o pide en línea
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Contamos con atención presencial para que pruebes las esencias y fragancias directamente antes de comprar,
              así como asesoría para emprender tu propia marca de perfumería.
            </p>
            <ul className="space-y-2 text-sm text-slate-700 font-semibold">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#48266c] shrink-0 mt-0.5" />
                <span>Centro Comercial El Rosal, Calle El Progreso, San Salvador, El Salvador</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#48266c] shrink-0 mt-0.5" />
                <span>Lunes a Viernes 9:00 AM – 6:00 PM | Sábados 9:00 AM – 1:00 PM</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Retiro gratuito en tienda o envío a los 14 departamentos</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50/70 rounded-2xl border border-purple-100 p-5 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#48266c]">
              Recursos útiles de perfumería
            </h3>
            <ul className="space-y-2 text-sm font-bold text-slate-800">
              <li>
                <Link href="/blog/guia-como-preparar-perfume-con-esencias-aromaniak" className="hover:text-[#48266c] underline decoration-purple-300">
                  → Guía paso a paso: Cómo preparar un perfume con esencias
                </Link>
              </li>
              <li>
                <Link href="/blog/la-importancia-de-macerar" className="hover:text-[#48266c] underline decoration-purple-300">
                  → La importancia de macerar para lograr fijación de 4 a 8 horas
                </Link>
              </li>
              <li>
                <Link href="/mejor-proveedor-esencias-el-salvador" className="hover:text-[#48266c] underline decoration-purple-300">
                  → Comparativa: Mejor proveedor de esencias en El Salvador
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES */}
      <section className="max-w-5xl mx-auto px-4 pt-12 space-y-5">
        <h2 className="text-2xl font-black text-slate-900 text-center">
          Preguntas frecuentes sobre Esencias y Fragancias en El Salvador
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQS.map((item) => (
            <div key={item.q} className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-2">
              <h3 className="text-sm font-black text-[#260e40]">{item.q}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
