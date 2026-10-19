'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Flame,
  Check,
  Plus,
  Minus,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts, saveStoredProducts } from '@/lib/store';
import {
  useEcommerceCart,
  getPresentationsForProduct,
  ProductPresentation,
  getEssenceDiscreteStock,
} from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { getProductImage } from '@/lib/perfumeImages';
import {
  getInspiracionPerfumeName,
  formatPerfumeDisplayName,
  getBottleLabelConfig,
} from '@/lib/perfumeNames';
import { getProductUrl } from '@/lib/productUrl';
import {
  HALLOWEEN_POTIONS,
  getHalloweenPotionInfo,
  HALLOWEEN_ORIGINAL_PRICE_1OZ,
  HALLOWEEN_PROMO_PRICE_1OZ,
  HALLOWEEN_ORIGINAL_PRICE_HALF_OZ,
  HALLOWEEN_PROMO_PRICE_HALF_OZ,
  isHalloweenSeasonActive,
} from '@/lib/halloweenPromo';
import { AnimatedWitchCauldronSVG } from '@/components/ecommerce/WitchCauldronHeaderBanner';
import {
  CobwebCornerSVG,
  BatIllustrationSVG,
  PumpkinIconSVG,
} from '@/components/ecommerce/HalloweenDecorations';

const POTION_ORDER = Object.keys(HALLOWEEN_POTIONS);

