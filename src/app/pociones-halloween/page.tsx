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
  X,
  RefreshCw,
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
  const [stirredComboIds, setStirredComboIds] = useState<string[]>([]);
  const [cauldronStage, setCauldronStage] = useState<'idle' | 'mixing' | 'exploding' | 'revealed'>('idle');
  const [comboPresentation, setComboPresentation] = useState<ProductPresentation>('ONZA_COMPLETA');
  const [comboJustAdded, setComboJustAdded] = useState(false);

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

  // "¡Revolver el Caldero de la Suerte!":
  // 1) Muestra animación de caldero mezclándose
  // 2) Explota mágicamente
  // 3) Da paso a un combo de 3 esencias random de distinta categoría (Amor, Energía, Misterio) siempre de las 10 de la promo y muestra el total
  const handleStirCauldron = () => {
    if (potionProducts.length === 0 || cauldronStage === 'mixing' || cauldronStage === 'exploding') return;
    setActiveFilter('todas');
    setComboJustAdded(false);

    const categories: Array<'amor' | 'energia' | 'misterio'> = ['amor', 'energia', 'misterio'];
    const pickedIds: string[] = [];

    for (const cat of categories) {
      const candidates = potionProducts.filter((p) => {
        const info = getHalloweenPotionInfo(p);
        return info?.categoryTag === cat && (typeof p.stock !== 'number' || p.stock > 0);
      });
      const pool =
        candidates.length > 0
          ? candidates
          : potionProducts.filter((p) => getHalloweenPotionInfo(p)?.categoryTag === cat);

      if (pool.length > 0) {
        // Evitar repetir exactamente el mismo producto de esa categoría si hay más opciones
        const differentPool = pool.filter((p) => !stirredComboIds.includes(p.id));
        const finalPool = differentPool.length > 0 ? differentPool : pool;
        const chosen = finalPool[Math.floor(Math.random() * finalPool.length)];
        pickedIds.push(chosen.id);
      }
    }

    setCauldronStage('mixing');

    setTimeout(() => {
      setCauldronStage('exploding');
    }, 1500);

    setTimeout(() => {
      setStirredComboIds(pickedIds);
      setCauldronStage('revealed');
    }, 2150);
  };

  const stirredComboProducts = useMemo(
    () =>
      stirredComboIds
        .map((id) => potionProducts.find((p) => p.id === id))
        .filter((p): p is ProductItem => Boolean(p)),
    [potionProducts, stirredComboIds]
  );

  const comboUnitPromoPrice =
    comboPresentation === 'MEDIA_ONZA' ? HALLOWEEN_PROMO_PRICE_HALF_OZ : HALLOWEEN_PROMO_PRICE_1OZ;
  const comboUnitOriginalPrice =
    comboPresentation === 'MEDIA_ONZA' ? HALLOWEEN_ORIGINAL_PRICE_HALF_OZ : HALLOWEEN_ORIGINAL_PRICE_1OZ;
  const comboTotalPromo = Number((stirredComboProducts.length * comboUnitPromoPrice).toFixed(2));
  const comboTotalOriginal = Number((stirredComboProducts.length * comboUnitOriginalPrice).toFixed(2));
  const comboTotalSavings = Number(Math.max(0, comboTotalOriginal - comboTotalPromo).toFixed(2));

  const handleAddComboToCart = () => {
    if (stirredComboProducts.length === 0) return;
    stirredComboProducts.forEach((prod) => {
      addToCart(prod, comboPresentation, 1);
    });
    setComboJustAdded(true);
    setTimeout(() => setComboJustAdded(false), 1800);
  };

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
        @keyframes cauldronMixShake {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
          20% { transform: translate3d(-6px, -3px, 0) rotate(-5deg) scale(1.03); }
          40% { transform: translate3d(6px, 2px, 0) rotate(5deg) scale(1.05); }
          60% { transform: translate3d(-5px, 3px, 0) rotate(-4deg) scale(1.04); }
          80% { transform: translate3d(5px, -2px, 0) rotate(4deg) scale(1.06); }
        }
        @keyframes cauldronSpoonStir {
          0% { transform: translate3d(-16px, 0, 0) rotate(-18deg); }
          50% { transform: translate3d(16px, -6px, 0) rotate(18deg); }
          100% { transform: translate3d(-16px, 0, 0) rotate(-18deg); }
        }
        @keyframes cauldronSwirlOrbit {
          0% { transform: rotate(0deg) scale(0.95); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(0.95); }
        }
        @keyframes cauldronProgressFill {
          0% { transform: scaleX(0.05); }
          100% { transform: scaleX(1); }
        }
        @keyframes cauldronExplodeFlash {
          0% { transform: scale(0.4); opacity: 1; }
          60% { transform: scale(2.1); opacity: 0.95; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes cauldronShockwaveRing {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes cauldronComboReveal {
          0% { opacity: 0; transform: scale(0.86) translate3d(0, 14px, 0); }
          100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        .coven-pulse-badge { animation: covenPulseBadge 2.2s ease-in-out infinite; will-change: transform; }
        .coven-float-slow { animation: covenFloatSlow 3.6s ease-in-out infinite; will-change: transform; }
        .coven-star-1 { animation: covenGlowStar 2.8s ease-in-out infinite; }
        .coven-star-2 { animation: covenGlowStar 3.4s ease-in-out 1.1s infinite; }
        .cauldron-mix-shake { animation: cauldronMixShake 0.42s ease-in-out infinite; will-change: transform; }
        .cauldron-spoon-stir { animation: cauldronSpoonStir 0.55s ease-in-out infinite; transform-origin: 100px 95px; will-change: transform; }
        .cauldron-swirl-orbit { animation: cauldronSwirlOrbit 1.2s linear infinite; will-change: transform; }
        .cauldron-progress-fill { animation: cauldronProgressFill 1.5s linear forwards; transform-origin: left center; will-change: transform; }
        .cauldron-explode-flash { animation: cauldronExplodeFlash 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards; will-change: transform, opacity; }
        .cauldron-shockwave-ring { animation: cauldronShockwaveRing 0.65s ease-out forwards; will-change: transform, opacity; }
        .cauldron-combo-reveal { animation: cauldronComboReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; will-change: transform, opacity; }
        @media (prefers-reduced-motion: reduce) {
          .coven-pulse-badge, .coven-float-slow, .coven-star-1, .coven-star-2, .cauldron-mix-shake, .cauldron-spoon-stir, .cauldron-swirl-orbit { animation: none !important; }
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
                Grimorio de 10 Pociones
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
                  <span className="text-[9.5px] uppercase font-black text-amber-300 block">Frasco 1 Onza</span>
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
                  <span className="text-[9.5px] uppercase font-black text-orange-300 block">Frasco ½ Onza</span>
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
                disabled={cauldronStage === 'mixing' || cauldronStage === 'exploding'}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_20px_rgba(249,115,22,0.45)] border-2 border-yellow-100 cursor-pointer hover:brightness-105 active:scale-95 transition-transform disabled:opacity-70"
              >
                <Wand2 className={`w-4 h-4 ${cauldronStage === 'mixing' || cauldronStage === 'exploding' ? 'animate-spin' : ''}`} />
                <span>
                  {cauldronStage === 'mixing' || cauldronStage === 'exploding'
                    ? 'Mezclando el Caldero...'
                    : '¡Revolver el Caldero de la Suerte!'}
                </span>
              </button>
            </div>

            {stirredComboProducts.length === 3 && cauldronStage === 'idle' && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-purple-950/95 border border-amber-300 text-xs font-bold text-amber-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>Último Combo Conjurado (3 Categorías):</span>
                  {stirredComboProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#230d42] border border-orange-400/60 text-amber-200 font-black text-[11px]"
                    >
                      <span>{formatPerfumeDisplayName(p)}</span>
                    </span>
                  ))}
                  <span className="text-amber-300 font-black ml-1">
                    • Total Combo: ${comboTotalPromo.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCauldronStage('revealed')}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-black text-[11px] cursor-pointer hover:brightness-110"
                >
                  Ver Combo
                </button>
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
            { id: 'todas', label: 'Todas (10)' },
            { id: 'amor', label: 'Amor y Atracción' },
            { id: 'energia', label: 'Energía y Éxito' },
            { id: 'misterio', label: 'Misterio y Noche' },
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
            isHighlighted={stirredComboIds.includes(product.id)}
            cart={cart}
            customer={customer}
            addToCart={addToCart}
            updateQuantity={updateQuantity}
          />
        ))}
      </section>

      {/* ================= MODAL DE ANIMACIÓN DEL CALDERO DE LA SUERTE (MEZCLA -> EXPLOSIÓN -> COMBO 3 ESENCIAS) ================= */}
      {cauldronStage !== 'idle' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#070210]/90 backdrop-blur-md overflow-y-auto"
          onClick={() => {
            if (cauldronStage === 'revealed') setCauldronStage('idle');
          }}
        >
          {/* FASE 1: CALDERO MEZCLÁNDOSE */}
          {cauldronStage === 'mixing' && (
            <div
              className="relative flex flex-col items-center justify-center text-center max-w-md w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1e093b] via-[#140529] to-[#0c031a] border-2 border-amber-400 shadow-[0_0_60px_rgba(249,115,22,0.55)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Orbes mágicos orbitando hacia el caldero */}
              <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 cauldron-swirl-orbit pointer-events-none">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899]" />
                  <span className="absolute bottom-3 -left-1 w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_10px_#facc15]" />
                  <span className="absolute bottom-3 -right-1 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                </div>

                {/* SVG del Caldero Mezclándose con Cucharón Mágico */}
                <svg
                  viewBox="0 0 200 200"
                  className="w-44 h-44 sm:w-52 sm:h-52 cauldron-mix-shake overflow-visible"
                >
                  <defs>
                    <radialGradient id="luckyCauldronBody" cx="50%" cy="40%" r="55%">
                      <stop offset="0%" stopColor="#3b1d5e" />
                      <stop offset="55%" stopColor="#1e0b36" />
                      <stop offset="100%" stopColor="#0b0317" />
                    </radialGradient>
                    <linearGradient id="luckyBrewGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>

                  {/* Fuego mágico bajo el caldero */}
                  <path
                    d="M60 172 Q75 148 85 168 Q100 140 115 168 Q128 148 140 172 Z"
                    fill="#f97316"
                    opacity="0.9"
                  />
                  <path
                    d="M72 172 Q88 154 100 168 Q114 152 128 172 Z"
                    fill="#facc15"
                  />

                  {/* Cucharón / Varita gigante revolviendo la poción */}
                  <g className="cauldron-spoon-stir">
                    <rect
                      x="94"
                      y="18"
                      width="11"
                      height="85"
                      rx="5.5"
                      fill="#b45309"
                      stroke="#fde047"
                      strokeWidth="2"
                    />
                    <circle cx="99.5" cy="20" r="8" fill="#facc15" />
                    <ellipse cx="100" cy="95" rx="18" ry="8" fill="#fbbf24" opacity="0.7" />
                  </g>

                  {/* Patas del caldero */}
                  <path d="M58 150 L46 172 L62 172 L68 154 Z" fill="#170929" />
                  <path d="M142 150 L154 172 L138 172 L132 154 Z" fill="#170929" />

                  {/* Cuerpo del caldero */}
                  <path
                    d="M42 82 C26 118 42 162 100 162 C158 162 174 118 158 82 Z"
                    fill="url(#luckyCauldronBody)"
                    stroke="#f97316"
                    strokeWidth="3.5"
                  />

                  {/* Borde superior del caldero */}
                  <rect
                    x="36"
                    y="72"
                    width="128"
                    height="16"
                    rx="8"
                    fill="#2b124c"
                    stroke="#fbbf24"
                    strokeWidth="3"
                  />

                  {/* Líquido mágico hirviendo (Amor + Energía + Misterio) */}
                  <ellipse
                    cx="100"
                    cy="80"
                    rx="56"
                    ry="11"
                    fill="url(#luckyBrewGlow)"
                  />

                  {/* Burbujas mágicas saltando */}
                  <circle cx="75" cy="66" r="7" fill="#f472b6" />
                  <circle cx="102" cy="58" r="9" fill="#facc15" />
                  <circle cx="126" cy="64" r="6.5" fill="#c084fc" />
                  <circle cx="88" cy="48" r="5" fill="#4ade80" />
                  <circle cx="115" cy="46" r="5.5" fill="#fb923c" />

                  {/* Emblema vectorial en la panza del caldero */}
                  <polygon
                    points="100,108 106,120 118,122 109,130 111,142 100,136 89,142 91,130 82,122 94,120"
                    fill="#facc15"
                    stroke="#ea580c"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
                Alquimia en Proceso
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                ¡Mezclando el Caldero de la Suerte!
              </h3>
              <p className="text-xs sm:text-sm text-purple-200 mt-1.5 font-medium">
                Combinando 3 esencias al azar de <strong className="text-pink-300">Amor</strong>,{' '}
                <strong className="text-amber-300">Energía</strong> y{' '}
                <strong className="text-purple-300">Misterio</strong>...
              </p>

              {/* Barra de progreso mágica */}
              <div className="w-full h-2.5 rounded-full bg-purple-950 border border-orange-400/60 overflow-hidden mt-4">
                <div className="h-full w-full bg-gradient-to-r from-pink-500 via-amber-400 to-purple-500 cauldron-progress-fill" />
              </div>
            </div>
          )}

          {/* FASE 2: EXPLOSIÓN DEL CALDERO */}
          {cauldronStage === 'exploding' && (
            <div
              className="relative flex flex-col items-center justify-center text-center p-8 select-none pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ondas expansivas y destello de explosión */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full cauldron-explode-flash"
                  style={{
                    background:
                      'radial-gradient(circle, #fef08a 0%, #f97316 42%, #a855f7 72%, transparent 100%)',
                  }}
                />
                <div className="absolute inset-4 rounded-full border-4 border-amber-300 cauldron-shockwave-ring" />
                <div
                  className="absolute inset-10 rounded-full border-4 border-orange-500 cauldron-shockwave-ring"
                  style={{ animationDelay: '0.08s' }}
                />

                {/* Núcleo explosivo vectorial */}
                <svg viewBox="0 0 120 120" className="relative z-10 w-28 h-28 sm:w-36 sm:h-36">
                  <polygon
                    points="60,6 73,40 110,28 84,56 114,80 76,78 78,114 56,84 24,106 38,70 6,58 42,46 28,14 56,36"
                    fill="#fef08a"
                    stroke="#ea580c"
                    strokeWidth="3"
                  />
                </svg>
              </div>

              <h3 className="relative z-10 text-2xl sm:text-4xl font-black text-amber-300 uppercase tracking-wide drop-shadow-[0_4px_20px_rgba(249,115,22,0.9)]">
                ¡COMBO CONJURADO!
              </h3>
              <p className="relative z-10 text-sm sm:text-base font-black text-white mt-1">
                ¡Tu Trío de 3 Esencias de la Suerte está listo!
              </p>
            </div>
          )}

          {/* FASE 3: REVELACIÓN DEL COMBO DE 3 ESENCIAS RANDOM DE DISTINTA CATEGORÍA + TOTAL */}
          {cauldronStage === 'revealed' && stirredComboProducts.length > 0 && (
            <div
              className="relative w-full max-w-4xl rounded-[28px] sm:rounded-[34px] bg-gradient-to-b from-[#1d0938] via-[#130626] to-[#0c0318] border-2 border-amber-400 shadow-[0_20px_70px_rgba(249,115,22,0.5)] p-4 sm:p-6 lg:p-7 text-white cauldron-combo-reveal my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => setCauldronStage('idle')}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-purple-950/90 hover:bg-rose-900 border border-orange-400/70 flex items-center justify-center text-amber-200 cursor-pointer transition-colors z-20"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Encabezado del Combo Conjurado */}
              <div className="text-center max-w-2xl mx-auto space-y-1.5 pr-6 sm:pr-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#d97706] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider border border-amber-200 shadow-sm">
                  <span>COMBO DE 3 CATEGORÍAS • PROMO HALLOWEEN</span>
                </div>
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  ¡El Caldero conjuró tu{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200">
                    Trío de Pociones de la Suerte!
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-purple-200/90 font-medium">
                  1 poción de <strong className="text-pink-300">Amor y Atracción</strong> + 1 de{' '}
                  <strong className="text-amber-300">Energía y Éxito</strong> + 1 de{' '}
                  <strong className="text-purple-300">Misterio y Noche</strong>:
                </p>
              </div>

              {/* Selector de presentación del Combo (1 Onza vs ½ Onza) */}
              <div className="flex items-center justify-center gap-2 mt-3.5">
                <button
                  type="button"
                  onClick={() => setComboPresentation('ONZA_COMPLETA')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    comboPresentation === 'ONZA_COMPLETA'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-amber-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                      : 'bg-purple-950/80 text-purple-200 border-purple-700 hover:bg-purple-900'
                  }`}
                >
                  Combo en 1 Onza (${HALLOWEEN_PROMO_PRICE_1OZ.toFixed(2)} c/u)
                </button>
                <button
                  type="button"
                  onClick={() => setComboPresentation('MEDIA_ONZA')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    comboPresentation === 'MEDIA_ONZA'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-amber-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                      : 'bg-purple-950/80 text-purple-200 border-purple-700 hover:bg-purple-900'
                  }`}
                >
                  Combo en ½ Onza (${HALLOWEEN_PROMO_PRICE_HALF_OZ.toFixed(2)} c/u)
                </button>
              </div>

              {/* Las 3 Esencias del Combo (1 de cada categoría) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                {stirredComboProducts.map((prod) => {
                  const pInfo = getHalloweenPotionInfo(prod)!;
                  const pDisplayName = formatPerfumeDisplayName(prod);
                  const pInspiracion = getInspiracionPerfumeName(prod);
                  const pImg = getProductImage(prod);
                  const categoryLabel =
                    pInfo.categoryTag === 'amor'
                      ? 'Categoría: Amor y Atracción'
                      : pInfo.categoryTag === 'energia'
                      ? 'Categoría: Energía y Éxito'
                      : 'Categoría: Misterio y Noche';

                  return (
                    <div
                      key={prod.id}
                      className="rounded-2xl bg-gradient-to-b from-[#260e47] via-[#1a0833] to-[#120524] border-2 border-orange-400/80 p-3 flex flex-col justify-between shadow-lg"
                    >
                      <div>
                        {/* Etiqueta de Categoría Distinta */}
                        <div className="text-[9.5px] font-black uppercase tracking-wider text-amber-300 bg-purple-950/90 border border-amber-400/50 rounded-lg px-2 py-1 mb-1.5 text-center truncate">
                          {categoryLabel}
                        </div>

                        {/* Badge de la Poción */}
                        <div
                          className={`w-full rounded-xl bg-gradient-to-r ${pInfo.potionColorClass} text-white px-2.5 py-1 mb-2 border border-amber-200/60 flex items-center justify-center gap-1`}
                        >
                          <span className="text-[10.5px] font-black uppercase tracking-tight truncate">
                            {pInfo.potionTitle}
                          </span>
                        </div>

                        {/* Mini ficha con foto + nombre + original en naranja */}
                        <div className="flex sm:flex-col items-center gap-2.5">
                          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-white border-2 border-orange-400/80 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            <img
                              src={pImg}
                              alt={pDisplayName}
                              onError={(e) => {
                                e.currentTarget.src = '/images/essence_bottle_blank.webp';
                              }}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="min-w-0 flex-1 sm:text-center">
                            <h4 className="text-xs sm:text-sm font-black text-white truncate">
                              {pDisplayName}
                            </h4>
                            <p className="text-[10.5px] sm:text-xs leading-snug mt-0.5 line-clamp-2">
                              <span className="text-purple-200/75 font-semibold">Inspirado en: </span>
                              <strong className="font-black text-[#fb923c]">{pInspiracion}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Precio individual en el combo */}
                      <div className="mt-2.5 pt-2 border-t border-purple-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-300 line-through decoration-rose-500">
                          Antes ${comboUnitOriginalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm sm:text-base font-black text-amber-300">
                          ${comboUnitPromoPrice.toFixed(2)}{' '}
                          <span className="text-[10px] text-orange-300 font-bold">
                            ({comboPresentation === 'MEDIA_ONZA' ? '½ Oz' : '1 Oz'})
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumen del TOTAL del Combo de 3 Esencias + Botones de Acción */}
              <div className="mt-4 sm:mt-5 rounded-2xl bg-gradient-to-r from-[#120524] via-[#2b0c4d] to-[#431407] border-2 border-amber-400 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-inner">
                <div className="text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-bold text-purple-200">
                    <span>
                      Precio normal 3 esencias:{' '}
                      <strong className="text-rose-300 line-through decoration-rose-500">
                        ${comboTotalOriginal.toFixed(2)}
                      </strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10.5px] font-black">
                      Ahorras ${comboTotalSavings.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                      TOTAL DEL COMBO (3 ESENCIAS):
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(250,204,21,0.45)]">
                      ${comboTotalPromo.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStirCauldron}
                    className="px-3.5 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-amber-200 border border-amber-400/70 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                    <span>Otro Combo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddComboToCart}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg border-2 ${
                      comboJustAdded
                        ? 'bg-emerald-600 text-white border-emerald-200 scale-[1.02]'
                        : 'bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 border-yellow-100 hover:brightness-105 active:scale-95'
                    }`}
                  >
                    {comboJustAdded ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>¡Combo de 3 Agregado!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>
                          ¡Agregar Combo (3) por ${comboTotalPromo.toFixed(2)}!
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
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
          <span className="text-[9.5px] sm:text-xs font-black uppercase tracking-tight truncate">
            {potionInfo.potionTitle}
          </span>
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
            <span className="bg-gradient-to-r from-[#1e1b4b]/95 to-[#7c2d12]/95 text-amber-300 border border-amber-400/80 text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm">
              HECHIZO ACTIVO
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
              {potionInfo.potionEffect}
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
