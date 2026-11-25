'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, AlertTriangle, Tag, Sparkles } from 'lucide-react';
import { useEcommerceCart, getEssenceDiscreteStock, getBottleAvailableStock, applyCustomerProductPricing } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { getStoredProducts, ProductItem } from '@/lib/store';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import { trackMetaInitiateCheckout } from '@/components/analytics/MarketingScripts';
import { getProductImage } from '@/lib/perfumeImages';
import { getInspiracionPerfumeName, formatPerfumeDisplayName } from '@/lib/perfumeNames';
import { isHalloweenPromoProduct } from '@/lib/halloweenPromo';

export default function CartDrawer() {
  const { 
    cart, 
    addToCart,
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    subtotal,
    rawSubtotal,
    discountTotal,
    totalItems
  } = useEcommerceCart();
  const { customer } = useCustomerAuth();

  const [editingQtyMap, setEditingQtyMap] = React.useState<Record<string, string>>({});
  const [drawerStep, setDrawerStep] = React.useState<'cart' | 'upsell'>('cart');
  const [upsellSnapshotIds, setUpsellSnapshotIds] = React.useState<string[]>([]);
  const liveCatalog = useLiveProducts();

  // Resetear siempre al paso 1 ('cart') cuando se cierra o vacía el carrito
  useEffect(() => {
    if (!isCartOpen || cart.length === 0) {
      setDrawerStep('cart');
      setUpsellSnapshotIds([]);
    }
  }, [isCartOpen, cart.length]);

  // Motor inteligente de cross-sell tipo PedidosYa ("Otros clientes también compraron")
  // Detecta qué lleva el cliente (esencia, bote, alcohol, embudo, piseta, fijador, caja) y sugiere lo que le falta
  const missingSuppliesRecs = useMemo(() => {
    if (!isCartOpen || cart.length === 0 || typeof window === 'undefined') {
      return { subtitle: '', items: [] as Array<{ product: ProductItem; tag: string; price: number; originalPrice: number }> };
    }

    const catalog = liveCatalog && liveCatalog.length > 0 ? liveCatalog : (getStoredProducts() || []);
    if (catalog.length === 0) {
      return { subtitle: '', items: [] };
    }

    // Si ya estamos en la vista de upsell, usamos el snapshot de productos que tenía antes de entrar a upsell
    // para que al tocar "+ Agregar" el insumo no desaparezca bruscamente sino que muestre su contador - 1 +
    const useSnapshot = drawerStep === 'upsell' && upsellSnapshotIds.length > 0;
    const excludedIds = new Set<string>(useSnapshot ? upsellSnapshotIds : []);

    let hasLooseEssence = false;
    let hasBottle = false;
    let hasAlcohol = false;
    let hasEmbudo = false;
    let hasPiseta = false;
    let hasFijador = false;
    let hasCaja = false;

    for (const item of cart) {
      const pid = String(item.product?.id || '').toLowerCase();
      const pname = String(item.product?.name || '').toLowerCase();
      const poff = String(item.product?.officialName || '').toLowerCase();
      const pcat = String(item.product?.category || '');

      if (!useSnapshot) {
        if (item.product?.id) excludedIds.add(item.product.id);
        if (item.selectedBottle?.id) excludedIds.add(item.selectedBottle.id);
        if (item.kitDetails?.bottleId) excludedIds.add(item.kitDetails.bottleId);
      }

      if (useSnapshot && item.product?.id && !excludedIds.has(item.product.id)) {
        // Producto recién agregado dentro del paso de upsell: no alterar la prioridad original de la vista
        continue;
      }

      if (item.selectedBottle?.id) {
        hasBottle = true;
      }
      if (!item.kitDetails && pcat === 'Esencias para Perfume') {
        hasLooseEssence = true;
      }
      if (pcat === 'Botes' || pname.includes('bote ') || pname.includes('frasco')) {
        hasBottle = true;
      }
      if (pid.includes('alcohol') || pname.includes('alcohol') || poff.includes('alcohol')) {
        hasAlcohol = true;
      }
      if (pid.includes('embudo') || pname.includes('embudo') || poff.includes('embudo')) {
        hasEmbudo = true;
      }
      if (pid.includes('piseta') || pname.includes('piseta') || poff.includes('piseta')) {
        hasPiseta = true;
      }
      if (
        pid.includes('galaxolide') ||
        pid.includes('dipropilenglicol') ||
        pname.includes('galaxolide') ||
        pname.includes('dipropilenglicol') ||
        poff.includes('fijador')
      ) {
        hasFijador = true;
      }
      if (pid.includes('caja-carton') || pname.includes('caja de cartón') || poff.includes('caja minimalista')) {
        hasCaja = true;
      }
    }

    const isEligible = (p: ProductItem) => {
      if (!p || !p.id || excludedIds.has(p.id)) return false;
      if (p.isAvailableOnline === false) return false;
      const totalStock = Number(p.stock || 0);
      return totalStock > 0;
    };

    const availableSupplies = catalog.filter(
      (p) => p.category === 'Insumos y Materia Prima' && isEligible(p)
    );
    const availableBottles = catalog
      .filter((p) => p.category === 'Botes' && isEligible(p))
      .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));

    const findSupply = (matcher: (p: ProductItem) => boolean) =>
      availableSupplies.filter(matcher);

    const alcoholItems = findSupply((p) =>
      `${p.id} ${p.name} ${p.officialName || ''}`.toLowerCase().includes('alcohol')
    );
    const embudoItems = findSupply((p) =>
      `${p.id} ${p.name} ${p.officialName || ''}`.toLowerCase().includes('embudo')
    );
    const pisetaItems = findSupply((p) =>
      `${p.id} ${p.name} ${p.officialName || ''}`.toLowerCase().includes('piseta')
    );
    const fijadorItems = findSupply((p) => {
      const s = `${p.id} ${p.name} ${p.officialName || ''}`.toLowerCase();
      return s.includes('galaxolide') || s.includes('dipropilenglicol') || (s.includes('fijador') && !s.includes('alcohol'));
    });
    const cajaItems = findSupply((p) =>
      `${p.id} ${p.name} ${p.officialName || ''}`.toLowerCase().includes('caja')
    );

    const ordered: Array<{ product: ProductItem; tag: string }> = [];
    const seen = new Set<string>();
    const pushUnique = (list: ProductItem[], tag: string, maxCount = 3) => {
      let count = 0;
      for (const prod of list) {
        if (seen.has(prod.id)) continue;
        seen.add(prod.id);
        ordered.push({ product: prod, tag });
        count++;
        if (count >= maxCount) break;
      }
    };

    // Si lleva esencia suelta pero NO lleva frasco todavía: priorizar Frascos 100ml + Alcohol + Embudo + Piseta + Fijador
    if (hasLooseEssence && !hasBottle) {
      pushUnique(availableBottles, 'Frasco 100ml', 3);
      if (!hasAlcohol) pushUnique(alcoholItems, 'Para tu mezcla', 2);
      if (!hasEmbudo) pushUnique(embudoItems, 'Indispensable', 1);
      if (!hasFijador) pushUnique(fijadorItems, 'Mayor fijación', 2);
      if (!hasPiseta) pushUnique(pisetaItems, 'Para dosificar', 1);
      if (!hasCaja) pushUnique(cajaItems, 'Empaque', 1);
    }
    // Si lleva esencia y frasco (o lleva frasco suelto): priorizar Alcohol + Embudo + Piseta + Fijador + Caja
    else if ((hasLooseEssence && hasBottle) || hasBottle) {
      if (!hasAlcohol) pushUnique(alcoholItems, 'Falta tu alcohol', 2);
      if (!hasEmbudo) pushUnique(embudoItems, 'Para envasar', 1);
      if (!hasPiseta) pushUnique(pisetaItems, 'Para dosificar', 1);
      if (!hasFijador) pushUnique(fijadorItems, 'Mayor fijación', 2);
      if (!hasCaja) pushUnique(cajaItems, 'Empaque', 1);
      pushUnique(availableBottles, 'Otro frasco 100ml', 2);
    }
    // Cualquier otro caso (lleva kit o insumos): sugerir los insumos/frascos que aún no tenga en el carrito
    else {
      if (!hasAlcohol) pushUnique(alcoholItems, 'Para tu mezcla', 2);
      if (!hasEmbudo) pushUnique(embudoItems, 'Para envasar', 1);
      if (!hasFijador) pushUnique(fijadorItems, 'Mayor fijación', 2);
      if (!hasPiseta) pushUnique(pisetaItems, 'Para dosificar', 1);
      pushUnique(availableBottles, 'Frasco 100ml', 3);
      if (!hasCaja) pushUnique(cajaItems, 'Empaque', 1);
    }

    // Completar con cualquier otro insumo disponible que no esté en el carrito
    pushUnique(availableSupplies, 'Complemento', 6);

    let subtitle = 'Completa tu pedido con los insumos que aún no llevas';
    if (hasLooseEssence && !hasBottle && !hasAlcohol) {
      subtitle = 'Llevas esencia: ¿necesitas frasco, alcohol, embudo o fijador?';
    } else if (hasLooseEssence && hasBottle && !hasAlcohol) {
      subtitle = 'Llevas esencia y bote: ¿agregamos alcohol, embudo o piseta?';
    } else if (hasLooseEssence && hasAlcohol && !hasBottle) {
      subtitle = 'Llevas esencia y alcohol: ¿necesitas frascos de 100ml o embudo?';
    } else if (hasLooseEssence && hasBottle && hasAlcohol) {
      subtitle = '¿Te falta embudo, piseta dosificadora o fijador extra?';
    }

    const pricedItems = ordered.slice(0, 10).map(({ product, tag }) => {
      const pricing = applyCustomerProductPricing(Number(product.price || 0), product, 'UNIDAD', customer);
      return {
        product,
        tag,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
      };
    });

    return { subtitle, items: pricedItems };
  }, [isCartOpen, cart, customer, drawerStep, upsellSnapshotIds, liveCatalog]);

  // Bloquear el scroll de fondo mientras el carrito esté abierto
  useEffect(() => {
    if (!isCartOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cerrar al presionar la tecla Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop oscuro con clic para cerrar */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
        title="Clic fuera para cerrar y seguir comprando"
      />

      {/* Contenedor del Drawer pegado a la derecha sin desbordes */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full flex">
        <div className="w-full h-full bg-[#f1f4f9] shadow-2xl flex flex-col border-l border-white/80 relative z-10 overscroll-contain">
          
          {/* Header compacto del Carrito / Vista de Insumos */}
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-slate-200/80 flex items-center justify-between bg-white/75 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {drawerStep === 'upsell' ? (
                <button
                  type="button"
                  onClick={() => setDrawerStep('cart')}
                  className="w-7 h-7 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="Volver a mi carrito"
                  aria-label="Volver a mi carrito"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                  {drawerStep === 'upsell' ? 'Otros clientes también compraron' : 'Tu Carrito de Fragancias'}
                </h3>
                <p className="text-[10.5px] text-slate-500 font-semibold truncate">
                  {drawerStep === 'upsell'
                    ? missingSuppliesRecs.subtitle
                    : `${totalItems} artículo${totalItems === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            {/* Botón de Cerrar claro y visible con texto e icono */}
            <button
              onClick={() => setIsCartOpen(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 hover:text-slate-900 text-[11px] font-black transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              aria-label="Cerrar carrito"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Cerrar</span>
            </button>
          </div>

          {/* Lista de Productos Scrollable */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5 overscroll-contain">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center shadow-inner">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Tu carrito está vacío</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Explora nuestro catálogo de esencias de perfumería fina y agrega tus fragancias favoritas.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="clay-btn clay-btn-primary px-5 py-2 text-xs rounded-xl mt-2 font-bold cursor-pointer"
                >
                  Explorar Fragancias
                </button>
              </div>
            ) : drawerStep === 'upsell' ? (
              /* ================= PASO 2: VISTA DEDICADA DE INSUMOS Y FRASCOS SUGERIDOS ================= */
              <div className="space-y-1.5">
                <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xs flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-black leading-tight">
                      ¿Te falta algún insumo para tu preparación?
                    </p>
                    <p className="text-[10px] text-indigo-100 font-medium leading-tight mt-0.5 truncate">
                      {missingSuppliesRecs.subtitle}
                    </p>
                  </div>
                </div>

                {missingSuppliesRecs.items.map(({ product, tag, price, originalPrice }) => {
                  const recImg = getProductImage(product);
                  const recTitle = formatPerfumeDisplayName(product);
                  const cartItem = cart.find((it) => it.product?.id === product.id && !it.kitDetails);
                  const inCartQty = cartItem ? cartItem.quantity : 0;
                  const availToAdd = getBottleAvailableStock(
                    Number(product.stock || 0),
                    cart,
                    product.id,
                    cartItem?.id
                  );
                  const canAddMore = inCartQty + 1 <= availToAdd;

                  return (
                    <div
                      key={product.id}
                      className={`clay-card px-2.5 py-2 flex items-center justify-between gap-2.5 rounded-xl border transition-all shadow-2xs ${
                        inCartQty > 0
                          ? 'bg-emerald-50/60 border-emerald-300/90'
                          : 'bg-white border-slate-100 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 shrink-0 flex items-center justify-center shadow-2xs">
                          <img
                            src={recImg}
                            alt={recTitle}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/essence_bottle_blank.webp';
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                              {tag}
                            </span>
                            <span className="text-[9.5px] font-semibold text-slate-400">
                              • {product.unit || 'Unidad'}
                            </span>
                          </div>
                          <h4 className="font-black text-xs text-slate-900 leading-tight truncate" title={recTitle}>
                            {recTitle}
                          </h4>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            {originalPrice > price && (
                              <span className="text-[9.5px] font-bold text-slate-400 line-through decoration-rose-500">
                                ${originalPrice.toFixed(2)}
                              </span>
                            )}
                            <span className="text-xs font-black text-indigo-700">
                              ${price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {inCartQty > 0 && cartItem ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full hidden sm:inline">
                              ✓
                            </span>
                            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-emerald-300 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(cartItem.id, inCartQty - 1)}
                                className="w-5 h-5 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                                aria-label="Disminuir"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-[11px] font-black text-slate-900 font-mono">
                                {inCartQty}
                              </span>
                              <button
                                type="button"
                                disabled={!canAddMore}
                                onClick={() => updateQuantity(cartItem.id, inCartQty + 1)}
                                className={`w-5 h-5 rounded flex items-center justify-center font-bold ${
                                  canAddMore
                                    ? 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                                    : 'text-slate-300 cursor-not-allowed opacity-40'
                                }`}
                                aria-label="Aumentar"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(product, 'UNIDAD', 1)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Agregar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              cart.map((item) => {
                const productImage = getProductImage(item.product);
                const displayName = formatPerfumeDisplayName(item.product);

                return (
                  <div 
                    key={item.id}
                    className="clay-card px-2.5 py-2 flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl relative group shadow-2xs"
                  >
                    {/* Miniatura compacta */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 shrink-0 flex items-center justify-center shadow-2xs">
                      {item.kitDetails ? (
                        <div className="relative w-full h-full flex items-center justify-center p-0.5 bg-gradient-to-br from-amber-50/60 to-purple-50/60">
                          <img
                            src={'/images/essence_bottle_blank.webp'}
                            alt={displayName}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/essence_bottle_blank.webp';
                            }}
                            className="absolute left-0.5 top-0.5 w-6 h-6 rounded object-cover border border-amber-300 z-10"
                          />
                          <img
                            src={item.kitDetails.bottleImageUrl || '/images/botes/bote_100ml_degrade_azul_noche.jpg'}
                            alt={item.kitDetails.bottleName}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/botes/bote_100ml_degrade_azul_noche.jpg';
                            }}
                            className="absolute right-0.5 bottom-0.5 w-6 h-6 rounded object-cover border border-slate-300 z-20"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-indigo-950/90 text-[6.5px] font-black text-amber-300 text-center leading-tight z-30">
                            Kit 100ml
                          </span>
                        </div>
                      ) : (
                        <img
                          src={productImage}
                          alt={displayName}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = '/images/essence_bottle_blank.webp';
                          }}
                          className="w-full h-full object-cover object-center"
                        />
                      )}
                    </div>

                    {/* Contenido principal en bloque compacto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-xs text-slate-900 leading-tight truncate" title={displayName}>
                            {displayName}
                          </h4>
                          <div className="text-[10.5px] truncate leading-tight mt-0.5" title={item.product.category === 'Esencias para Perfume' ? `Inspirado en ${getInspiracionPerfumeName(item.product)}` : ''}>
                            {item.product.category === 'Esencias para Perfume' ? (
                              <>
                                <span className="text-slate-500 font-medium">Inspirado en </span>
                                <span className="text-slate-900 font-black">{getInspiracionPerfumeName(item.product)}</span>
                              </>
                            ) : (
                              <span className="text-slate-500 font-medium">{item.product.unit || 'Unidad'}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-300 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                          title="Quitar del carrito"
                          aria-label="Quitar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Presentación / Kit + Controles y Precio en la misma fila compacta */}
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <div className="min-w-0 flex-1">
                          {item.kitDetails ? (
                            <div className="text-[9.5px] leading-tight text-slate-600 truncate">
                              <span className="font-bold text-indigo-700">
                                {item.kitDetails.isPlus ? 'Kit PLUS (1.5 oz)' : 'Kit 100ml (1 oz)'}
                              </span>
                              <span className="text-slate-400"> • {item.kitDetails.bottleName}</span>
                            </div>
                          ) : item.selectedBottle ? (
                            <div className="text-[10px] leading-tight truncate">
                              <span className="font-bold text-indigo-600">{item.presentationName}</span>
                              <span className="text-slate-400"> • {item.selectedBottle.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10.5px] font-bold text-indigo-600 leading-tight block truncate">
                              {item.presentationName}
                            </span>
                          )}
                        </div>

                        {/* Control de cantidad + Precio en línea */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200/80">
                            {(() => {
                              const prod = item.product;
                              const storedCatalog = liveCatalog && liveCatalog.length > 0 ? liveCatalog : (typeof window !== 'undefined' ? getStoredProducts() : []);
                              const liveProd = storedCatalog.find((p) => p.id === (item.kitDetails?.essenceId || prod.id)) || prod;
                              const totalStock = typeof liveProd.stock === 'number' ? liveProd.stock : 0;
                              const isEssence = liveProd.category === 'Esencias para Perfume' || prod.category === 'Esencias para Perfume';
                              let maxAvailableInDrawer = 9999;

                              if (item.kitDetails) {
                                const discrete = getEssenceDiscreteStock(totalStock, cart, item.kitDetails.essenceId, item.id, liveProd.stockHalf || 0);
                                maxAvailableInDrawer = discrete.available1oz;
                                if (item.kitDetails.isPlus) {
                                  maxAvailableInDrawer = Math.min(maxAvailableInDrawer, discrete.availableHalfOz);
                                }
                                if (item.kitDetails.bottleId) {
                                  const liveBottle = storedCatalog.find((p) => p.id === item.kitDetails?.bottleId);
                                  if (liveBottle) {
                                    const availBottle = getBottleAvailableStock(
                                      typeof liveBottle.stock === 'number' ? liveBottle.stock : 0,
                                      cart,
                                      item.kitDetails.bottleId,
                                      item.id
                                    );
                                    maxAvailableInDrawer = Math.min(maxAvailableInDrawer, availBottle);
                                  }
                                }
                              } else if (isEssence) {
                                const discrete = getEssenceDiscreteStock(totalStock, cart, prod.id, item.id, liveProd.stockHalf || 0);
                                if (item.presentation === 'ONZA_COMPLETA') {
                                  maxAvailableInDrawer = discrete.available1oz;
                                } else if (item.presentation === 'MEDIA_ONZA') {
                                  maxAvailableInDrawer = discrete.availableHalfOz;
                                }
                              } else {
                                maxAvailableInDrawer = getBottleAvailableStock(totalStock, cart, prod.id, item.id);
                              }

                              const maxAllowedQty = Math.max(1, maxAvailableInDrawer);
                              const canAddMoreInDrawer = item.quantity + 1 <= maxAvailableInDrawer;
                              const displayValue =
                                editingQtyMap[item.id] !== undefined ? editingQtyMap[item.id] : String(item.quantity);

                              return (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingQtyMap((prev) => {
                                        if (prev[item.id] === undefined) return prev;
                                        const next = { ...prev };
                                        delete next[item.id];
                                        return next;
                                      });
                                      updateQuantity(item.id, item.quantity - 1);
                                    }}
                                    className="w-4.5 h-4.5 rounded flex items-center justify-center text-slate-600 hover:bg-white font-bold cursor-pointer transition-colors"
                                    aria-label="Disminuir una unidad"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={displayValue}
                                    onFocus={(e) => {
                                      setEditingQtyMap((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
                                      e.target.select();
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, '');
                                      if (raw === '') {
                                        setEditingQtyMap((prev) => ({ ...prev, [item.id]: '' }));
                                        return;
                                      }
                                      const parsed = parseInt(raw, 10);
                                      if (isNaN(parsed)) return;
                                      if (parsed === 0) {
                                        setEditingQtyMap((prev) => ({ ...prev, [item.id]: '0' }));
                                        return;
                                      }
                                      const clamped = Math.min(parsed, maxAllowedQty);
                                      setEditingQtyMap((prev) => ({ ...prev, [item.id]: String(clamped) }));
                                      if (clamped !== item.quantity) {
                                        updateQuantity(item.id, clamped);
                                      }
                                    }}
                                    onBlur={() => {
                                      const draftVal = editingQtyMap[item.id];
                                      setEditingQtyMap((prev) => {
                                        const next = { ...prev };
                                        delete next[item.id];
                                        return next;
                                      });
                                      if (draftVal === '0') {
                                        removeFromCart(item.id);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    title={`Editar cantidad (máx. ${maxAllowedQty} disponibles)`}
                                    aria-label="Cantidad"
                                    className="w-7 h-4.5 text-[11px] font-black text-center text-slate-800 bg-white rounded border border-slate-200/90 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none px-0.5 font-mono"
                                  />
                                  <button
                                    onClick={() => {
                                      setEditingQtyMap((prev) => {
                                        if (prev[item.id] === undefined) return prev;
                                        const next = { ...prev };
                                        delete next[item.id];
                                        return next;
                                      });
                                      updateQuantity(item.id, item.quantity + 1);
                                    }}
                                    disabled={!canAddMoreInDrawer}
                                    className={`w-4.5 h-4.5 rounded flex items-center justify-center font-bold transition-colors ${
                                      canAddMoreInDrawer 
                                        ? 'text-slate-600 hover:bg-white cursor-pointer' 
                                        : 'text-slate-300 cursor-not-allowed opacity-40'
                                    }`}
                                    title={canAddMoreInDrawer ? "Aumentar una unidad" : "Inventario máximo alcanzado"}
                                    aria-label="Aumentar una unidad"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              );
                            })()}
                          </div>

                          {/* Precio alineado */}
                          <div className="text-right min-w-[54px]">
                            <div className="flex items-baseline justify-end gap-1">
                              {item.originalUnitPrice && item.originalUnitPrice > item.unitPrice && (
                                <span className="text-[9.5px] font-bold text-slate-400 line-through decoration-rose-500">
                                  ${(item.originalUnitPrice * item.quantity).toFixed(2)}
                                </span>
                              )}
                              <span className="text-xs font-black text-slate-900">
                                ${item.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Aviso Importante de preparación de esencias con alcohol */}
            {cart.length > 0 && drawerStep === 'cart' && (
              <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-0.5 mt-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[10.5px]">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Aviso importante: Mezcla con alcohol</span>
                </div>
                <p className="text-[10px] text-amber-900/90 font-medium leading-snug">
                  Todas las esencias deben mezclarse con alcohol para perfumería antes de su aplicación (máx. recomendado para 100ml: 1.5 onzas).
                </p>
              </div>
            )}
          </div>

          {/* Footer compacto del Carrito */}
          {cart.length > 0 && (
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-t border-slate-200/80 bg-white/95 backdrop-blur-sm space-y-1.5 shrink-0">
              <div className="space-y-0.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span className={discountTotal > 0 ? "font-bold text-slate-500 line-through" : "font-black text-slate-900"}>
                    ${rawSubtotal.toFixed(2)}
                  </span>
                </div>
                {discountTotal > 0 && (() => {
                  let halloweenDiscount = 0;
                  let vipDiscount = 0;
                  for (const it of cart) {
                    const orig = it.originalUnitPrice ?? it.unitPrice;
                    const itemDisc = Number((Math.max(0, orig - it.unitPrice) * it.quantity).toFixed(2));
                    if (!it.kitDetails && isHalloweenPromoProduct(it.product)) {
                      halloweenDiscount = Number((halloweenDiscount + itemDisc).toFixed(2));
                    } else {
                      vipDiscount = Number((vipDiscount + itemDisc).toFixed(2));
                    }
                  }
                  return (
                    <>
                      {halloweenDiscount > 0 && (
                        <div className="flex items-center justify-between text-purple-700 font-bold">
                          <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> Ahorro Promo Especial:</span>
                          <span>-${halloweenDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {vipDiscount > 0 && (
                        <div className="flex items-center justify-between text-indigo-700 font-bold">
                          <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> Ahorro Nivel VIP:</span>
                          <span>-${vipDiscount.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                  <span>Envío a todo el país:</span>
                  <span className="text-emerald-700 font-bold">Calculado al pagar o Retiro Gratis</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200/70">
                  <span>Total estimado:</span>
                  <span className="font-black text-indigo-700 text-sm sm:text-base">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón Principal: En Paso 1 dice "Continuar" (abre la vista de insumos faltantes); en Paso 2 dice "Proceder a pago seguro" */}
              {drawerStep === 'cart' && missingSuppliesRecs.items.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentIds: string[] = [];
                    for (const it of cart) {
                      if (it.product?.id) currentIds.push(it.product.id);
                      if (it.selectedBottle?.id) currentIds.push(it.selectedBottle.id);
                      if (it.kitDetails?.bottleId) currentIds.push(it.kitDetails.bottleId);
                    }
                    setUpsellSnapshotIds(currentIds);
                    setDrawerStep('upsell');
                  }}
                  className="clay-btn clay-btn-primary w-full py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 !shadow-[0_4px_14px_rgba(99,102,241,0.38)] tracking-wide cursor-pointer active:scale-95"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href="/checkout"
                  onClick={() => {
                    if (typeof document !== 'undefined') {
                      document.body.style.overflow = '';
                    }
                    setIsCartOpen(false);
                  }}
                  className="clay-btn clay-btn-primary w-full py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 !shadow-[0_4px_14px_rgba(99,102,241,0.38)] tracking-wide cursor-pointer active:scale-95"
                >
                  <span>Proceder a pago seguro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Botón Secundario: En Paso 2 vuelve al carrito; en Paso 1 cierra para seguir comprando */}
              {drawerStep === 'upsell' ? (
                <button
                  type="button"
                  onClick={() => setDrawerStep('cart')}
                  className="w-full py-1.5 rounded-xl text-[11px] font-black text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <ArrowLeft className="w-3 h-3 text-indigo-600" />
                  <span>Volver a mi carrito</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-1.5 rounded-xl text-[11px] font-black text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <ArrowLeft className="w-3 h-3 text-indigo-600" />
                  <span>Seguir Comprando (Agregar más)</span>
                </button>
              )}

              <div className="flex items-center justify-center gap-1 text-[9.5px] font-semibold text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Entregas a domicilio a todo El Salvador o retiro en local</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
