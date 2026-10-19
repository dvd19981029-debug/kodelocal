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
} from '@/lib/halloweenPromo';
import { AnimatedWitchCauldronSVG } from '@/components/ecommerce/WitchCauldronHeaderBanner';
import {
  CobwebCornerSVG,
  BatIllustrationSVG,
  PumpkinIconSVG,
} from '@/components/ecommerce/HalloweenDecorations';

const POTION_ORDER = Object.keys(HALLOWEEN_POTIONS);

export default function PocionesHalloweenEventPage() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [activeFilter, setActiveFilter] = useState<'todas' | 'amor' | 'energia' | 'misterio'>('todas');
  const [stirredPotionId, setStirredPotionId] = useState<string | null>(null);
  const [isStirring, setIsStirring] = useState(false);

  const { cart, addToCart, updateQuantity, totalItems, subtotal, setIsCartOpen } = useEcommerceCart();
  const { customer } = useCustomerAuth();

  useEffect(() => {
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
  }, []);

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

  // Interacción ligera tipo Temu: "¡Revolver el Caldero de la Suerte!"
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
    <div className="space-y-5 sm:space-y-7 pb-24 pt-1">
      {/* Animaciones CSS puras aceleradas por GPU (transform y opacity únicamente) */}
      <style>{`
        @keyframes temuPulseBadge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes temuFloatSlow {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -6px, 0); }
        }
        .temu-pulse-badge { animation: temuPulseBadge 2s ease-in-out infinite; will-change: transform; }
        .temu-float-slow { animation: temuFloatSlow 3.6s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .temu-pulse-badge, .temu-float-slow { animation: none !important; }
        }
      `}</style>

      {/* Barra superior de navegación de regreso */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-orange-50 text-slate-800 border border-orange-300 font-black text-xs shadow-2xs transition-transform active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" />
          <span>Volver al Catálogo</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-[#ea580c] text-amber-200 border border-orange-400 text-[11px] font-black shadow-xs">
          <Flame className="w-3.5 h-3.5 text-amber-300" />
          <span>EVENTO HALLOWEEN • $3.30 / OZ</span>
        </div>
      </div>

      {/* ================= HERO ESCENARIO TEMU-HALLOWEEN: LA BRUJA AROMANIAKA ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#130722] via-[#2e1065] to-[#9a3412] text-white border-2 border-orange-400 shadow-[0_12px_36px_rgba(234,88,12,0.3)] p-4 sm:p-7">
        {/* Telarañas vectoriales en esquinas */}
        <div className="absolute top-0 left-0 w-28 h-28 sm:w-40 sm:h-40 text-orange-400/35 pointer-events-none">
          <CobwebCornerSVG className="w-full h-full" />
        </div>
        <div className="absolute top-0 right-0 w-28 h-28 sm:w-40 sm:h-40 text-orange-400/35 pointer-events-none">
          <CobwebCornerSVG className="w-full h-full" flipX />
        </div>

        {/* Murciélagos decorativos */}
        <div className="hidden sm:block absolute top-6 left-1/3 text-amber-300/60 pointer-events-none temu-float-slow">
          <BatIllustrationSVG className="w-12 h-7" />
        </div>
        <div className="hidden sm:block absolute bottom-6 right-1/4 text-amber-300/60 pointer-events-none temu-float-slow">
          <BatIllustrationSVG className="w-10 h-6" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Columna Izquierda: Bruja Aromaniaka preparando pociones en su caldero */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-orange-500/20 via-purple-600/20 to-transparent border border-orange-400/30 flex items-center justify-center">
                <AnimatedWitchCauldronSVG className="w-36 h-36 sm:w-44 sm:h-44" />
              </div>
              <span className="absolute -bottom-1 bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-[10px] sm:text-xs px-3 py-1 rounded-full border-2 border-white shadow-md uppercase tracking-wider temu-pulse-badge">
                🧪 10 Pociones Secretas
              </span>
            </div>
          </div>

          {/* Columna Derecha: Textos del Evento + Botón Interactivo del Caldero */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/25 border border-amber-300/50 text-amber-200 text-[10.5px] sm:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ESPECIAL DE HALLOWEEN AROMANIAK</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
              ¡La bruja Aromaniaka trajo{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200">
                pociones para ti!
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-orange-100/90 font-semibold max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Descubre las <strong>10 pociones hechizadas</strong> de perfumería fina 100% pura. Cada fragancia tiene su propio poder especial y está en oferta relámpago de Halloween:
            </p>

            {/* Cinta estilo Temu de Precio Antes y Ahora */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 bg-slate-950/65 border-2 border-amber-400/80 rounded-2xl px-4 py-2.5 shadow-lg">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Precio Regular</span>
                <span className="text-sm sm:text-base font-black text-rose-300 line-through decoration-rose-500 decoration-2">
                  Antes ${HALLOWEEN_ORIGINAL_PRICE_1OZ.toFixed(2)} / Oz
                </span>
              </div>
              <div className="h-7 w-[1.5px] bg-orange-400/40" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-black text-amber-300 block">🔥 Precio Evento Halloween</span>
                <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                  ¡Ahora ${HALLOWEEN_PROMO_PRICE_1OZ.toFixed(2)} la Onza!
                </span>
              </div>
            </div>

            {/* Botón Gamificado estilo Temu: Revolver el Caldero para descubrir tu poción ideal */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <button
                type="button"
                onClick={handleStirCauldron}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_20px_rgba(249,115,22,0.45)] border-2 border-yellow-100 cursor-pointer hover:brightness-105 active:scale-95 transition-transform"
              >
                <Wand2 className={`w-4 h-4 ${isStirring ? 'animate-spin' : ''}`} />
                <span>{isStirring ? 'Revolviendo el caldero...' : '🔮 ¡Revolver el Caldero de la Suerte!'}</span>
              </button>

              {stirredProduct && stirredPotionInfo && (
                <div className="px-3 py-1.5 rounded-xl bg-purple-950/90 border border-amber-300 text-xs font-bold text-amber-100 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <span>{stirredPotionInfo.potionEmoji}</span>
                  <span>
                    Tu hechizo de hoy: <strong className="text-amber-300">{stirredPotionInfo.potionTitle}</strong> ({formatPerfumeDisplayName(stirredProduct)})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= PESTAÑAS DE FILTRO POR PODER DE LA POCIÓN ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#fff7ed] via-[#ffedd5] to-[#fff7ed] p-2.5 sm:p-3.5 rounded-2xl border-2 border-orange-300 shadow-xs">
        <div className="flex items-center gap-2">
          <PumpkinIconSVG className="w-7 h-7 shrink-0" />
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              Elige tu Poción Mágica ($3.30 / 1 Oz)
            </h2>
            <p className="text-[10.5px] sm:text-xs text-slate-600 font-semibold">
              Todos los nombres originales en color naranja • Descuento aplicado directo al carrito
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                  active
                    ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-orange-300 shadow-sm scale-[1.02]'
                    : 'bg-white hover:bg-orange-50 text-slate-700 border-orange-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= REJILLA DE LAS 10 POCIONES ESTILO EVENTO TEMU ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
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

      {/* ================= BARRA FLOTANTE INFERIOR ESTILO TEMU CUANDO HAY POCIONES EN EL CARRITO ================= */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:left-6 max-w-4xl mx-auto z-40">
          <div className="rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#3b0764] to-[#c2410c] text-white p-3 sm:p-3.5 border-2 border-amber-300 shadow-[0_10px_30px_rgba(0,0,0,0.45)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-orange-500/30 border border-amber-300/60 flex items-center justify-center text-lg shrink-0">
                🧪
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                  Tu Caldero de Compras ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
                </span>
                <p className="text-xs sm:text-sm font-black text-white truncate">
                  Subtotal con Promo Halloween: <span className="text-amber-300">${subtotal.toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-black cursor-pointer"
              >
                Ver Carrito
              </button>
              <Link
                href="/checkout"
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-xs flex items-center gap-1 shadow-md border border-yellow-200"
              >
                <span>Pagar Ahora</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </Link>
            </div>
          </div>
        </div>
      )}
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
      className={`rounded-3xl bg-gradient-to-b from-[#fff7ed] via-white to-[#ffedd5]/80 p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden transition-transform duration-300 ${
        isHighlighted
          ? 'border-[3px] border-amber-400 ring-4 ring-orange-500/50 scale-[1.02] shadow-[0_12px_30px_rgba(234,88,12,0.4)]'
          : 'border-2 border-orange-400/90 shadow-[0_8px_22px_rgba(234,88,12,0.18)] hover:-translate-y-1'
      }`}
    >
      {/* Cabecera de la Poción (Badge único: Poción de Amor, Poción de Energía, etc.) */}
      <div>
        <div
          className={`w-full rounded-2xl bg-gradient-to-r ${potionInfo.potionColorClass} text-white px-3 py-2 mb-2.5 shadow-sm border border-amber-200/60 flex items-center justify-between gap-1.5`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base sm:text-lg leading-none shrink-0">{potionInfo.potionEmoji}</span>
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-wide truncate">
              {potionInfo.potionTitle}
            </span>
          </div>
          <span className="text-[9.5px] font-black bg-slate-950/45 text-amber-200 px-1.5 py-0.5 rounded-md shrink-0 border border-white/20">
            #{index + 1}
          </span>
        </div>

        {/* Imagen del frasco con telaraña y etiqueta dinámica */}
        <Link
          href={getProductUrl(product)}
          className="block relative w-full aspect-square @container rounded-2xl bg-white border border-orange-200 overflow-hidden mb-2.5 group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 text-orange-600/55 pointer-events-none z-10">
            <CobwebCornerSVG className="w-full h-full" flipX />
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

          {/* Sello de ahorro estilo Temu sobre la foto */}
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-slate-950/90 text-amber-300 border border-orange-400 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
              <span>🎃</span>
              <span>Ahorras $0.45 / Oz</span>
            </span>
          </div>
        </Link>

        {/* Nombre comercial + Nombre del Perfume Original en color NARANJA */}
        <div className="space-y-1 px-0.5">
          <Link href={getProductUrl(product)} className="block">
            <h3 className="text-base font-black text-slate-900 hover:text-orange-600 transition-colors truncate">
              {displayName}
            </h3>
          </Link>

          <p className="text-xs leading-snug line-clamp-2">
            <span className="text-slate-600 font-semibold">Inspirado en: </span>
            <strong className="font-black text-[#ea580c]">{inspiracionPerfumeName}</strong>
          </p>

          {/* Descripción del hechizo / efecto de la poción */}
          <p className="text-[10.5px] font-bold text-purple-950 bg-purple-100/70 border border-purple-200/80 rounded-xl px-2 py-1 leading-tight">
            ✨ {potionInfo.potionEffect}
          </p>
        </div>
      </div>

      {/* Bloque Inferior: Precio Antes y Ahora estilo Temu + Botón Calabaza */}
      <div className="mt-3 pt-2.5 border-t border-orange-200/80 space-y-2">
        {/* Precio Antes y Ahora */}
        <div className="bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 border border-orange-300 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold text-slate-500 line-through decoration-rose-500 decoration-2 block">
              Antes ${(activeOption.originalPrice || HALLOWEEN_ORIGINAL_PRICE_1OZ).toFixed(2)}
            </span>
            <span className="text-lg font-black text-[#c2410c] leading-none">
              Ahora ${activeOption.price.toFixed(2)}
            </span>
          </div>
          <span className="bg-[#ea580c] text-white text-[9.5px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
            ⚡ OFERTA 1 OZ
          </span>
        </div>

        {/* Selector rápido 1 Onza vs ½ Onza */}
        <div className="grid grid-cols-2 gap-1 bg-orange-50 p-0.5 rounded-xl border border-orange-200">
          {presentations.map((opt) => {
            const isSelected = selectedPresentation === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPresentation(opt.id)}
                className={`py-1 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-orange-100/50'
                }`}
              >
                {opt.id === 'MEDIA_ONZA' ? `½ Oz ($${opt.price.toFixed(2)})` : `🎃 1 Oz ($${opt.price.toFixed(2)})`}
              </button>
            );
          })}
        </div>

        {/* Botón de Agregar Poción al Carrito */}
        {currentQuantity > 0 ? (
          <div className="flex items-center justify-between gap-1 w-full bg-orange-100/90 p-1 rounded-xl border border-orange-300 h-[40px]">
            <button
              type="button"
              onClick={() => updateQuantity(itemId, currentQuantity - 1)}
              className="w-8 h-full rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-black flex items-center justify-center shadow-2xs cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="text-center leading-tight">
              <span className="text-xs font-black text-[#c2410c]">{currentQuantity} en caldero</span>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="w-8 h-full rounded-lg bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-black flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full h-[40px] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white scale-[1.02]'
                : 'bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#d97706] hover:brightness-105 text-white border border-orange-300 shadow-[0_4px_12px_rgba(234,88,12,0.35)] active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>¡Poción Agregada!</span>
              </>
            ) : isOutOfStock ? (
              <span>Agotado</span>
            ) : (
              <>
                <span>🧪</span>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>¡Agregar Poción!</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
