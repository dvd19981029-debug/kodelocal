'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Check, 
  ShoppingBag, 
  Truck, 
  Droplets, 
  Wand2, 
  Plus, 
  Minus, 
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Store,
  CreditCard,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts, saveStoredProducts } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation, getEssenceDiscreteStock } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';
import { getFragranceProfile } from '@/lib/fragranceProfiles';
import ProductCard from '@/components/ecommerce/ProductCard';
import FragranceNotesVisual from '@/components/ecommerce/FragranceNotesVisual';
import { getOriginalPerfumeName } from '@/lib/perfumeNames';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>('ONZA_COMPLETA');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const { cart, addToCart } = useEcommerceCart();

  // 1. Sincronización con catálogo local o API
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          saveStoredProducts(data.products);
        }
      } catch (err) {
        console.error('Error cargando catálogo:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Encontrar producto por ID o por SKU (búsqueda inmediata en catálogo local y estado)
  const product = useMemo(() => {
    if (!productId) return null;
    const decoded = decodeURIComponent(productId).toLowerCase().trim();
    return (
      products.find(p => p.id.toLowerCase() === decoded || String(p.sku || '').toLowerCase() === decoded) ||
      INITIAL_PRODUCTS.find(p => p.id.toLowerCase() === decoded || String(p.sku || '').toLowerCase() === decoded) ||
      null
    );
  }, [products, productId]);

  const isEssence = product?.category === 'Esencias para Perfume';
  const isBottle = product?.category === 'Botes' || product?.category === 'Botes & Envases';

  const presentations = useMemo(() => {
    if (!product) return [];
    return getPresentationsForProduct(product);
  }, [product]);

  const activeOption = useMemo(() => {
    return presentations.find(p => p.id === selectedPresentation) || presentations[0];
  }, [presentations, selectedPresentation]);

  const profile = useMemo(() => {
    if (!product || !isEssence) return null;
    return getFragranceProfile(product);
  }, [product, isEssence]);

  // Productos relacionados (esencias con esencias, botes con botes)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    if (isBottle) {
      return products
        .filter(p => p.id !== product.id && (p.category === 'Botes' || p.category === 'Botes & Envases'))
        .slice(0, 4);
    }
    return products
      .filter(p => p.id !== product.id && p.category === 'Esencias para Perfume' && (p.gender === product.gender || p.gender === 'Unisex'))
      .slice(0, 4);
  }, [products, product, isBottle]);

  // Cálculo de inventario discreto 80/20 (80% botes 1 oz, 20% botes ½ oz)
  // No vendemos producto fraccionable; son botes cerrados ya preparados
  const totalStock = typeof product?.stock === 'number' ? product.stock : 0;
  const isOutOfStock = totalStock <= 0;

  const discreteStock = useMemo(() => {
    if (!product || !isEssence) return null;
    return getEssenceDiscreteStock(totalStock, cart, product.id);
  }, [product, isEssence, totalStock, cart]);

  const availableUnits = isEssence
    ? (selectedPresentation === 'MEDIA_ONZA' ? (discreteStock?.availableHalfOz ?? 0) : (discreteStock?.available1oz ?? 0))
    : Math.max(0, totalStock - (cart.find(it => it.product.id === product?.id)?.quantity || 0));

  const canAddMore = availableUnits >= quantity;

  // Estado de carga elegante mientras se resuelve el producto o catálogo
  if (!product && (isLoading || !productId)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-xs animate-pulse">
          <Droplets className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Cargando producto...</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
          Estamos preparando los detalles y existencias del producto.
        </p>
      </div>
    );
  }

  // Únicamente si la carga terminó por completo y el producto no existe
  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-xs">
          <Droplets className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Producto no encontrado</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
          No pudimos localizar este producto en nuestro catálogo activo. Es posible que haya cambiado de código o esté en reposición.
        </p>
        <Link
          href="/"
          className="clay-btn clay-btn-primary px-5 py-2.5 rounded-2xl text-xs font-black text-white flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  const productImage = getProductImage(product);
  const displayName = product.officialName?.trim() || product.name;

  const handleAddToCart = () => {
    if (isOutOfStock || !canAddMore) return;
    addToCart(product, selectedPresentation, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const getGenderBadge = (gender?: string) => {
    if (!gender) return null;
    const g = gender.toLowerCase();
    if (g.includes('caballero') || g.includes('hombre')) {
      return (
        <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
          Hombre
        </span>
      );
    }
    if (g.includes('dama') || g.includes('mujer')) {
      return (
        <span className="bg-pink-50 border border-pink-200 text-pink-800 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
          Dama
        </span>
      );
    }
    return (
      <span className="bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
        Unisex
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 pt-1">
      


      {/* ================= CONTENEDOR PRINCIPAL PRODUCTO (ESTILO KLONE SCENTS EN CLAYMORPHISM) ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: VITRINA VISUAL CLAYMORPHIC */}
        <div className="lg:col-span-6 space-y-3">
          <div className="clay-card p-3 sm:p-5 bg-white rounded-3xl border border-white/90 relative overflow-hidden shadow-lg group">
            {/* Resplandor suave decorativo de fondo */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-200/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-100/30 blur-2xl pointer-events-none" />

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
              <img
                src={productImage}
                alt={displayName}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = isBottle 
                    ? '/images/botes/bote_100ml_sauvage_degrade_negro.jpg'
                    : '/images/essence_bottle_blank.webp';
                }}
                className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                  isOutOfStock ? 'grayscale-[25%]' : ''
                }`}
              />

              {/* Badge de categoría / género sobre la imagen */}
              <div className="absolute top-3 left-3 z-10">
                {isBottle ? (
                  <span className="bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
                    100 ML • Vidrio
                  </span>
                ) : (
                  getGenderBadge(product.gender)
                )}
              </div>

              {/* Badge Disponibilidad */}
              <div className="absolute top-3 right-3 z-10">
                {isOutOfStock ? (
                  <span className="bg-slate-900 text-white text-xs font-black py-1 px-3 rounded-lg shadow-md uppercase tracking-wider">
                    Agotado
                  </span>
                ) : (
                  <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-xs font-black py-1 px-3 rounded-lg shadow-md flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Disponible</span>
                  </span>
                )}
              </div>

              {/* Sello de pureza / calidad de frasco */}
              <div className="absolute bottom-3 left-3 z-10">
                <span className="bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-200 text-[10.5px] font-black py-1 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5">
                  {isBottle ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Atomizador de Lujo Incluido</span>
                    </>
                  ) : (
                    <>
                      <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                      <span>100% Esencia Concentrada</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Tira rápida de beneficios visuales */}
          <div className="grid grid-cols-2 gap-2 text-center select-none">
            <div className="clay-card py-2.5 px-2 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-700 shadow-2xs">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Envíos C807 Todo el País</span>
            </div>
            <div className="clay-card py-2.5 px-2 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-700 shadow-2xs">
              {isBottle ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Vidrio Grueso Resistente</span>
                </>
              ) : (
                <>
                  <Droplets className="w-4 h-4 text-pink-600" />
                  <span>Esencia Pura Concentrada</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN, NOTAS Y BOTÓN DE COMPRA */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5">
          
          {/* 1. TÍTULO, CONTRATIPO Y VALORACIÓN */}
          <div className="space-y-2">
            
            {/* Nombre Oficial (Contratipo o Bote) - en Bold */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {displayName}
            </h1>

            {/* Inspiración en el perfume original (solo para esencias) */}
            {isEssence && (
              <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400">Inspirado en:</span>
                <strong className="text-slate-800 font-semibold">
                  {getOriginalPerfumeName(product)}
                </strong>
              </div>
            )}

            {/* Subtítulo específico para botes */}
            {isBottle && (
              <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400">Tipo de Envase:</span>
                <strong className="text-slate-900 font-black">Frasco de Vidrio de 100ml</strong>
                <span className="text-slate-300">•</span>
                <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                  Atomizador Spray de Lujo
                </span>
              </div>
            )}

            {/* Precio Prominente */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                ${activeOption ? (activeOption.price * quantity).toFixed(2) : product.price.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {activeOption?.name} {quantity > 1 ? `(${quantity} unidades)` : ''}
              </span>
            </div>

          </div>

          {/* 2. SELECTOR DE PRESENTACIÓN */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {isEssence ? 'Elige tu presentación:' : 'Presentación:'}
              </label>
              {isEssence && profile && (
                <span className="text-[11px] font-bold text-indigo-600">
                  Familia: {profile.family}
                </span>
              )}
              {isBottle && (
                <span className="text-[11px] font-bold text-indigo-600">
                  Capacidad: 100 ml (3.4 oz)
                </span>
              )}
            </div>

            <div className={`grid ${presentations.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
              {presentations.map((pres) => {
                const isSelected = selectedPresentation === pres.id;
                const isPresOutOfStock = isEssence
                  ? (pres.id === 'ONZA_COMPLETA' ? (discreteStock?.available1oz ?? 0) <= 0 : (discreteStock?.availableHalfOz ?? 0) <= 0)
                  : availableUnits <= 0;

                return (
                  <button
                    key={pres.id}
                    type="button"
                    onClick={() => setSelectedPresentation(pres.id)}
                    disabled={isPresOutOfStock}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'clay-card bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-400/40 shadow-xs'
                        : isPresOutOfStock
                        ? 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-black text-slate-900">
                        {pres.name}
                      </span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      ) : isPresOutOfStock ? (
                        <span className="text-[9px] font-bold text-slate-400">
                          Agotado
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-bold text-indigo-700">
                      ${pres.price.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. SELECTOR DE CANTIDAD Y BOTÓN DE COMPRA */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-3">
              
              {/* Control de cantidad */}
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center text-xs font-black text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!canAddMore}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Botón Principal de Agregar al Carrito */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || !canAddMore}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isOutOfStock || !canAddMore
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : justAdded
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : 'clay-btn clay-btn-primary !text-white active:scale-98 shadow-indigo-500/25'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al Carrito • ${(activeOption.price * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>

            </div>

            {/* Aviso de existencias */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En existencia para envío inmediato con <strong>C807</strong></span>
              </span>
              <span>
                Existencias:{' '}
                <strong>
                  {isEssence
                    ? selectedPresentation === 'MEDIA_ONZA'
                      ? `${availableUnits} ${availableUnits === 1 ? 'media onza (½ oz)' : 'medias onzas (½ oz)'}`
                      : `${availableUnits} ${availableUnits === 1 ? 'onza (1 oz)' : 'onzas (1 oz)'}`
                    : `${availableUnits} unidades`}
                </strong>
              </span>
            </div>
          </div>

          {/* ================= PIRÁMIDE OLFATIVA Y NOTAS DE LA FRAGANCIA (SOLO PARA ESENCIAS) ================= */}
          {isEssence && profile && (
            <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Pirámide Olfativa (Notas del Perfume)</span>
                </h3>
                <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Familia: {profile.family}
                </span>
              </div>

              {/* Acordes principales */}
              {profile.accords && profile.accords.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Acordes principales
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {profile.accords.map((accord, idx) => (
                      <span 
                        key={idx}
                        className="bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-[10.5px] font-bold px-2.5 py-1 rounded-xl transition-colors"
                      >
                        {accord}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas Salida / Corazón / Fondo en 3 tarjetas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                  <span className="text-[9.5px] font-black text-amber-800 uppercase tracking-wider block">
                    1. Notas de Salida
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    {profile.topNotes.join(', ')}
                  </p>
                  <span className="text-[9.5px] text-slate-400 block">Primeros 15 a 30 minutos</span>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                  <span className="text-[9.5px] font-black text-indigo-800 uppercase tracking-wider block">
                    2. Notas de Corazón
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    {profile.heartNotes.join(', ')}
                  </p>
                  <span className="text-[9.5px] text-slate-400 block">El alma de la fragancia</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-1">
                  <span className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider block">
                    3. Notas de Fondo
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    {profile.baseNotes.join(', ')}
                  </p>
                  <span className="text-[9.5px] text-slate-400 block">Fijación y estela duradera</span>
                </div>

              </div>

              {/* Pirámide visual con barras de acordes e ingredientes */}
              <FragranceNotesVisual profile={profile} />
            </div>
          )}

          {/* ================= ESPECIFICACIONES TÉCNICAS (PARA BOTES) ================= */}
          {isBottle && (
            <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Especificaciones Técnicas del Frasco</span>
                </h3>
                <span className="text-[10.5px] font-bold text-slate-400 font-mono">
                  {product.sku || '100ML'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Capacidad</span>
                  <strong className="text-xs sm:text-sm font-bold text-slate-800">100 ml (3.4 fl oz)</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Material</span>
                  <strong className="text-xs sm:text-sm font-bold text-slate-800">Vidrio Grueso Premium</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Atomizador</span>
                  <strong className="text-xs sm:text-sm font-bold text-slate-800">Spray Fino de Lujo</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Tipo de Tapa</span>
                  <strong className="text-xs sm:text-sm font-bold text-slate-800">Cierre Hermético</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Compatibilidad</span>
                  <strong className="text-xs sm:text-sm font-bold text-slate-800">Perfumería Fina</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Calidad</span>
                  <strong className="text-xs sm:text-sm font-bold text-indigo-700">Grado Cosmético</strong>
                </div>
              </div>
            </div>
          )}

        </div>

      </section>

      {/* ================= DETALLES DE LA FRAGANCIA O ENVASE Y ENVÍO ================= */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Descripción de la fragancia o envase */}
        <div className="md:col-span-7 clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEssence ? 'Detalles de la fragancia' : 'Detalles del envase'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {isEssence
              ? `Inspirado en ${getOriginalPerfumeName(product)}. Perfil olfativo oficial de alta fijación respaldado por la base de datos de perfumería fina con notas y acordes seleccionados.`
              : (product.description || 'Frasco de vidrio de 100ml de alta resistencia con atomizador de lujo y tapa hermética. Diseñado especialmente para preservar la intensidad y estela de formulaciones de alta perfumería.')}
          </p>
          {isEssence && profile ? (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Estación</span>
                <span className="text-xs font-bold text-slate-800">{profile.season}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Ocasión</span>
                <span className="text-xs font-bold text-slate-800">{profile.occasion}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Intensidad</span>
                <span className="text-xs font-bold text-indigo-700">{profile.intensity}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Formato</span>
                <span className="text-xs font-bold text-slate-800">100 ml</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Material</span>
                <span className="text-xs font-bold text-slate-800">Vidrio</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Acabado</span>
                <span className="text-xs font-bold text-indigo-700">Premium</span>
              </div>
            </div>
          )}
        </div>

        {/* Información de entrega, retiro y políticas */}
        <div className="md:col-span-5 clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between gap-3 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  Envíos a todo El Salvador o Retiro en Local
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Cobertura en los 14 departamentos con C807
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Llegamos a <strong className="text-indigo-700">absolutamente todas partes de El Salvador</strong> de <strong>1 a 2 días hábiles</strong> (normalmente en 1 día). También puedes optar por <strong>pasar retirando gratis en nuestro local en San Salvador</strong>.
            </p>

            <div className="text-[10.5px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
              <p>
                ⏰ <strong>Horarios de entrega:</strong> Pedidos en horario laboral se despachan de inmediato. Como la paquetera y nosotros no laboramos domingos, pedidos enviados el sábado llegan a partir de lunes; pedidos de domingo se despachan lunes y llegan desde martes.
              </p>
              <p className="text-slate-600 font-medium pt-0.5">
                💳 Formas de pago disponibles: <strong>Tarjeta de Crédito / Débito</strong> o <strong>Transferencia bancaria</strong> (Banco Agrícola, BAC Credomatic, Banco Cuscatlán).
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>✓ Retiro o Envío Nacional</span>
            <span>✓ Pago 100% Seguro</span>
          </div>
        </div>
      </section>

      {/* ================= AVISO DE MACERACIÓN Y ADVERTENCIAS DE SALUD ================= */}
      <section className="space-y-3">
        {/* Aclaración de No Maceración */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3">
          <Droplets className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <strong className="font-black text-indigo-950 block mb-0.5">Aclaración Importante de Aromaniak:</strong>
            <p>
              <strong>Nosotros no maceramos ningún perfume.</strong> Nuestras esencias son concentrados puros de contratipos finos listos para que prepares tu fragancia con alcohol especial de perfumería.
            </p>
          </div>
        </div>

        {/* Advertencias de Seguridad Médica y Uso Responsable */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-2 text-xs text-amber-950">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Aviso de Seguridad: Uso Correcto y Precauciones de Salud</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-[11px] sm:text-xs text-amber-900/90 font-medium leading-relaxed">
            <li>
              <strong>No usar directamente sobre la piel:</strong> Las esencias son 100% puras y concentradas. <strong>Tienen que ser mezcladas sí o sí con alcohol especial de perfumería</strong> antes de aplicarse.
            </li>
            <li>
              <strong>Bajo ningún motivo deben ser ingeridas, inhaladas directamente o tener contacto con los ojos.</strong> En caso de salpicadura en los ojos, lavar inmediatamente con abundante agua y buscar atención médica.
            </li>
            <li>
              <strong>Contraindicación por alergias:</strong> No deben ser usadas por personas con alergias conocidas o experiencias previas de reacciones alérgicas a perfumes, fragancias, alcohol o cualquiera de sus componentes. Manténgase fuera del alcance de niños y mascotas.
            </li>
          </ul>
        </div>
      </section>

      {/* ================= PRODUCTOS RELACIONADOS ================= */}
      {relatedProducts.length > 0 && (
        <section className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {isBottle ? 'Otros modelos de frascos disponibles' : 'También te podría gustar'}
            </h3>
            <Link
              href="/"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver catálogo completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-10 sm:gap-y-12">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