export function WitchPotionsEventSection({
  inline = false,
  onBackToCatalog,
  externalProducts,
}: {
  inline?: boolean;
  onBackToCatalog?: () => void;
  externalProducts?: ProductItem[];
}) {
  const [products, setProducts] = useState<ProductItem[]>(externalProducts || INITIAL_PRODUCTS);
  const [activeFilter, setActiveFilter] = useState<'todas' | 'amor' | 'energia' | 'misterio'>('todas');
  const [stirredPotionId, setStirredPotionId] = useState<string | null>(null);
  const [isStirring, setIsStirring] = useState(false);

  const { cart, addToCart, updateQuantity } = useEcommerceCart();
  const { customer } = useCustomerAuth();

  useEffect(() => {
    if (externalProducts && externalProducts.length > 0) {
      setProducts(externalProducts);
      return;
    }
    let isMounted = true;
    const localProds = getStoredProducts();
    if (localProds && localProds.length > 0) {
      setProducts(localProds);
    }

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          saveStoredProducts(data.products);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [externalProducts]);

  // Obtener las 10 esencias de la promoción de Halloween en el orden oficial de pociones
  const potionProducts = useMemo(() => {
    const matched = products.filter((p) => Boolean(getHalloweenPotionInfo(p)));
    return matched.sort((a, b) => {
      const idxA = POTION_ORDER.indexOf(a.id);
      const idxB = POTION_ORDER.indexOf(b.id);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [products]);

  const filteredPotions = useMemo(() => {
    if (activeFilter === 'todas') return potionProducts;
    return potionProducts.filter((p) => {
      const info = getHalloweenPotionInfo(p);
      return info?.categoryTag === activeFilter;
    });
  }, [potionProducts, activeFilter]);

  if (!isHalloweenSeasonActive()) {
    return (
      <div className="clay-card p-8 text-center max-w-xl mx-auto my-8 space-y-4">
        <h2 className="text-xl font-black text-slate-900">La promoción de Halloween ha finalizado</h2>
        <p className="text-sm text-slate-600">El evento estuvo disponible hasta el 31 de octubre a las 11:59 PM.</p>
        {onBackToCatalog ? (
          <button
            type="button"
            onClick={onBackToCatalog}
            className="clay-btn-primary px-5 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
          >
            Volver al Catálogo
          </button>
        ) : (
          <Link href="/" className="inline-block clay-btn-primary px-5 py-2.5 rounded-xl text-xs font-black text-white">
            Volver al Catálogo
          </Link>
        )}
      </div>
    );
  }

  // Interacción ligera: "¡Revolver el Caldero de la Suerte!"
  const handleStirCauldron = () => {
    if (potionProducts.length === 0 || isStirring) return;
    setIsStirring(true);
    setActiveFilter('todas');
    setTimeout(() => {
      const randomProd = potionProducts[Math.floor(Math.random() * potionProducts.length)];
      setStirredPotionId(randomProd.id);
      setIsStirring(false);
      const cardEl = document.getElementById(`potion-card-${randomProd.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 450);
  };

  const stirredProduct = useMemo(
    () => potionProducts.find((p) => p.id === stirredPotionId) || null,
    [potionProducts, stirredPotionId]
  );
  const stirredPotionInfo = stirredProduct ? getHalloweenPotionInfo(stirredProduct) : null;

  return (
    <div
      id="seccion-pociones-bruja"
      className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#0d041a] via-[#1a0833] to-[#110522] border-2 border-orange-500/80 shadow-[0_18px_50px_rgba(19,7,34,0.65)] p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 text-white"
    >
      {/* Animaciones CSS puras aceleradas por GPU */}
      <style>{`
        @keyframes covenPulseBadge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes covenFloatSlow {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -6px, 0); }
        }
        @keyframes covenGlowStar {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }
          50% { opacity: 0.95; transform: scale(1.1); }
        }
        .coven-pulse-badge { animation: covenPulseBadge 2.2s ease-in-out infinite; will-change: transform; }
        .coven-float-slow { animation: covenFloatSlow 3.6s ease-in-out infinite; will-change: transform; }
        .coven-star-1 { animation: covenGlowStar 2.8s ease-in-out infinite; }
        .coven-star-2 { animation: covenGlowStar 3.4s ease-in-out 1.1s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .coven-pulse-badge, .coven-float-slow, .coven-star-1, .coven-star-2 { animation: none !important; }
        }
      `}</style>

      {/* Decoración Ambiental de Aquelarre: Telarañas gigantes en las esquinas, Luna Llena y Murciélagos */}
      <div className="absolute top-0 left-0 w-32 h-32 sm:w-52 sm:h-52 text-orange-400/25 pointer-events-none">
        <CobwebCornerSVG className="w-full h-full" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-52 sm:h-52 text-orange-400/25 pointer-events-none">
        <CobwebCornerSVG className="w-full h-full" flipX />
      </div>
      <div className="absolute bottom-0 left-0 w-28 h-28 sm:w-40 sm:h-40 text-purple-400/15 pointer-events-none rotate-90">
        <CobwebCornerSVG className="w-full h-full" />
      </div>
      <div className="absolute bottom-0 right-0 w-28 h-28 sm:w-40 sm:h-40 text-purple-400/15 pointer-events-none -rotate-90">
        <CobwebCornerSVG className="w-full h-full" />
      </div>

      {/* Luna llena mística de fondo y murciélagos */}
      <div
        className="pointer-events-none absolute -top-12 right-1/4 w-44 h-44 sm:w-64 sm:h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #fde047 0%, #f97316 55%, transparent 72%)',
        }}
      />
      <div className="pointer-events-none absolute top-14 left-[18%] text-amber-300/50 coven-float-slow hidden sm:block">
        <BatIllustrationSVG className="w-12 h-7" />
      </div>
      <div className="pointer-events-none absolute top-8 right-[15%] text-orange-300/50 coven-float-slow hidden sm:block">
        <BatIllustrationSVG className="w-10 h-6" />
      </div>
      <span className="pointer-events-none absolute top-20 right-[8%] text-amber-300 text-sm coven-star-1">✦</span>
      <span className="pointer-events-none absolute top-32 left-[8%] text-orange-300 text-xs coven-star-2">★</span>

      {/* Barra superior de navegación y sello de vigencia */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-purple-800/60">
        {onBackToCatalog ? (
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-amber-200 border border-orange-400/70 font-black text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Volver al Catálogo</span>
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-amber-200 border border-orange-400/70 font-black text-xs shadow-sm transition-transform active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Volver al Catálogo</span>
          </Link>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ea580c] via-[#d97706] to-[#b45309] text-white border border-amber-200/80 text-[10.5px] sm:text-xs font-black shadow-md">
          <span>🎃</span>
          <span>1 OZ $3.30 • ½ OZ $1.85 • HASTA 31 OCT 11:59 PM</span>
        </div>
      </div>

      {/* ================= ALTAR PRINCIPAL DE LA BRUJA AROMANIAKA ================= */}
      <section className="relative z-10 rounded-3xl bg-gradient-to-br from-[#1f0a3d]/95 via-[#2e1065]/90 to-[#7c2d12]/90 border-2 border-amber-400/70 shadow-[0_10px_30px_rgba(234,88,12,0.28)] p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
          {/* Escena animada de la Bruja + Caldero burbujeante */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-amber-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(249,115,22,0.35)]"
                style={{
                  background: 'radial-gradient(circle, rgba(249,115,22,0.28) 0%, rgba(88,28,135,0.45) 65%, rgba(19,7,34,0.85) 100%)',
                }}
              >
                <AnimatedWitchCauldronSVG className="w-36 h-36 sm:w-44 sm:h-44" />
              </div>
              <span className="absolute -bottom-2 bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-[10px] sm:text-xs px-3.5 py-1 rounded-full border-2 border-white shadow-lg uppercase tracking-wider coven-pulse-badge">
                🧙‍♀️ Grimorio de 10 Pociones
              </span>
            </div>
          </div>

          {/* Textos del Aquelarre, Tarifas Encantadas y Botón del Caldero */}
          <div className="lg:col-span-8 text-center lg:text-left space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-amber-300/60 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>LABORATORIO SECRETO DE HALLOWEEN • EDICIÓN LIMITADA</span>
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
              ¡La bruja Aromaniaka trajo{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200">
                pociones mágicas para ti!
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-purple-100/90 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              10 elixires de perfumería fina 100% pura conjurados en nuestro caldero. Elige tu hechizo de{' '}
              <strong className="text-amber-300">Amor, Atracción, Energía o Misterio</strong> a precio especial de brujería:
            </p>

            {/* Tarjetas gemelas de Precio Antes/Ahora (1 Onza y ½ Onza) + Oráculo del Caldero */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-0.5">
              <div className="bg-[#120623]/90 border-2 border-amber-400/80 rounded-2xl px-3.5 py-2 flex items-center gap-3 shadow-md">
                <div>
                  <span className="text-[9.5px] uppercase font-black text-amber-300 block">🎃 Frasco 1 Onza</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] font-bold text-rose-300/90 line-through decoration-rose-500">
                      ${HALLOWEEN_ORIGINAL_PRICE_1OZ.toFixed(2)}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-amber-300">
                      ${HALLOWEEN_PROMO_PRICE_1OZ.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="h-8 w-[1.5px] bg-purple-700/70" />
                <div>
                  <span className="text-[9.5px] uppercase font-black text-orange-300 block">🧪 Frasco ½ Onza</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] font-bold text-rose-300/90 line-through decoration-rose-500">
                      ${HALLOWEEN_ORIGINAL_PRICE_HALF_OZ.toFixed(2)}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-white">
                      ${HALLOWEEN_PROMO_PRICE_HALF_OZ.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStirCauldron}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_20px_rgba(249,115,22,0.45)] border-2 border-yellow-100 cursor-pointer hover:brightness-105 active:scale-95 transition-transform"
              >
                <Wand2 className={`w-4 h-4 ${isStirring ? 'animate-spin' : ''}`} />
                <span>{isStirring ? 'Conjurando poción...' : '🔮 ¡Revolver el Caldero de la Suerte!'}</span>
              </button>
            </div>

            {stirredProduct && stirredPotionInfo && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/95 border border-amber-300 text-xs font-bold text-amber-100 animate-in fade-in duration-200">
                <span className="text-base">{stirredPotionInfo.potionEmoji}</span>
                <span>
                  El caldero eligió para ti:{' '}
                  <strong className="text-amber-300">{stirredPotionInfo.potionTitle}</strong> —{' '}
                  <span className="text-orange-300 font-black">{formatPerfumeDisplayName(stirredProduct)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= BARRA DE FILTROS MÍSTICOS POR ELEMENTO ================= */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#1b0936]/95 p-3 sm:p-3.5 rounded-2xl border border-orange-400/50 shadow-md">
        <div className="flex items-center gap-2">
          <PumpkinIconSVG className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-wide leading-tight">
              Estantería de Pociones Hechizadas
            </h3>
            <p className="text-[10px] sm:text-[11px] text-purple-200/80 font-medium">
              Filtra por el poder del hechizo o explora las 10 fragancias mágicas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5">
          {[
            { id: 'todas', label: '🧪 Todas (10)' },
            { id: 'amor', label: '💘 Amor y Atracción' },
            { id: 'energia', label: '⚡ Energía y Éxito' },
            { id: 'misterio', label: '🌙 Misterio y Noche' },
          ].map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer border text-center truncate ${
                  active
                    ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-amber-300 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                    : 'bg-purple-950/75 hover:bg-purple-900/80 text-purple-100 border-purple-700/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= REJILLA MULTI-COLUMNA (2 COLUMNAS EN MÓVIL, 3-5 EN ESCRITORIO) ================= */}
      <section className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
        {filteredPotions.map((product, index) => (
          <PotionEventCard
            key={product.id}
            product={product}
            index={index}
            isHighlighted={stirredPotionId === product.id}
            cart={cart}
            customer={customer}
            addToCart={addToCart}
            updateQuantity={updateQuantity}
          />
        ))}
      </section>
    </div>
  );
}

export default function PocionesHalloweenEventPage() {
  return (
    <div className="py-2 sm:py-4">
      <WitchPotionsEventSection inline={false} />
    </div>
  );
}

function PotionEventCard({
  product,
  index,
  isHighlighted,
  cart,
  customer,
  addToCart,
  updateQuantity,
}: {
  product: ProductItem;
  index: number;
  isHighlighted: boolean;
  cart: any[];
  customer: any;
  addToCart: (product: ProductItem, presentation?: ProductPresentation, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
}) {
  const potionInfo = getHalloweenPotionInfo(product)!;
  const presentations = getPresentationsForProduct(product, customer);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>('ONZA_COMPLETA');
  const [justAdded, setJustAdded] = useState(false);

  const activeOption = presentations.find((p) => p.id === selectedPresentation) || presentations[0];
  const displayName = formatPerfumeDisplayName(product);
  const inspiracionPerfumeName = getInspiracionPerfumeName(product);
  const productImage = getProductImage(product);

  const totalStock = typeof product.stock === 'number' ? product.stock : 0;
  const discreteStock = useMemo(
    () => getEssenceDiscreteStock(totalStock, cart, product.id, undefined, product.stockHalf || 0),
    [totalStock, cart, product.id, product.stockHalf]
  );

  const availableUnits =
    selectedPresentation === 'MEDIA_ONZA'
      ? discreteStock.availableHalfOz
      : discreteStock.available1oz;
  const isOutOfStock = totalStock <= 0 || availableUnits <= 0;

  const itemId = `${product.id}-${selectedPresentation}`;
  const matchingItem = cart.find((it) => it.id === itemId && !it.kitDetails);
  const currentQuantity = matchingItem ? matchingItem.quantity : 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedPresentation, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <div
      id={`potion-card-${product.id}`}
      className={`rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#230d42] via-[#18082e] to-[#120524] p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden transition-transform duration-300 ${
        isHighlighted
          ? 'border-2 sm:border-[3px] border-amber-300 ring-4 ring-orange-500/60 scale-[1.02] shadow-[0_12px_32px_rgba(249,115,22,0.5)]'
          : 'border border-orange-400/75 hover:border-amber-300 shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:-translate-y-1'
      }`}
    >
      {/* Parte Superior: Insignia del Hechizo + Imagen del Frasco + Nombre */}
      <div>
        {/* Badge de la Poción (Poción de Amor, Poción de Energía, etc.) */}
        <div
          className={`w-full rounded-xl sm:rounded-2xl bg-gradient-to-r ${potionInfo.potionColorClass} text-white px-2 sm:px-2.5 py-1.5 mb-2 shadow-sm border border-amber-200/60 flex items-center justify-between gap-1`}
        >
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs sm:text-base leading-none shrink-0">{potionInfo.potionEmoji}</span>
            <span className="text-[9.5px] sm:text-xs font-black uppercase tracking-tight truncate">
              {potionInfo.potionTitle}
            </span>
          </div>
          <span className="text-[8.5px] sm:text-[9.5px] font-black bg-slate-950/50 text-amber-200 px-1.5 py-0.5 rounded-md shrink-0 border border-white/20">
            #{index + 1}
          </span>
        </div>

        {/* Ventana del Frasco con telaraña y halo mágico */}
        <Link
          href={getProductUrl(product)}
          className="block relative w-full aspect-square @container rounded-xl sm:rounded-2xl bg-white border-2 border-orange-400/80 overflow-hidden mb-2 group shadow-inner"
        >
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 text-orange-600/60 pointer-events-none z-10">
            <CobwebCornerSVG className="w-full h-full" flipX />
          </div>
          <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 text-purple-900/35 pointer-events-none z-10">
            <CobwebCornerSVG className="w-full h-full" />
          </div>

          <img
            src={productImage}
            alt={displayName}
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = '/images/essence_bottle_blank.webp';
            }}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />

          {productImage === '/images/essence_bottle_blank.webp' &&
            (() => {
              const { lines, fontSize } = getBottleLabelConfig(displayName);
              return (
                <div className="absolute inset-0 pointer-events-none transition-transform duration-300 group-hover:scale-105 origin-center">
                  <div
                    className="absolute flex flex-col items-center justify-center w-full -translate-y-1/2"
                    style={{ top: '65%', left: '0%' }}
                  >
                    <div className="flex flex-col items-center justify-center w-[35%] max-w-[35%] text-center px-0.5">
                      <div
                        className="flex flex-col items-center justify-center text-[#111111] font-[800] tracking-wide leading-[1.12]"
                        style={{ fontSize }}
                      >
                        {lines.map((line, idx) => (
                          <span key={idx} className="block whitespace-nowrap">
                            {line}
                          </span>
                        ))}
                      </div>
                      <div className="mt-[1.2cqw] w-[30%] h-[2px] bg-[#111111]/80" />
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Etiqueta flotante de Oferta Halloween */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between z-10 pointer-events-none">
            <span className="bg-gradient-to-r from-[#1e1b4b]/95 to-[#7c2d12]/95 text-amber-300 border border-amber-400/80 text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm flex items-center gap-0.5">
              <span>🎃</span>
              <span>HECHIZO ACTIVO</span>
            </span>
          </div>
        </Link>

        {/* Nombre comercial + Original en color NARANJA + Pergamino del poder */}
        <div className="space-y-1 px-0.5">
          <Link href={getProductUrl(product)} className="block">
            <h3 className="text-xs sm:text-[15px] font-black text-white hover:text-amber-300 transition-colors truncate leading-snug">
              {displayName}
            </h3>
          </Link>

          <p className="text-[10px] sm:text-xs leading-tight line-clamp-2 min-h-[26px] sm:min-h-[30px]">
            <span className="text-purple-200/75 font-semibold">Inspirado en: </span>
            <strong className="font-black text-[#fb923c]">{inspiracionPerfumeName}</strong>
          </p>

          {/* Poder / Efecto de la Poción */}
          <div className="rounded-lg sm:rounded-xl bg-purple-950/90 border border-purple-600/60 px-2 py-1">
            <p className="text-[9.5px] sm:text-[10.5px] font-bold text-amber-200/95 leading-tight line-clamp-2">
              ✨ {potionInfo.potionEffect}
            </p>
          </div>
        </div>
      </div>

      {/* Parte Inferior: Precio Antes / Ahora + Selector 1 Oz / ½ Oz + Botón */}
      <div className="mt-2.5 pt-2 border-t border-purple-800/70 space-y-1.5 sm:space-y-2">
        {/* Precio Antes y Ahora */}
        <div className="bg-gradient-to-r from-[#2e1065] via-[#3b0764] to-[#7c2d12] border border-orange-400/70 rounded-xl px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[8.5px] sm:text-[9.5px] font-bold text-rose-300 line-through decoration-rose-500 block leading-none">
              Antes ${(activeOption.originalPrice || (selectedPresentation === 'MEDIA_ONZA' ? HALLOWEEN_ORIGINAL_PRICE_HALF_OZ : HALLOWEEN_ORIGINAL_PRICE_1OZ)).toFixed(2)}
            </span>
            <span className="text-sm sm:text-lg font-black text-amber-300 leading-tight block">
              ${activeOption.price.toFixed(2)}
            </span>
          </div>
          <span className="bg-orange-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 border border-amber-200/60">
            {selectedPresentation === 'MEDIA_ONZA' ? '½ OZ' : '1 OZ'}
          </span>
        </div>

        {/* Selector rápido 1 Onza vs ½ Onza */}
        <div className="grid grid-cols-2 gap-1 bg-[#110522] p-0.5 rounded-xl border border-purple-700/80">
          {presentations.map((opt) => {
            const isSelected = selectedPresentation === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPresentation(opt.id)}
                className={`py-1 rounded-lg text-[9.5px] sm:text-[10.5px] font-extrabold transition-all cursor-pointer truncate px-0.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-2xs'
                    : 'text-purple-200 hover:text-white hover:bg-purple-900/50'
                }`}
              >
                {opt.id === 'MEDIA_ONZA' ? `½ Oz $${opt.price.toFixed(2)}` : `1 Oz $${opt.price.toFixed(2)}`}
              </button>
            );
          })}
        </div>

        {/* Botón de Agregar Poción al Carrito */}
        {currentQuantity > 0 ? (
          <div className="flex items-center justify-between gap-1 w-full bg-purple-950 p-1 rounded-xl border border-orange-400 h-[34px] sm:h-[38px]">
            <button
              type="button"
              onClick={() => updateQuantity(itemId, currentQuantity - 1)}
              className="w-7 sm:w-8 h-full rounded-lg bg-purple-900 hover:bg-rose-900 text-white font-black flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="text-[10px] sm:text-xs font-black text-amber-300 truncate">
              {currentQuantity} agregada{currentQuantity > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="w-7 sm:w-8 h-full rounded-lg bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-black flex items-center justify-center cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full h-[34px] sm:h-[38px] rounded-xl font-black text-[10.5px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white scale-[1.02]'
                : 'bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#d97706] hover:brightness-110 text-white border border-amber-300/80 shadow-[0_4px_12px_rgba(234,88,12,0.4)] active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>¡Agregada!</span>
              </>
            ) : isOutOfStock ? (
              <span>Agotado</span>
            ) : (
              <>
                <span>🧪</span>
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Agregar Poción</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
