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
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation, getEssenceDiscreteStock, getBottleAvailableStock } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { getProductImage } from '@/lib/perfumeImages';
import { getFragranceProfile, getFragranceAccordBars } from '@/lib/fragranceProfiles';
import ProductCard from '@/components/ecommerce/ProductCard';
import FragranceNotesVisual from '@/components/ecommerce/FragranceNotesVisual';
import { getInspiracionPerfumeName, formatPerfumeDisplayName, getBottleLabelConfig, isIncomingEssence, isNewEssence } from '@/lib/perfumeNames';
import {
  getCricutStickerEntryForProduct,
  getStickerFooterClassification,
  CRICUT_STICKER_SPECS,
  STICKER_BOTTLE_MOCKUPS,
} from '@/lib/cricutStickers';
import StickerBottlePreview from '@/components/ecommerce/StickerBottlePreview';
import { getFragranceDescription } from '@/lib/fragranceDescriptions';
import { resolveTargetProductId } from '@/lib/productUrl';
import { isHalloweenPromoProduct, getHalloweenPotionInfo, HALLOWEEN_ORIGINAL_PRICE_1OZ, HALLOWEEN_ORIGINAL_PRICE_HALF_OZ } from '@/lib/halloweenPromo';
import { trackMarketingEvent } from '@/components/analytics/MarketingScripts';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>('ONZA_COMPLETA');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedStickerBottleId, setSelectedStickerBottleId] = useState<string | null>(null);

  const { cart, addToCart, updateQuantity, setIsCartOpen } = useEcommerceCart();
  const { customer } = useCustomerAuth();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // 1. Sincronización con catálogo local o API
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/products?fresh=true', { cache: 'no-store' });
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

    const handleProductsUpdate = () => {
      if (isMounted) {
        const fresh = getStoredProducts();
        if (fresh && fresh.length > 0) {
          setProducts(fresh);
        }
      }
    };

    loadCatalog();
    window.addEventListener('kodelocal_products_updated', handleProductsUpdate);
    window.addEventListener('storage', handleProductsUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('kodelocal_products_updated', handleProductsUpdate);
      window.removeEventListener('storage', handleProductsUpdate);
    };
  }, []);

  // 2. Encontrar producto por ID, SKU o Barcode (búsqueda robusta en catálogo)
  const product = useMemo(() => {
    if (!productId) return null;
    const raw = String(productId).trim();
    const resolvedId = resolveTargetProductId(raw);
    const decoded = decodeURIComponent(resolvedId).toLowerCase().trim();
    const cleanDecoded = decoded.replace(/^prod-/, '').replace(/^esencia-/, '');
    const numericSku = cleanDecoded && /^\d+$/.test(cleanDecoded) ? String(parseInt(cleanDecoded, 10)) : '';

    const isOnlineEligible = (p: ProductItem) => {
      if (p.isAvailableOnline === false) return false;
      if (p.id === 'cmvfrqz7v0003jp08y8bmrnpz' || p.id === 'ENVIO-DOM' || p.category === 'Logística') return false;
      if (String(p.name || '').trim().toLowerCase() === '$1 alcohol') return false;
      return true;
    };

    const matchProduct = (p: ProductItem) => {
      if (!isOnlineEligible(p)) return false;
      const pId = p.id.toLowerCase().trim();
      const pSku = String(p.sku || '').toLowerCase().trim();
      const pBarcode = String(p.barcode || '').toLowerCase().trim();
      const pCleanId = pId.replace(/^prod-/, '').replace(/^esencia-/, '');

      return (
        pId === decoded ||
        pId === raw.toLowerCase().trim() ||
        pSku === decoded ||
        pBarcode === decoded ||
        (cleanDecoded !== '' && (
          pCleanId === cleanDecoded || 
          pSku === cleanDecoded || 
          (numericSku !== '' && pSku === numericSku)
        ))
      );
    };

    return products.find(matchProduct) || INITIAL_PRODUCTS.find(matchProduct) || null;
  }, [products, productId]);

  const isEssence = product?.category === 'Esencias para Perfume';
  const isBottle = product?.category === 'Botes' || product?.category === 'Botes & Envases';
  const isSticker = product?.category === 'Stickers' || String(product?.id || '').startsWith('sticker-');
  const stickerEntry = useMemo(() => (isSticker ? getCricutStickerEntryForProduct(product) : null), [product, isSticker]);
  const isIncoming = isBottle || (isEssence && isIncomingEssence(product));

  const presentations = useMemo(() => {
    if (!product) return [];
    return getPresentationsForProduct(product, customer);
  }, [product, customer]);

  const activeOption = useMemo(() => {
    return presentations.find(p => p.id === selectedPresentation) || presentations[0];
  }, [presentations, selectedPresentation]);

  const profile = useMemo(() => {
    if (!product || !isEssence) return null;
    return getFragranceProfile(product);
  }, [product, isEssence]);

  const accordBars = useMemo(() => {
    if (!profile) return [];
    return getFragranceAccordBars(profile);
  }, [profile]);

  // Identificador del item en el carrito para esta presentación
  const cartItemId = `${product?.id}-${selectedPresentation}`;
  const existingCartItem = useMemo(() => {
    if (!product) return null;
    return cart.find(item => item.id === cartItemId && !item.kitDetails) || null;
  }, [cart, cartItemId, product]);

  const cartQuantity = existingCartItem ? existingCartItem.quantity : 0;
  const isAlreadyInCart = cartQuantity > 0;

  // Sincronizar presentación por defecto si cambia de categoría
  useEffect(() => {
    setSelectedStickerBottleId(null);
    if (!product) return;
    if (product.category !== 'Esencias para Perfume' && selectedPresentation !== 'UNIDAD') {
      setSelectedPresentation('UNIDAD');
    }
  }, [product?.id, product?.category]);

  // Sincronizar la cantidad inicial con lo que ya está en el carrito para evitar sobreescritura accidental
  useEffect(() => {
    if (!product) return;
    const cid = `${product.id}-${selectedPresentation}`;
    const item = cart.find(it => it.id === cid && !it.kitDetails);
    if (item && item.quantity > 0) {
      setQuantity(item.quantity);
    } else {
      setQuantity(1);
    }
  }, [product?.id, selectedPresentation]);

  // Evento estándar Meta Pixel ViewContent para sincronización en tiempo real de microdatos del catálogo
  useEffect(() => {
    if (!product || typeof window === 'undefined') return;
    const priceVal = Number((activeOption?.price || product.price || 3.75).toFixed(2));
    trackMarketingEvent('ViewContent', {
      content_ids: [product.id],
      contents: [{ id: product.id, quantity: 1, item_price: priceVal }],
      content_name: formatPerfumeDisplayName(product),
      content_category: product.category || 'Perfumería',
      content_type: 'product',
      value: priceVal,
      currency: 'USD',
    });
  }, [product?.id]);

  // Productos relacionados (esencias con esencias, botes con botes, stickers con su esencia y stickers)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const onlineOnly = products.filter(
      (p) =>
        p.id !== product.id &&
        p.isAvailableOnline !== false &&
        p.id !== 'cmvfrqz7v0003jp08y8bmrnpz' &&
        String(p.name || '').trim().toLowerCase() !== '$1 alcohol'
    );
    if (isBottle) {
      return onlineOnly
        .filter(p => p.category === 'Botes' || p.category === 'Botes & Envases')
        .slice(0, 4);
    }
    if (isSticker) {
      const targetSku = stickerEntry?.sku || String(product.sku || '').replace(/^STK-/i, '');
      const matchingEssence = onlineOnly.find(
        (p) => p.category === 'Esencias para Perfume' && String(p.sku || '') === targetSku
      );
      const otherStickers = onlineOnly
        .filter((p) => p.category === 'Stickers' && p.gender === product.gender)
        .slice(0, matchingEssence ? 3 : 4);
      return matchingEssence ? [matchingEssence, ...otherStickers] : otherStickers;
    }
    if (!isEssence) {
      return onlineOnly
        .filter((p) => p.category === 'Stickers')
        .slice(0, 4);
    }
    const matchingSticker = onlineOnly.find(
      (p) => p.category === 'Stickers' && String(p.sku || '').replace(/^STK-/i, '') === String(product.sku || '')
    );
    const otherEssences = onlineOnly
      .filter(p => p.category === 'Esencias para Perfume' && (p.gender === product.gender || p.gender === 'Unisex'))
      .slice(0, matchingSticker ? 3 : 4);
    return matchingSticker ? [...otherEssences, matchingSticker] : otherEssences;
  }, [products, product, isEssence, isBottle, isSticker, stickerEntry]);

  // Cálculo de inventario discreto 80/20 para esencias y general para otros productos
  const totalStock = typeof product?.stock === 'number' ? product.stock : 0;
  const totalStockHalf = typeof product?.stockHalf === 'number' ? product.stockHalf : 0;

  const discreteStock = useMemo(() => {
    if (!product || !isEssence) return null;
    return getEssenceDiscreteStock(totalStock, cart, product.id, undefined, totalStockHalf);
  }, [product, isEssence, totalStock, totalStockHalf, cart]);

  // Si las onzas completas están agotadas pero quedan medias onzas, preseleccionar MEDIA_ONZA automáticamente
  useEffect(() => {
    if (!product || !isEssence || !discreteStock) return;
    if (
      selectedPresentation === 'ONZA_COMPLETA' &&
      discreteStock.available1oz <= 0 &&
      discreteStock.availableHalfOz > 0 &&
      !isAlreadyInCart
    ) {
      setSelectedPresentation('MEDIA_ONZA');
    }
  }, [product?.id, isEssence, discreteStock, selectedPresentation, isAlreadyInCart]);

  // Unidades disponibles restantes en bodega para esta presentación específica (descontando lo que ya está en el carrito)
  const availableRemaining = useMemo(() => {
    if (!product) return 0;
    if (isEssence) {
      return selectedPresentation === 'MEDIA_ONZA' 
        ? (discreteStock?.availableHalfOz ?? 0) 
        : (discreteStock?.available1oz ?? 0);
    }
    return getBottleAvailableStock(totalStock, cart, product.id);
  }, [product, isEssence, selectedPresentation, discreteStock, cart, totalStock]);

  // Límite máximo seleccionable en el contador: lo que ya tiene en carrito + lo que queda disponible en bodega
  const maxSelectable = cartQuantity + availableRemaining;
  const isProductCompletelyOut = isEssence ? totalStock <= 0 && totalStockHalf <= 0 : totalStock <= 0;
  const isOutOfStock = isProductCompletelyOut || maxSelectable <= 0;

  // Bloqueo inteligente: si la cantidad elegida es exactamente la que ya está en el carrito, se bloquea el botón para evitar duplicar (ej. 6 a 12)
  const isQuantityBlocked = isAlreadyInCart && quantity === cartQuantity;

  // Umbral de stock mínimo de alerta configurado en el producto
  const minStockThreshold = typeof product?.minStock === 'number' && product.minStock > 0
    ? product.minStock
    : 15;

  const unitsRemainingAfterChoice = availableRemaining - Math.max(0, quantity - cartQuantity);
  const isBelowMinAlert = availableRemaining > 0 && (availableRemaining <= minStockThreshold || unitsRemainingAfterChoice < minStockThreshold);

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
  const displayName = formatPerfumeDisplayName(product);
  const potionInfo = getHalloweenPotionInfo(product);
  const isHalloweenPromo = Boolean(potionInfo);
  const activeStickerBottle =
    isSticker && selectedStickerBottleId
      ? STICKER_BOTTLE_MOCKUPS.find((b) => b.id === selectedStickerBottleId) || null
      : null;

  const handleAddToCart = () => {
    if (!product || isOutOfStock || maxSelectable <= 0 || isQuantityBlocked) return;

    if (isAlreadyInCart) {
      // Actualiza la cantidad exacta en el carrito (ej. de 6 a 7)
      updateQuantity(cartItemId, quantity);
    } else {
      // Agrega por primera vez la cantidad seleccionada
      addToCart(product, selectedPresentation, quantity);
    }

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

  
  const productSchemaUrl = `https://aromaniaksv.com/producto/${product.id}`;
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "productID": product.id,
    "sku": product.id,
    "name": displayName,
    "image": [
      `https://aromaniaksv.com/images/meta/${encodeURIComponent(product.id)}.jpg?v=5`
    ],
    "description": product.description || `Insumo de perfumería fina Aromaniak: ${displayName}.`,
    "brand": {
      "@type": "Brand",
      "name": "Aromaniak"
    },
    "offers": {
      "@type": "Offer",
      "url": productSchemaUrl,
      "priceCurrency": "USD",
      "price": activeOption.price.toFixed(2),
      "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Aromaniak SV"
      }
    }
  };

  if (isBottle) {
    const quickBottlePacks = [1, 3, 6, 12];
    const unitPrice = activeOption?.price ?? product.price;
    const lineTotal = unitPrice * quantity;
    const showStockBadge = hasHydrated || !isLoading;

    return (
      <div className="space-y-6 sm:space-y-8 pb-20 pt-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />

        {/* Navegación superior discreta */}
        <div className="flex items-center justify-between gap-2 px-1">
          <Link
            href="/?categoria=Botes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Botes de Vidrio</span>
          </Link>
          {product.sku && (
            <span className="text-[11px] font-mono font-bold text-slate-600">
              SKU: {product.sku}
            </span>
          )}
        </div>

        {/* ================= HERO PRINCIPAL DE 2 COLUMNAS (IMAGEN + BUY BOX ARRIBA DEL PLIEGUE) ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* COLUMNA IZQUIERDA: VITRINA LIMPIA DEL FRASCO */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="clay-card p-3 sm:p-5 bg-white rounded-3xl border border-white/90 relative overflow-hidden shadow-lg group">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                <img
                  src={productImage}
                  alt={displayName}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/images/botes/bote_100ml_degrade_azul_noche.jpg';
                  }}
                  className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                    showStockBadge && isOutOfStock ? 'grayscale-[35%]' : ''
                  }`}
                />

                {showStockBadge && (
                  <div className="absolute top-3 right-3 z-10">
                    {isOutOfStock ? (
                      <span className="bg-slate-900 text-white text-xs font-black py-1 px-3 rounded-lg shadow-md uppercase tracking-wider">
                        En camino
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-xs font-black py-1 px-3 rounded-lg shadow-md inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Disponible</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: BUY BOX DE ALTA CONVERSIÓN */}
          <div className="lg:col-span-6 space-y-4">
            <div className="clay-card p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-md space-y-5">
              {/* Título y subtítulo claro */}
              <div className="space-y-2">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                  Envase de Vidrio • 100 ml (3.4 fl oz)
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#7c3aed] tracking-tight leading-tight">
                  {displayName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  Frasco de vidrio grueso con atomizador spray de lujo y tapa de rosca hermética.
                </p>
              </div>

              {/* Precio y disponibilidad */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight tabular-nums">
                    ${lineTotal.toFixed(2)}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 tabular-nums">
                    {quantity > 1 ? `($${unitPrice.toFixed(2)} c/u • ${quantity} uds.)` : 'por unidad'}
                  </span>
                </div>

                {showStockBadge && (
                  <span className="text-xs font-bold text-slate-800">
                    {availableRemaining === 0 ? (
                      cartQuantity > 0 ? (
                        <span className="text-indigo-700">Todo el stock reservado en tu carrito</span>
                      ) : (
                        <span className="text-slate-600">Próximo ingreso a bodega</span>
                      )
                    ) : isBelowMinAlert ? (
                      <strong className="text-amber-800 font-black">
                        {availableRemaining === 1
                          ? '¡Solo queda 1 unidad!'
                          : `¡Solo quedan ${availableRemaining} unidades!`}
                      </strong>
                    ) : (
                      <span className="text-emerald-700 font-extrabold">Entrega inmediata</span>
                    )}
                  </span>
                )}
              </div>

              {/* Selección rápida de cantidad + stepper */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Cantidad
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">
                    Incluye atomizador + tapa
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {quickBottlePacks.map((pack) => {
                    const disabled = pack > maxSelectable || isOutOfStock;
                    const isSelected = quantity === pack;
                    return (
                      <button
                        key={pack}
                        type="button"
                        disabled={disabled}
                        onClick={() => setQuantity(pack)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-800'
                            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400'
                        }`}
                      >
                        {pack} {pack === 1 ? 'ud.' : 'uds.'}
                      </button>
                    );
                  })}

                  <div className="flex items-center rounded-xl border border-slate-300 bg-white p-0.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Disminuir cantidad"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-xs font-black text-slate-950 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= maxSelectable}
                      aria-label="Aumentar cantidad"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón CTA Principal */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || maxSelectable <= 0 || isQuantityBlocked}
                    className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      isOutOfStock || maxSelectable <= 0
                        ? 'bg-slate-200 text-slate-600 cursor-not-allowed border border-slate-300'
                        : justAdded
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                        : isQuantityBlocked
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-default'
                        : isAlreadyInCart
                        ? 'clay-btn bg-gradient-to-r from-amber-600 to-amber-700 !text-white active:scale-98 cursor-pointer'
                        : 'clay-btn clay-btn-primary !text-white active:scale-98 cursor-pointer'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isAlreadyInCart ? '¡Carrito Actualizado!' : '¡Agregado al Carrito!'}</span>
                      </>
                    ) : isQuantityBlocked ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>En tu carrito ({cartQuantity}) • ${(unitPrice * cartQuantity).toFixed(2)}</span>
                      </>
                    ) : isAlreadyInCart ? (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Actualizar Carrito • ${lineTotal.toFixed(2)}</span>
                      </>
                    ) : isOutOfStock || maxSelectable <= 0 ? (
                      <span>En camino</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Agregar al Carrito • ${lineTotal.toFixed(2)}</span>
                      </>
                    )}
                  </button>

                  {(isAlreadyInCart || justAdded) && (
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="px-5 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
                    >
                      Ir al carrito
                    </button>
                  )}
                </div>
              </div>

              {/* 3 beneficios clave sin repetición */}
              <ul className="pt-3 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-900">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Cierre de rosca fácil a mano — no requiere máquina selladora ni genera fugas.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Vidrio grueso de 100 ml grado cosmético compatible con perfumería fina.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Envío a domicilio a todo El Salvador (24–48h) o retiro gratis en local.</span>
                </li>
              </ul>
            </div>

            {/* Acceso directo a Arma tu propio perfume */}
            <Link
              href="/?categoria=Arma+tu+perfume#seccion-arma-tu-perfume"
              className="w-full clay-card clay-card-interactive group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-purple-200/80 hover:border-purple-300 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-950 leading-tight">
                    ¿Prefieres tu perfume ya armado?
                  </p>
                  <p className="text-xs text-slate-700 font-medium truncate">
                    Elige tu esencia favorita + frasco 100 ml + alcohol perfumero
                  </p>
                </div>
              </div>
              <span className="clay-btn clay-btn-primary !text-white px-3.5 py-2 rounded-xl text-xs font-black shrink-0 inline-flex items-center gap-1">
                <span>Armar</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </section>

        {/* ================= DETALLES Y ENTREGA (COMPACTO Y LEGIBLE) ================= */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 clay-card p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs">
            <h2 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider">
              Especificaciones del envase
            </h2>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {product.description || 'Frasco de vidrio grueso de 100 ml con atomizador spray y cierre de rosca hermético. Ideal para envasar perfumes de forma rápida sin necesidad de selladora.'}
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">Capacidad</span>
                <strong className="text-xs sm:text-sm font-black text-slate-950">100 ml (3.4 fl oz)</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">Cierre</span>
                <strong className="text-xs sm:text-sm font-black text-slate-950">Rosca manual hermética</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">Material</span>
                <strong className="text-xs sm:text-sm font-black text-slate-950">Vidrio grueso premium</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">Incluye</span>
                <strong className="text-xs sm:text-sm font-black text-indigo-700">Atomizador + Tapa</strong>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 clay-card p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-950">
                    Envíos en El Salvador y Retiro en Local
                  </h2>
                  <p className="text-xs text-slate-700 font-medium">
                    Entregas de 24 a 48 horas hábiles en los 14 departamentos
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-800 font-medium leading-relaxed">
                <li>
                  <strong className="font-bold text-slate-950">Retiro gratis en tienda:</strong> Centro Comercial El Rosal, Calle El Progreso, San Salvador.
                </li>
                <li>
                  <strong className="font-bold text-slate-950">Despachos:</strong> Pedidos en horario laboral se despachan el mismo día (pedidos de fin de semana salen el lunes).
                </li>
                <li>
                  <strong className="font-bold text-slate-950">Formas de pago:</strong> Tarjeta de crédito/débito vía Wompi o transferencia a Bancoagrícola y BAC Credomatic.
                </li>
              </ul>
            </div>

            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>✓ Stock verificado</span>
              <span>✓ Pago 100% seguro</span>
            </div>
          </div>
        </section>

        {/* ================= OTROS MODELOS DE FRASCOS ================= */}
        {relatedProducts.length > 0 && (
          <section className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                Otros modelos de frascos disponibles
              </h2>
              <Link
                href="/?categoria=Botes"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
              >
                <span>Ver todos los botes</span>
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

  if (isEssence) {
    const unitPrice = activeOption?.price ?? product.price;
    const lineTotal = unitPrice * quantity;
    const showStockBadge = hasHydrated || !isLoading;
    const genderLabel = (() => {
      const g = (product.gender || '').toLowerCase();
      if (g.includes('caballero') || g.includes('hombre')) return 'Caballero';
      if (g.includes('dama') || g.includes('mujer')) return 'Dama';
      if (g) return 'Unisex';
      return null;
    })();
    const canOrderReadyPerfume = Boolean(discreteStock && discreteStock.available1oz > 0);

    return (
      <div className="space-y-8 sm:space-y-10 pb-20 pt-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />

        {/* Breadcrumb sutil */}
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:text-slate-950 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/?categoria=Esencias" className="hover:text-slate-950 transition-colors">
            Esencias
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-950 font-bold truncate">{displayName}</span>
        </nav>

        {/* ================= HERO PRODUCTO: FOTO + BUY BOX ABOVE THE FOLD ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Izquierda: Vitrina limpia y sticky */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="clay-card p-3 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm group">
              <div className="relative aspect-square w-full @container rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                <img
                  src={productImage}
                  alt={displayName}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/images/essence_bottle_blank.webp';
                  }}
                  className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03] ${
                    isOutOfStock ? 'grayscale-[35%]' : ''
                  }`}
                />

                {/* Etiqueta dinámica del frasco de esencia */}
                {productImage === '/images/essence_bottle_blank.webp' && (() => {
                  const { lines, fontSize } = getBottleLabelConfig(displayName);
                  return (
                    <div className="absolute inset-0 pointer-events-none transition-transform duration-500 group-hover:scale-[1.03] origin-center">
                      <div className="absolute flex flex-col items-center justify-center w-full -translate-y-1/2" style={{ top: '65%', left: '0%' }}>
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
                          <div className="mt-[1.2cqw] w-[30%] h-[2px] bg-[#111111]/80"></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Un único indicador discreto cuando aplica */}
                {showStockBadge && (
                  <div className="absolute top-3.5 right-3.5 z-10">
                    {isOutOfStock ? (
                      <span className="bg-slate-900 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                        {isIncoming ? 'En camino' : 'Agotado'}
                      </span>
                    ) : isNewEssence(product) ? (
                      <span className="gold-ticket-wrap">
                        <span className="gold-ticket-badge text-[10px] sm:text-[11px] font-black tracking-wider uppercase !py-1 !px-2.5">
                          <span className="gold-ticket-text">Nuevo</span>
                        </span>
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Derecha: Buy Box clara, directa y sin ruido */}
          <div className="lg:col-span-6">
            <div className="clay-card p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              {/* Encabezado e inspiración */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                  {genderLabel && (
                    <span className="text-slate-800">{genderLabel}</span>
                  )}
                  {genderLabel && profile?.family && (
                    <span className="text-slate-300">•</span>
                  )}
                  {profile?.family && (
                    <span className="text-indigo-700">{profile.family}</span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                  {displayName}
                </h1>

                <p className="text-sm text-slate-700 font-medium">
                  Inspirado en{' '}
                  <strong className="text-slate-950 font-black">
                    {getInspiracionPerfumeName(product)}
                  </strong>
                </p>
              </div>

              {/* Precio y disponibilidad */}
              <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-baseline justify-between gap-2">
                {isHalloweenPromo ? (
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-sm font-bold text-slate-500 line-through decoration-rose-500 decoration-2 tabular-nums">
                      ${((activeOption.originalPrice || (selectedPresentation === 'MEDIA_ONZA' ? HALLOWEEN_ORIGINAL_PRICE_HALF_OZ : HALLOWEEN_ORIGINAL_PRICE_1OZ)) * quantity).toFixed(2)}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight tabular-nums">
                      ${lineTotal.toFixed(2)}
                    </span>
                    <span className="text-xs font-extrabold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
                      Oferta especial
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight tabular-nums">
                      ${lineTotal.toFixed(2)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700">
                      {activeOption?.name}
                      {quantity > 1 ? ` · ${quantity} uds.` : ''}
                    </span>
                  </div>
                )}

                {showStockBadge && (
                  <span className="text-xs font-bold">
                    {availableRemaining === 0 ? (
                      cartQuantity > 0 ? (
                        <span className="text-indigo-700">Todo el stock en tu carrito</span>
                      ) : (
                        <span className="text-slate-600">
                          {isIncoming ? 'Próximo ingreso a bodega' : 'Temporalmente agotado'}
                        </span>
                      )
                    ) : isBelowMinAlert ? (
                      <strong className="text-amber-800 font-black">
                        {selectedPresentation === 'MEDIA_ONZA'
                          ? availableRemaining === 1
                            ? '¡Última ½ onza disponible!'
                            : `¡Solo quedan ${availableRemaining} medias onzas!`
                          : availableRemaining === 1
                          ? '¡Última onza disponible!'
                          : `¡Solo quedan ${availableRemaining} onzas!`}
                      </strong>
                    ) : (
                      <span className="text-emerald-700 font-extrabold">Disponible para envío</span>
                    )}
                  </span>
                )}
              </div>

              {/* Selector de presentación */}
              {presentations.length > 1 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    Presentación
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {presentations.map((pres) => {
                      const isSelected = selectedPresentation === pres.id;
                      const isPresOutOfStock =
                        pres.id === 'ONZA_COMPLETA'
                          ? (discreteStock?.available1oz ?? 0) <= 0
                          : (discreteStock?.availableHalfOz ?? 0) <= 0;

                      return (
                        <button
                          key={pres.id}
                          type="button"
                          onClick={() => setSelectedPresentation(pres.id)}
                          disabled={isPresOutOfStock}
                          className={`px-3.5 py-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'border-2 border-indigo-600 bg-indigo-50/70 text-slate-950'
                              : isPresOutOfStock
                              ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
                          }`}
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-black leading-tight">
                              {pres.name}
                            </div>
                            <div className="text-xs font-bold text-indigo-700 tabular-nums mt-0.5">
                              {pres.id === 'ONZA_COMPLETA' && isHalloweenPromo && pres.originalPrice && pres.originalPrice > pres.price && (
                                <span className="text-slate-400 line-through mr-1.5 font-semibold">
                                  ${pres.originalPrice.toFixed(2)}
                                </span>
                              )}
                              ${pres.price.toFixed(2)}
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : isPresOutOfStock ? (
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                              {isIncoming ? 'En camino' : 'Agotado'}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stepper de cantidad + CTA Principal */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-stretch gap-2.5">
                  <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Disminuir cantidad"
                      className="w-9 h-10 rounded-xl flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-slate-950 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= maxSelectable}
                      aria-label="Aumentar cantidad"
                      className="w-9 h-10 rounded-xl flex items-center justify-center text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || maxSelectable <= 0 || isQuantityBlocked}
                    className={`flex-1 py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      isOutOfStock || maxSelectable <= 0
                        ? 'bg-slate-200 text-slate-600 cursor-not-allowed border border-slate-300'
                        : justAdded
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                        : isQuantityBlocked
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-default'
                        : isAlreadyInCart
                        ? 'clay-btn bg-gradient-to-r from-amber-600 to-amber-700 !text-white active:scale-98 cursor-pointer'
                        : 'clay-btn clay-btn-primary !text-white active:scale-98 cursor-pointer'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isAlreadyInCart ? '¡Carrito Actualizado!' : '¡Agregado al Carrito!'}</span>
                      </>
                    ) : isQuantityBlocked ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>En el Carrito ({cartQuantity}) • ${(unitPrice * cartQuantity).toFixed(2)}</span>
                      </>
                    ) : isAlreadyInCart ? (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Actualizar Carrito • ${lineTotal.toFixed(2)}</span>
                      </>
                    ) : isOutOfStock || maxSelectable <= 0 ? (
                      <span>{isIncoming ? 'En camino' : 'Agotado'}</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Agregar al Carrito • ${lineTotal.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>

                {cartQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-800 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ir al carrito y finalizar pedido</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 3 puntos concretos de valor */}
              <ul className="pt-3 border-t border-slate-100 space-y-2 text-xs sm:text-[13px] font-semibold text-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% esencia pura sin diluir, lista para mezclar.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 onza rinde para preparar un perfume completo de 100 ml.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Envío nacional en 24–48 h o retiro gratis en San Salvador.</span>
                </li>
              </ul>

              {/* Acceso directo a Pídela ya armada */}
              <div className="pt-3 border-t border-slate-100">
                <Link
                  href={canOrderReadyPerfume ? `/?categoria=Arma+tu+perfume&essenceId=${product.id}#seccion-arma-tu-perfume` : '#'}
                  onClick={(e) => {
                    if (!canOrderReadyPerfume) e.preventDefault();
                  }}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-colors ${
                    canOrderReadyPerfume
                      ? 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-200'
                      : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-950">
                        ¿La prefieres ya preparada?
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 truncate">
                        {canOrderReadyPerfume
                          ? 'Ármala en frasco de 100 ml con bote y alcohol incluidos'
                          : 'Sin stock de 1 oz para armar por ahora'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-700 shrink-0 flex items-center gap-0.5">
                    <span>Armar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PERFIL OLFATIVO: ACORDES Y PIRÁMIDE DE NOTAS ================= */}
        {profile && (
          <section className="clay-card p-5 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-start">
              {/* Columna Izquierda: Descripción, ocasión y acordes principales */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-950">
                    Perfil olfativo y acordes
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {getFragranceDescription(product, profile)}
                  </p>
                </div>

                {(profile.season || profile.occasion) && (
                  <dl className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    {profile.season && (
                      <div>
                        <dt className="text-[11px] font-bold text-slate-500">Estación ideal</dt>
                        <dd className="font-extrabold text-slate-900 mt-0.5">{profile.season}</dd>
                      </div>
                    )}
                    {profile.occasion && (
                      <div>
                        <dt className="text-[11px] font-bold text-slate-500">Ocasión</dt>
                        <dd className="font-extrabold text-slate-900 mt-0.5">{profile.occasion}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {profile.accords && profile.accords.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Acordes principales
                    </h3>

                    {accordBars.length > 0 ? (
                      <div className="flex flex-col gap-1.5 w-full">
                        {accordBars.map((bar, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: `${bar.percentage}%`,
                              backgroundColor: bar.bg,
                              color: bar.text,
                              minWidth: '110px'
                            }}
                            className="min-h-[30px] py-1 px-3 rounded-r-xl rounded-l-md flex items-center justify-start transition-all duration-200 hover:brightness-105"
                          >
                            <span className="text-[11.5px] font-extrabold tracking-wide lowercase truncate">
                              {bar.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {profile.accords.map((accord, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl"
                          >
                            {accord}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Pirámide olfativa con fotos reales de notas */}
              <div className="lg:col-span-7 lg:pl-6 lg:border-l lg:border-slate-100">
                <FragranceNotesVisual profile={profile} showAccords={false} />
              </div>
            </div>
          </section>
        )}

        {/* ================= PREPARACIÓN, USO Y ENVÍO ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="clay-card p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>Preparación y uso responsable</span>
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium">
              No maceramos perfumes: entregamos la esencia concentrada pura para que prepares tu fragancia al instante. Para un frasco de 100 ml mezcla <strong>1 onza (30 ml)</strong> —hasta un máximo de <strong>1.5 onzas</strong>— con alcohol especial de perfumería.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium pt-1 border-t border-slate-100">
              <li>• No aplicar sin diluir directamente sobre la piel.</li>
              <li>• Evitar contacto con ojos, ingestión o inhalación directa.</li>
              <li>• No usar en caso de alergia a fragancias o alcohol; mantener lejos de niños.</li>
            </ul>
          </div>

          <div className="clay-card p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>Envíos, retiro y formas de pago</span>
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium">
                Entregas a domicilio en todo El Salvador (24 a 48 h hábiles) o retiro gratis en nuestro local en San Salvador. Pedidos de sábado llegan desde lunes; los de domingo se despachan el lunes.
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-100 text-xs font-bold text-slate-800">
              Pagos aceptados: Tarjeta de Crédito / Débito o Transferencia bancaria (Banco Agrícola y BAC Credomatic).
            </div>
          </div>
        </section>

        {/* ================= PRODUCTOS RELACIONADOS ================= */}
        {relatedProducts.length > 0 && (
          <section className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                También te podría interesar
              </h3>
              <Link
                href="/"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
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

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 pt-1">
      {/* SEO Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* ================= CONTENEDOR PRINCIPAL PRODUCTO (ESTILO KLONE SCENTS EN CLAYMORPHISM) ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: VITRINA VISUAL CLAYMORPHIC */}
        <div className="lg:col-span-6 space-y-3">
          <div className="clay-card p-3 sm:p-5 bg-white rounded-3xl border border-white/90 relative overflow-hidden shadow-lg group">
            {/* Resplandor suave decorativo de fondo */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-200/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-100/30 blur-2xl pointer-events-none" />

            <div className="relative aspect-square w-full @container rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
              {activeStickerBottle ? (
                <div className="w-full h-full">
                  <StickerBottlePreview
                    stickerImageUrl={productImage}
                    bottleConfig={activeStickerBottle}
                    alt={`${displayName} aplicada en ${activeStickerBottle.name}`}
                  />
                </div>
              ) : (
                <img
                  src={productImage}
                  alt={displayName}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = isBottle 
                      ? '/images/botes/bote_100ml_degrade_azul_noche.jpg'
                      : '/images/essence_bottle_blank.webp';
                  }}
                  className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                    isOutOfStock && !isSticker ? 'grayscale-[35%]' : ''
                  }`}
                />
              )}
              
              {/* Overlay CSS para el nombre dinámico del bote de esencia */}
              {productImage === '/images/essence_bottle_blank.webp' && (() => {
                const { lines, fontSize } = getBottleLabelConfig(displayName);
                return (
                  <div className="absolute inset-0 pointer-events-none transition-transform duration-500 group-hover:scale-[1.05] origin-center">
                    <div className="absolute flex flex-col items-center justify-center w-full -translate-y-1/2" style={{ top: '65%', left: '0%' }}>
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
                        <div className="mt-[1.2cqw] w-[30%] h-[2px] bg-[#111111]/80"></div>
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* Badge de categoría / género sobre la imagen */}
              <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
                {isBottle ? (
                  <span className="bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
                    100 ML • Vidrio
                  </span>
                ) : (
                  <>
                    {getGenderBadge(product.gender)}
                    {isSticker && (
                      <span className="bg-white/95 backdrop-blur-xs text-slate-900 border border-slate-200 text-[10.5px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
                        5.3 × 5.0 cm
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Badge Disponibilidad */}
              <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                {isEssence && isNewEssence(product) && (
                  <span className="gold-ticket-wrap">
                    <span className="gold-ticket-badge text-[10px] sm:text-[11px] font-black tracking-wider uppercase !py-1 !px-2.5">
                      <span className="relative z-10 flex items-center pr-1.5 border-r border-dashed border-amber-900/35">
                        <Sparkles className="w-3 h-3 text-amber-950 fill-amber-700/30 shrink-0" />
                      </span>
                      <span className="gold-ticket-text pl-0.5">Nuevo</span>
                    </span>
                  </span>
                )}
                {isOutOfStock ? (
                  <span className="bg-slate-900 text-white text-xs font-black py-1 px-3 rounded-lg shadow-md uppercase tracking-wider">
                    {isIncoming ? 'En camino' : 'Agotado'}
                  </span>
                ) : (
                  <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-xs font-black py-1 px-3 rounded-lg shadow-md flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Disponible</span>
                  </span>
                )}
              </div>

              {/* Sello de pureza / calidad de frasco */}
              <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
                <span className="bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200 text-[10.5px] font-black py-1 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5">
                  {isBottle ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cierre de Rosca</span>
                    </>
                  ) : isEssence ? (
                    <>
                      <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                      <span>100% Esencia NO diluida</span>
                    </>
                  ) : isSticker ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {activeStickerBottle
                          ? `Ejemplo real en ${activeStickerBottle.name}`
                          : 'Etiqueta 5.3 × 5.0 cm'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{product.unit || 'Calidad Garantizada'}</span>
                    </>
                  )}
                </span>

                {activeStickerBottle && (
                  <Link
                    href={`/producto/${activeStickerBottle.productId}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-black py-1 px-2.5 rounded-lg shadow-md transition-colors"
                  >
                    Ver este bote →
                  </Link>
                )}
              </div>
            </div>

            {/* Galería interactiva para Stickers: Etiqueta individual + Ejemplos reales en los botes que vendemos */}
            {isSticker && (
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Previsualizar esta etiqueta en nuestros botes de 100 ml:
                  </span>
                  <span className="text-[10.5px] font-bold text-indigo-600">
                    Escala real 1:1 (5.3 × 5.0 cm)
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStickerBottleId(null)}
                    className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStickerBottleId === null
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-400/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1">
                      <img
                        src={productImage}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[9.5px] font-black text-slate-800 leading-tight line-clamp-1">
                      Etiqueta
                    </span>
                  </button>

                  {STICKER_BOTTLE_MOCKUPS.map((b) => {
                    const isSelected = selectedStickerBottleId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedStickerBottleId(b.id)}
                        className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-400/40 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-white mb-1">
                          <StickerBottlePreview
                            stickerImageUrl={productImage}
                            bottleConfig={b}
                            alt={`${displayName} en ${b.name}`}
                          />
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-700 leading-tight line-clamp-1">
                          {b.shortName.replace(/^Bote\s+/i, '').replace(/\s+100ml$/i, '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================= SECCIÓN DE COMPRA DIRECTAMENTE ABAJO DE LA IMAGEN (PARA TODOS LOS PRODUCTOS) ================= */}
          <div className="clay-card p-4 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-md space-y-4">
            
            {/* 1. Nombre del Producto en Grande y Moradito de la misma paleta */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#7c3aed] tracking-tight leading-tight">
                {displayName}
              </h1>

              {/* Subtítulo según la categoría */}
              {isEssence && (
                <div className="text-xs sm:text-sm text-slate-700 font-medium flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-slate-600 font-semibold">Inspirado en:</span>
                  <strong className="text-slate-950 font-black text-sm sm:text-base">
                    {getInspiracionPerfumeName(product)}
                  </strong>
                </div>
              )}

              {isBottle && (
                <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-slate-400">Tipo de Envase:</span>
                  <strong className="text-slate-900 font-black">Frasco de Vidrio de 100ml</strong>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                    Atomizador Spray de Lujo
                  </span>
                </div>
              )}

              {!isEssence && !isBottle && (
                <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-slate-400">{isSticker ? 'Inspirado en:' : 'Categoría:'}</span>
                  <strong className="text-slate-900 font-black">
                    {isSticker && stickerEntry
                      ? `${stickerEntry.nombre} (${stickerEntry.marca} · ${stickerEntry.anio})`
                      : 'Insumos de Perfumería'}
                  </strong>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                    {isSticker ? 'Sticker 5.3 × 5.0 cm' : (product.unit || 'Alta Pureza')}
                  </span>
                </div>
              )}

              {/* Precio Prominente */}
              <div className="pt-2 flex flex-wrap items-baseline gap-2.5">
                {isHalloweenPromo ? (
                  <div className="flex flex-wrap items-baseline gap-3 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-sm sm:text-base font-bold text-slate-500 line-through decoration-rose-500 decoration-2">
                      Antes ${((activeOption.originalPrice || (selectedPresentation === 'MEDIA_ONZA' ? HALLOWEEN_ORIGINAL_PRICE_HALF_OZ : HALLOWEEN_ORIGINAL_PRICE_1OZ)) * quantity).toFixed(2)}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      Ahora ${(activeOption.price * quantity).toFixed(2)}
                    </span>
                    <span className="text-[11px] font-black bg-purple-700 text-white px-2 py-0.5 rounded-lg">
                      Oferta Especial
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    ${(activeOption.price * quantity).toFixed(2)}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-500">
                  {activeOption?.name} {quantity > 1 ? `(${quantity} unidades)` : ''}
                </span>
              </div>
            </div>

            {/* 2. Selector de Presentación (si tiene más de 1 opción, o presentación estándar) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {presentations.length > 1 ? 'Elige tu presentación:' : 'Presentación:'}
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
                {!isEssence && !isBottle && (
                  <span className="text-[11px] font-bold text-indigo-600">
                    {product.unit || 'Unidad individual'}
                  </span>
                )}
              </div>

              {presentations.length > 1 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {presentations.map((pres) => {
                    const isSelected = selectedPresentation === pres.id;
                    const isPresOutOfStock = isEssence
                      ? (pres.id === 'ONZA_COMPLETA' 
                          ? (discreteStock?.available1oz ?? 0) <= 0 
                          : (discreteStock?.availableHalfOz ?? 0) <= 0)
                      : availableRemaining <= 0;

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
                              {isIncoming ? 'En camino' : 'Agotado'}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          {pres.id === 'ONZA_COMPLETA' && isHalloweenPromo && pres.originalPrice && pres.originalPrice > pres.price && (
                            <span className="text-[10px] font-bold text-slate-400 line-through decoration-rose-500">
                              ${pres.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-xs font-bold text-indigo-700">
                            ${pres.price.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {isBottle ? 'Frasco de Vidrio de 100ml con Atomizador y Tapa' : activeOption.name}
                  </span>
                  <span className="text-xs font-black text-indigo-700">
                    ${activeOption.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* 3. Selector de Cantidad y Botón de Compra con Bloqueo Inteligente */}
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
                    disabled={quantity >= maxSelectable}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Botón Principal con bloqueo de duplicidad */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || maxSelectable <= 0 || isQuantityBlocked}
                  className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    isOutOfStock || maxSelectable <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : justAdded
                      ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                      : isQuantityBlocked
                      ? 'bg-slate-100 text-slate-600 border border-slate-300 shadow-xs cursor-not-allowed opacity-90'
                      : isAlreadyInCart
                      ? 'clay-btn bg-gradient-to-r from-amber-600 to-amber-700 !text-white active:scale-98 shadow-amber-500/25 cursor-pointer'
                      : 'clay-btn clay-btn-primary !text-white active:scale-98 shadow-indigo-500/25 cursor-pointer'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isAlreadyInCart ? '¡Carrito Actualizado!' : '¡Agregado al Carrito!'}</span>
                    </>
                  ) : isQuantityBlocked ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>En el Carrito ({cartQuantity}) • ${(activeOption.price * cartQuantity).toFixed(2)}</span>
                    </>
                  ) : isAlreadyInCart ? (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Actualizar Carrito • ${(activeOption.price * quantity).toFixed(2)}</span>
                    </>
                  ) : isOutOfStock || maxSelectable <= 0 ? (
                    <span>{isIncoming ? 'En camino' : 'Agotado'}</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Agregar al Carrito • ${(activeOption.price * quantity).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Aviso de existencias condicionado al stock mínimo (sin revelar el stock real si supera el mínimo de alerta) */}
              <div className="flex items-center justify-between text-[11px] px-1 font-medium gap-2">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${availableRemaining === 0 ? 'bg-slate-400' : isBelowMinAlert ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>
                    {availableRemaining === 0 
                      ? (cartQuantity > 0 ? 'Has reservado todo el inventario disponible' : (isIncoming ? 'Próximo ingreso a bodega (En camino)' : 'Temporalmente agotado')) 
                      : <>En existencia para entregas a domicilio a todo El Salvador o retiro en local</>}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {availableRemaining === 0 ? (
                    cartQuantity > 0 ? (
                      <span className="text-indigo-600 font-bold">En tu carrito</span>
                    ) : (
                      <span className="text-slate-400 font-bold">{isIncoming ? 'En camino' : 'Sin existencias'}</span>
                    )
                  ) : isBelowMinAlert ? (
                    <strong className="text-amber-700 font-black">
                      {isEssence
                        ? selectedPresentation === 'MEDIA_ONZA'
                          ? availableRemaining === 1 ? '¡Solo queda 1 media onza, hay más en camino!' : `¡Solo quedan ${availableRemaining} medias onzas, hay más en camino!`
                          : availableRemaining === 1 ? '¡Solo queda 1 onza, hay más en camino!' : `¡Solo quedan ${availableRemaining} onzas, hay más en camino!`
                        : isBottle
                        ? availableRemaining === 1 ? '¡Solo queda 1 unidad, hay más en camino!' : `¡Solo quedan ${availableRemaining} unidades, hay más en camino!`
                        : availableRemaining === 1 ? `¡Solo queda 1 ${product.unit || 'unidad'}, hay más en camino!` : `¡Solo quedan ${availableRemaining} ${product.unit || 'unidades'}, hay más en camino!`}
                    </strong>
                  ) : (
                    <span>
                      Estado: <strong className="text-emerald-700 font-bold">Disponible</strong>
                    </span>
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* ================= BOTÓN HORIZONTAL CLAY: PÍDELA YA ARMADA (SOLO ESENCIAS) ================= */}
          {isEssence && (
            <Link
              href={discreteStock && discreteStock.available1oz > 0 ? `/?categoria=Arma+tu+perfume&essenceId=${product.id}#seccion-arma-tu-perfume` : '#'}
              onClick={(e) => {
                if (!discreteStock || discreteStock.available1oz <= 0) {
                  e.preventDefault();
                }
              }}
              className={`w-full clay-card clay-card-interactive group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl transition-all duration-200 select-none ${
                discreteStock && discreteStock.available1oz > 0
                  ? 'bg-white border border-purple-100/80 hover:border-purple-200 cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-100 border border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  discreteStock && discreteStock.available1oz > 0
                    ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),inset_-1.5px_-1.5px_3px_rgba(164,177,198,0.2)]'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                      Pídela ya armada
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      discreteStock && discreteStock.available1oz > 0
                        ? 'text-purple-700 bg-purple-50 border-purple-200/80'
                        : 'text-slate-400 bg-slate-200 border-slate-300'
                    }`}>
                      Bote y alcohol incluidos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {discreteStock && discreteStock.available1oz > 0
                      ? 'Ármala en frasco de 100ml listo para usar'
                      : 'Sin stock suficiente de 1 onza para armar'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                  discreteStock && discreteStock.available1oz > 0
                    ? 'clay-btn clay-btn-primary !text-white group-hover:brightness-105'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}>
                  <span>Armar</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          )}

          {/* ================= ACORDES PRINCIPALES (DEBAJO DE LA TARJETA DE AGREGAR AL CARRITO) ================= */}
          {isEssence && profile && profile.accords && profile.accords.length > 0 && (
            <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Acordes principales</span>
                </h4>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Familia: {profile.family}
                </span>
              </div>

              {accordBars.length > 0 ? (
                <div className="flex flex-col gap-1 w-full pt-1">
                  {accordBars.map((bar, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${bar.percentage}%`,
                        backgroundColor: bar.bg,
                        color: bar.text,
                        minWidth: '100px'
                      }}
                      className="h-7 sm:h-8 rounded-r-xl rounded-l-md flex items-center justify-start px-3 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.35)] transition-all duration-300 hover:brightness-105"
                    >
                      <span className="text-[11px] font-black tracking-wide lowercase truncate drop-shadow-xs">
                        {bar.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {profile.accords.map((accord, idx) => (
                    <span 
                      key={idx}
                      className="bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors"
                    >
                      {accord}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN TÉCNICA, PIRÁMIDE O ESPECIFICACIONES SEGÚN CATEGORÍA */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5">

          {/* ================= PIRÁMIDE OLFATIVA Y NOTAS DE LA FRAGANCIA (SOLO PARA ESENCIAS) ================= */}
          {isEssence && profile && (
            <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs">
              {/* Pirámide del perfume (fotos de notas e ingredientes) */}
              <FragranceNotesVisual profile={profile} showAccords={false} />
            </div>
          )}

          {/* ================= ESPECIFICACIONES TÉCNICAS (PARA BOTES) ================= */}
          {isBottle && (
            <div className="space-y-4">
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
                    <strong className="text-xs sm:text-sm font-bold text-slate-800">De Rosca</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400">Tipo de Tapa</span>
                    <strong className="text-xs sm:text-sm font-bold text-slate-800">Cierre de Rosca Hermético</strong>
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

              {/* Tarjeta de Cierre de Rosca Fácil Sin Máquina */}
              <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-indigo-600" />
                  <span>Cierre de Rosca Fácil — No Requiere Máquina Selladora</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Todos nuestros botes son de rosca para que no se tenga que usar máquina selladora y que sea fácil para todos cerrarlo. Diseñados especialmente para perfumería con sellado hermético manual firme, seguro y libre de fugas ni evaporación.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80 text-[11px] font-bold text-emerald-950 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Fácil de cerrar a mano</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-[11px] font-bold text-indigo-950 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Sin máquinas ni selladoras</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ESPECIFICACIONES TÉCNICAS (PARA INSUMOS / ALCOHOL / MATERIALES) ================= */}
          {!isEssence && !isBottle && (
            <div className="space-y-4">
              {product.id.includes('alcohol') || product.name.toLowerCase().includes('alcohol') ? (
                <>
                  <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Especificaciones del Alcohol Perfumero</span>
                      </h3>
                      <span className="text-[10.5px] font-bold text-slate-400 font-mono">
                        {product.sku || 'INSUMO'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Pureza</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">Grado Perfumería</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Fijación</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">Fijador Integrado</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Presentación</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">{product.unit || 'Litro'}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Solubilidad</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">100% Homogénea</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Compatibilidad</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">Perfumería Fina</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Calidad</span>
                        <strong className="text-xs sm:text-sm font-bold text-indigo-700">Aromaniak Pro</strong>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta de Guía de Preparación y Recomendaciones */}
                  <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-indigo-600" />
                      <span>Guía de Mezcla y Preparación Recomendada</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Para preparar un perfume de alta concentración en frasco de 100ml, se recomienda utilizar de <strong>1 onza (30ml)</strong> a un máximo de <strong>1.5 onzas (45ml)</strong> de esencia pura concentrada, completando el volumen restante con este alcohol especial para perfumería con fijador.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-[11px] font-bold text-indigo-950 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>No distorsiona el aroma</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100/80 text-[11px] font-bold text-amber-950 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Estela y fijación duradera</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : isSticker && stickerEntry ? (
                <div className="space-y-4">
                  <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Contenido y Especificaciones del Sticker</span>
                      </h3>
                      <span className="text-[10.5px] font-bold text-slate-400 font-mono">
                        {product.sku || 'STICKER'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Inspirado en</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-900">{stickerEntry.nombre.toUpperCase()}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Casa Inspirada</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">{stickerEntry.marca} · {stickerEntry.anio}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500">Medida</span>
                        <strong className="text-xs sm:text-sm font-black text-indigo-900">5.3 × 5.0 cm</strong>
                        <span className="text-[10px] font-semibold text-indigo-700">53.0 × 50.0 mm</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-400">Notas de Salida</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">{stickerEntry.topNotes.join(', ')}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-400">Notas de Corazón</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">{stickerEntry.heartNotes.join(', ')}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-400">Notas de Fondo</span>
                        <strong className="text-xs sm:text-sm font-bold text-slate-800">{stickerEntry.baseNotes.join(', ')}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-0.5">
                        <span className="text-[10px] font-black uppercase text-indigo-500">Descripción Impresa</span>
                        <strong className="text-xs font-bold text-slate-800">{stickerEntry.fraseOlfativa}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between gap-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">Clasificación & Medida</span>
                        <strong className="text-xs font-bold text-indigo-700">{getStickerFooterClassification(stickerEntry.genero)}</strong>
                        <span className="text-[11px] font-semibold text-slate-500">5.3 × 5.0 cm • Esquinas redondeadas • Listo para pegar</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta con Ejemplos Reales de esta misma etiqueta en nuestros Botes de 100 ml */}
                  <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>Así se ve esta etiqueta en los botes que vendemos</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Proporción real de la etiqueta (5.3 × 5.0 cm) aplicada sobre nuestros frascos de 100 ml
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {STICKER_BOTTLE_MOCKUPS.slice(0, 6).map((b) => (
                        <div
                          key={`showcase-${b.id}`}
                          onClick={() => setSelectedStickerBottleId(b.id)}
                          className={`group/bottle rounded-2xl border p-2.5 bg-white transition-all cursor-pointer flex flex-col justify-between ${
                            selectedStickerBottleId === b.id
                              ? 'border-indigo-600 ring-2 ring-indigo-400/30 shadow-sm'
                              : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-white mb-2">
                            <StickerBottlePreview
                              stickerImageUrl={productImage}
                              bottleConfig={b}
                              alt={`${displayName} aplicada en ${b.name}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-[11px] sm:text-xs font-black text-slate-900 line-clamp-1 group-hover/bottle:text-indigo-700 transition-colors">
                              {b.name}
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              {b.subtitle}
                            </p>
                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                5.3 × 5.0 cm
                              </span>
                              <Link
                                href={`/producto/${b.productId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-black text-slate-700 hover:text-indigo-600 underline"
                              >
                                Ver bote →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Especificaciones de Empaque</span>
                    </h3>
                    <span className="text-[10.5px] font-bold text-slate-400 font-mono">
                      {product.sku || 'EMPAQUE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400">Material</span>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">Cartón Kraft</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400">Diseño</span>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">Liso sin marca</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400">Personalización</span>
                      <strong className="text-xs sm:text-sm font-bold text-indigo-700">Lista para tu logo</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </section>

      {/* ================= DETALLES DE LA FRAGANCIA O ENVASE Y ENVÍO ================= */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Descripción de la fragancia o envase */}
        <div className="md:col-span-7 clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEssence ? 'Detalles de la fragancia' : isBottle ? 'Detalles del envase' : 'Detalles del producto'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {isEssence
              ? getFragranceDescription(product, profile)
              : isBottle
              ? (product.description || 'Frasco de vidrio de 100ml de alta resistencia con cierre de rosca. Todos nuestros botes son de rosca para que no se tenga que usar máquina selladora y que sea fácil para todos cerrarlo, asegurando un sellado hermético que preserva intacta la fragancia.')
              : (product.description || product.name)}
          </p>
          {isEssence && profile ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Estación</span>
                <span className="text-xs font-bold text-slate-800">{profile.season}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Ocasión</span>
                <span className="text-xs font-bold text-slate-800">{profile.occasion}</span>
              </div>
            </div>
          ) : isBottle ? (
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
          ) : (product.id.includes('alcohol') || product.name.toLowerCase().includes('alcohol')) ? (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Presentación</span>
                <span className="text-xs font-bold text-slate-800">{product.unit || 'Litro'}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Fórmula</span>
                <span className="text-xs font-bold text-slate-800">Con Fijador</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Grado</span>
                <span className="text-xs font-bold text-indigo-700">Perfumería</span>
              </div>
            </div>
          ) : isSticker ? (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Medida</span>
                <span className="text-xs font-bold text-slate-800">5.3 × 5.0 cm</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Material</span>
                <span className="text-xs font-bold text-slate-800">Adhesivo Corte Fino</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Diseño</span>
                <span className="text-xs font-bold text-indigo-700">Con Notas y Casa</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Capacidad</span>
                <span className="text-xs font-bold text-slate-800">Frasco 100 ml</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Material</span>
                <span className="text-xs font-bold text-slate-800">Cartón Kraft</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Uso</span>
                <span className="text-xs font-bold text-indigo-700">Envíos / Tu Marca</span>
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
                  Entregas a domicilio a todo El Salvador de 24 a 48 horas o retiro en local
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Contamos con <strong className="text-indigo-700">entregas a domicilio a todo El Salvador</strong> (cobertura de 24 a 48 horas hábiles), o puedes optar por <strong>pasar retirando gratis en nuestro local en San Salvador</strong>.
            </p>

            <div className="text-[10.5px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
              <p>
                ⏰ <strong>Horarios de entrega:</strong> Pedidos en horario laboral se despachan de inmediato. Como la paquetera y nosotros no laboramos domingos, pedidos enviados el sábado llegan a partir de lunes; pedidos de domingo se despachan lunes y llegan desde martes.
              </p>
              <p className="text-slate-600 font-medium pt-0.5">
                💳 Formas de pago disponibles: <strong>Tarjeta de Crédito / Débito</strong> o <strong>Transferencia bancaria</strong> (Banco Agrícola y BAC Credomatic).
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
              <strong>Nosotros no maceramos ningún perfume.</strong> Nuestras esencias son concentrados puros de perfumería fina listos para que prepares tu fragancia con alcohol especial de perfumería.
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
              <strong>No usar directamente sobre la piel:</strong> Las esencias son 100% puras y concentradas. <strong>Tienen que ser mezcladas sí o sí con alcohol especial de perfumería</strong> antes de aplicarse. El máximo recomendado para 100ml es de una onza y una media onza, más de eso no es recomendado.
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
              {isBottle ? 'Otros modelos de frascos disponibles' : 'También te podría interesar'}
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
