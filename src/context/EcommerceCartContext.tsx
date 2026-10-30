'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useCustomerAuth } from "@/context/CustomerAuthContext";

import { ProductItem, getStoredProducts, saveStoredProducts } from '@/lib/store';
import { trackMetaAddToCart } from '@/components/analytics/MarketingScripts';
import {
  isHalloweenPromoProduct,
  HALLOWEEN_PROMO_PRICE_1OZ,
  HALLOWEEN_ORIGINAL_PRICE_1OZ,
  HALLOWEEN_PROMO_PRICE_HALF_OZ,
  HALLOWEEN_ORIGINAL_PRICE_HALF_OZ,
} from '@/lib/halloweenPromo';

export type ProductPresentation = 
  | 'ONZA_COMPLETA'      // 1 Onza Completa (Precio por onza del sistema)
  | 'MEDIA_ONZA'         // Media Onza (Precio por onza / 2)
  | 'KIT_PREPARADO'      // Kit Perfume Preparado Completo ($15.00)
  | 'KIT_PREPARADO_PLUS' // Kit Perfume Preparado PLUS ($18.00)
  | '1_OZ'               // Compatibilidad previa
  | '2_OZ'
  | 'PERFUME_30ML'
  | 'PERFUME_50ML'
  | 'PERFUME_100ML'
  | 'UNIDAD';            // Para botes, empaque, alcohol

export interface PresentationOption {
  id: ProductPresentation;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
}

export function applyCustomerProductPricing(
  baseListPrice: number,
  product: ProductItem,
  presentation: ProductPresentation,
  customer?: any
): { price: number; originalPrice: number } {
  const originalPrice = Number(Number(baseListPrice || 0).toFixed(2));
  const isHalloweenPromo = isHalloweenPromoProduct(product);

  // Para los 10 perfumes de la promoción de Halloween (vigente hasta el 31 de oct 11:59 PM):
  // 1 Onza fija en $3.30 (Antes $3.75) y ½ Onza fija en $1.85 (Antes $1.90).
  // No se suma ni acumula con descuento VIP ni precios especiales de cliente.
  if (isHalloweenPromo && presentation !== 'KIT_PREPARADO' && presentation !== 'KIT_PREPARADO_PLUS') {
    if (presentation === 'MEDIA_ONZA') {
      return { price: HALLOWEEN_PROMO_PRICE_HALF_OZ, originalPrice: HALLOWEEN_ORIGINAL_PRICE_HALF_OZ };
    }
    return { price: HALLOWEEN_PROMO_PRICE_1OZ, originalPrice: HALLOWEEN_ORIGINAL_PRICE_1OZ };
  }

  if (!customer) {
    return { price: originalPrice, originalPrice };
  }

  const catStr = String(product.category || '');
  const prodNameLower = (product.name || '').toLowerCase();
  const isEssence =
    catStr === 'Esencias para Perfume' ||
    catStr === 'Esencias & Fragancias' ||
    catStr === 'Arma tu propio perfume' ||
    product.unit === 'Onza';
  const isBottle =
    !isEssence &&
    (catStr === 'Botes' ||
      catStr === 'Botes & Envases' ||
      catStr === 'Envases & Botes' ||
      prodNameLower.includes('bote') ||
      prodNameLower.includes('frasco'));

  let effectivePrice = originalPrice;

  if (isEssence && presentation !== 'KIT_PREPARADO' && presentation !== 'KIT_PREPARADO_PLUS') {
    if (presentation === 'MEDIA_ONZA') {
      if (customer.specialHalfEssencePrice != null && Number(customer.specialHalfEssencePrice) > 0) {
        effectivePrice = Number(Number(customer.specialHalfEssencePrice).toFixed(2));
      }
    } else if (customer.specialEssencePrice != null && Number(customer.specialEssencePrice) > 0) {
      effectivePrice = Number(Number(customer.specialEssencePrice).toFixed(2));
    }
  } else if (isBottle && customer.specialBottlePrice != null && Number(customer.specialBottlePrice) > 0) {
    effectivePrice = Number(Number(customer.specialBottlePrice).toFixed(2));
  }

  const activeCategoryTier = isEssence
    ? customer.tier
    : isBottle
    ? customer.bottleTier
    : customer.suppliesTier;
  const activeCategoryCustomPct = isEssence
    ? customer.customDiscountPct
    : isBottle
    ? customer.bottleCustomDiscountPct
    : customer.suppliesCustomDiscountPct;

  if (activeCategoryTier) {
    let appliedPct = 0;
    if (activeCategoryTier.name === 'Personalizado' && activeCategoryCustomPct) {
      appliedPct = Number(activeCategoryCustomPct);
    } else if (activeCategoryTier.discountPct) {
      appliedPct = Number(activeCategoryTier.discountPct);
    }
    if (appliedPct > 0) {
      const discountAmt = effectivePrice * (appliedPct / 100);
      effectivePrice = Number((effectivePrice - discountAmt).toFixed(2));
    }
  } else if (activeCategoryCustomPct && Number(activeCategoryCustomPct) > 0) {
    const appliedPct = Number(activeCategoryCustomPct);
    const discountAmt = effectivePrice * (appliedPct / 100);
    effectivePrice = Number((effectivePrice - discountAmt).toFixed(2));
  }

  return { price: effectivePrice, originalPrice };
}

export function getPresentationsForProduct(product: ProductItem, customer?: any): PresentationOption[] {
  const isEssence =
    product.category === 'Esencias para Perfume' ||
    product.category === 'Esencias & Fragancias' ||
    product.unit === 'Onza';
  if (isEssence) {
    const onzaBase = Number((product.price || 3.75).toFixed(2));
    const mediaOnzaBase = product.priceHalfOunce != null && Number(product.priceHalfOunce) > 0
      ? Number(Number(product.priceHalfOunce).toFixed(2)) 
      : 1.90;
    const fullPricing = applyCustomerProductPricing(onzaBase, product, 'ONZA_COMPLETA', customer);
    const halfPricing = applyCustomerProductPricing(mediaOnzaBase, product, 'MEDIA_ONZA', customer);
    return [
      {
        id: 'ONZA_COMPLETA',
        name: '1 Onza',
        description: '1 onza de esencia pura concentrada',
        price: fullPricing.price,
        originalPrice: fullPricing.originalPrice,
      },
      {
        id: 'MEDIA_ONZA',
        name: '½ Onza',
        description: '½ onza de esencia pura concentrada',
        price: halfPricing.price,
        originalPrice: halfPricing.originalPrice,
      }
    ];
  }

  const unitPricing = applyCustomerProductPricing(product.price, product, 'UNIDAD', customer);
  return [
    {
      id: 'UNIDAD',
      name: `${product.unit || 'Unidad'}`,
      description: 'Precio por unidad individual',
      price: unitPricing.price,
      originalPrice: unitPricing.originalPrice,
    }
  ];
}

/**
 * Modelo de inventario para producto no fraccionable:
 * Aproximadamente el 20% del stock en kilos se envasa en botes de ½ onza,
 * y el 80% restante en botes de 1 onza completa.
 * Ninguna esencia se fracciona a granel al momento; se venden en botes ya preparados.
 */
export interface EssenceDiscreteStock {
  total1oz: number;
  totalHalfOz: number;
  used1oz: number;
  usedHalfOz: number;
  available1oz: number;
  availableHalfOz: number;
}

export function getEssenceDiscreteStock(
  totalStock: number,
  cart: EcommerceCartItem[],
  productId: string,
  excludeItemId?: string,
  realStockHalf: number = 0
): EssenceDiscreteStock {
  const stock = typeof totalStock === 'number' && !isNaN(totalStock) ? Math.max(0, totalStock) : 0;
  
  // Inventario real envasado: stock = frascos de 1 oz, stockHalf = frascos de ½ oz
  const total1oz = Math.floor(stock);
  // 20% del stock equivale a botes de ½ oz (cada ½ oz = 0.5 oz, por tanto stock * 0.20 / 0.5 = stock * 0.40 botes)
  const totalHalfOz = Math.max(0, Math.floor(typeof realStockHalf === 'number' && !isNaN(realStockHalf) ? realStockHalf : 0));

  let used1oz = 0;
  let usedHalfOz = 0;

  for (const item of cart) {
    if (excludeItemId && item.id === excludeItemId) continue;

    // Si es un kit de perfume preparado (Kit 100ml)
    if (item.kitDetails && item.kitDetails.essenceId === productId) {
      used1oz += item.quantity; // Requiere 1 bote de 1 oz
      if (item.kitDetails.isPlus) {
        usedHalfOz += item.quantity; // PLUS requiere 1 bote adicional de ½ oz
      }
    }
    // Si es la esencia directamente
    else if (item.product.id === productId && !item.kitDetails) {
      if (item.presentation === 'ONZA_COMPLETA') {
        used1oz += item.quantity;
      } else if (item.presentation === 'MEDIA_ONZA') {
        usedHalfOz += item.quantity;
      }
    }
  }

  return {
    total1oz,
    totalHalfOz,
    used1oz,
    usedHalfOz,
    available1oz: Math.max(0, total1oz - used1oz),
    availableHalfOz: Math.max(0, totalHalfOz - usedHalfOz),
  };
}

/**
 * Calcula las unidades disponibles de un frasco/bote (o insumo general) descontando
 * tanto las unidades agregadas directamente al carrito como las usadas en kits de "Arma tu propio perfume".
 */
export function getBottleAvailableStock(
  totalStock: number,
  cart: EcommerceCartItem[],
  bottleId: string,
  excludeItemId?: string
): number {
  const stock = typeof totalStock === 'number' && !isNaN(totalStock) ? Math.max(0, Math.floor(totalStock)) : 0;
  let used = 0;

  for (const item of cart) {
    if (excludeItemId && item.id === excludeItemId) continue;

    if (item.kitDetails && item.kitDetails.bottleId === bottleId) {
      used += item.quantity;
    } else if (item.selectedBottle && item.selectedBottle.id === bottleId && !item.kitDetails) {
      used += item.quantity;
    } else if (item.product?.id === bottleId && !item.kitDetails) {
      used += item.quantity;
    }
  }

  return Math.max(0, stock - used);
}

function reconcileCartWithCatalog(
  prevCart: EcommerceCartItem[],
  catalog: ProductItem[]
): EcommerceCartItem[] {
  if (!Array.isArray(catalog) || catalog.length === 0 || prevCart.length === 0) {
    return prevCart;
  }

  const productMap = new Map<string, ProductItem>();
  for (const p of catalog) {
    if (p && p.id) {
      productMap.set(p.id, p);
    }
  }
  if (productMap.size === 0) return prevCart;

  const used1ozMap = new Map<string, number>();
  const usedHalfOzMap = new Map<string, number>();
  const usedUnitMap = new Map<string, number>();

  let changed = false;
  const nextCart: EcommerceCartItem[] = [];

  for (const item of prevCart) {
    if (item.kitDetails) {
      const essenceId = item.kitDetails.essenceId;
      const bottleId = item.kitDetails.bottleId;
      const liveEssence = productMap.get(essenceId);
      const liveBottle = productMap.get(bottleId);

      if (liveEssence && liveEssence.isAvailableOnline === false) {
        changed = true;
        continue;
      }
      if (liveBottle && liveBottle.isAvailableOnline === false) {
        changed = true;
        continue;
      }

      const total1oz = liveEssence
        ? Math.max(0, Math.floor(typeof liveEssence.stock === 'number' ? liveEssence.stock : 0))
        : Math.max(0, Math.floor(typeof item.product.stock === 'number' ? item.product.stock : 0));
      const totalHalfOz = liveEssence
        ? Math.max(0, Math.floor(typeof liveEssence.stockHalf === 'number' ? liveEssence.stockHalf : 0))
        : Math.max(0, Math.floor(typeof item.product.stockHalf === 'number' ? item.product.stockHalf : 0));
      const totalBottle = liveBottle
        ? Math.max(0, Math.floor(typeof liveBottle.stock === 'number' ? liveBottle.stock : 0))
        : Infinity;

      const avail1oz = Math.max(0, total1oz - (used1ozMap.get(essenceId) || 0));
      const availHalfOz = item.kitDetails.isPlus
        ? Math.max(0, totalHalfOz - (usedHalfOzMap.get(essenceId) || 0))
        : Infinity;
      const availBottle = totalBottle === Infinity
        ? Infinity
        : Math.max(0, totalBottle - (usedUnitMap.get(bottleId) || 0));

      const allowedQty = Math.min(item.quantity, avail1oz, availHalfOz, availBottle);
      if (allowedQty <= 0) {
        changed = true;
        continue;
      }

      used1ozMap.set(essenceId, (used1ozMap.get(essenceId) || 0) + allowedQty);
      if (item.kitDetails.isPlus) {
        usedHalfOzMap.set(essenceId, (usedHalfOzMap.get(essenceId) || 0) + allowedQty);
      }
      if (bottleId) {
        usedUnitMap.set(bottleId, (usedUnitMap.get(bottleId) || 0) + allowedQty);
      }

      const nextStock = liveEssence ? liveEssence.stock : item.product.stock;
      const nextStockHalf = liveEssence ? (liveEssence.stockHalf ?? 0) : item.product.stockHalf;

      if (
        allowedQty !== item.quantity ||
        nextStock !== item.product.stock ||
        nextStockHalf !== item.product.stockHalf
      ) {
        changed = true;
        nextCart.push({
          ...item,
          quantity: allowedQty,
          totalPrice: Number((item.unitPrice * allowedQty).toFixed(2)),
          product: {
            ...item.product,
            stock: nextStock,
            stockHalf: nextStockHalf,
          },
        });
      } else {
        nextCart.push(item);
      }
      continue;
    }

    const prodId = item.product?.id;
    const liveProd = prodId ? productMap.get(prodId) : undefined;
    if (!liveProd) {
      nextCart.push(item);
      continue;
    }

    if (liveProd.isAvailableOnline === false) {
      changed = true;
      continue;
    }

    const isEssence =
      liveProd.category === 'Esencias para Perfume' ||
      item.product.category === 'Esencias para Perfume';

    let allowedQty = item.quantity;
    if (isEssence) {
      if (item.presentation === 'MEDIA_ONZA') {
        const totalHalf = Math.max(0, Math.floor(typeof liveProd.stockHalf === 'number' ? liveProd.stockHalf : 0));
        const availHalf = Math.max(0, totalHalf - (usedHalfOzMap.get(prodId) || 0));
        allowedQty = Math.min(item.quantity, availHalf);
        if (allowedQty > 0) {
          usedHalfOzMap.set(prodId, (usedHalfOzMap.get(prodId) || 0) + allowedQty);
        }
      } else {
        const total1oz = Math.max(0, Math.floor(typeof liveProd.stock === 'number' ? liveProd.stock : 0));
        const avail1oz = Math.max(0, total1oz - (used1ozMap.get(prodId) || 0));
        allowedQty = Math.min(item.quantity, avail1oz);
        if (allowedQty > 0) {
          used1ozMap.set(prodId, (used1ozMap.get(prodId) || 0) + allowedQty);
        }
      }
    } else {
      const totalUnits = Math.max(0, Math.floor(typeof liveProd.stock === 'number' ? liveProd.stock : 0));
      const availUnits = Math.max(0, totalUnits - (usedUnitMap.get(prodId) || 0));
      allowedQty = Math.min(item.quantity, availUnits);
      if (allowedQty > 0) {
        usedUnitMap.set(prodId, (usedUnitMap.get(prodId) || 0) + allowedQty);
      }
    }

    if (allowedQty <= 0) {
      changed = true;
      continue;
    }

    const nextStock = liveProd.stock;
    const nextStockHalf = liveProd.stockHalf ?? 0;

    if (
      allowedQty !== item.quantity ||
      nextStock !== item.product.stock ||
      nextStockHalf !== item.product.stockHalf
    ) {
      changed = true;
      nextCart.push({
        ...item,
        quantity: allowedQty,
        totalPrice: Number((item.unitPrice * allowedQty).toFixed(2)),
        product: {
          ...item.product,
          stock: nextStock,
          stockHalf: nextStockHalf,
          minStock: liveProd.minStock,
        },
      });
    } else {
      nextCart.push(item);
    }
  }

  return changed ? nextCart : prevCart;
}

export interface EcommerceCartItem {
  id: string; // `${productId}-${presentation}` o `kit-${...}`
  product: ProductItem;
  presentation: ProductPresentation;
  presentationName: string;
  unitPrice: number;
  originalUnitPrice?: number;
  quantity: number;
  totalPrice: number;
  selectedBottle?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  kitDetails?: {
    essenceId: string;
    essenceName: string;
    essenceSku?: string;
    essenceBrand?: string;
    essencePuesto?: string;
    essenceImageUrl?: string;
    bottleId: string;
    bottleName: string;
    bottlePuesto?: string;
    bottleImageUrl?: string;
    hasLabel: boolean;
    isPlus: boolean;
    ouncesText: string;
  };
}

interface EcommerceCartContextType {
  cart: EcommerceCartItem[];
  addToCart: (
    product: ProductItem, 
    presentation?: ProductPresentation, 
    quantity?: number,
    selectedBottle?: ProductItem
  ) => void;
  addKitToCart: (config: {
    essence: ProductItem;
    bottle: ProductItem;
    hasLabel: boolean;
    isPlus: boolean;
    quantity?: number;
  }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCartPulsing: boolean;
  triggerCartPulse: () => void;
  totalItems: number;
  subtotal: number;
  rawSubtotal: number;
  discountTotal: number;

  isArmaTuPerfumeActive: boolean;
  setIsArmaTuPerfumeActive: (active: boolean) => void;
  kitConfig: KitConfig;
  refreshKitConfig: () => Promise<void>;
  syncCartWithLiveCatalog: () => Promise<void>;
}

export interface KitConfig {
  basePrice: number;
  extraShotPrice: number;
}

const DEFAULT_KIT_CONFIG: KitConfig = {
  basePrice: 15.00,
  extraShotPrice: 3.00,
};

const EcommerceCartContext = createContext<EcommerceCartContextType | undefined>(undefined);

export function EcommerceCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<EcommerceCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartPulsing, setIsCartPulsing] = useState(false);
  const [isArmaTuPerfumeActive, setIsArmaTuPerfumeActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { customer } = useCustomerAuth();

  const [kitConfig, setKitConfig] = useState<KitConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kodelocal_kit_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.basePrice === 'number' && typeof parsed.extraShotPrice === 'number') {
            return parsed;
          }
        }
      } catch (_) {}
    }
    return DEFAULT_KIT_CONFIG;
  });

  const refreshKitConfig = async () => {
    try {
      const res = await fetch('/api/kit-config');
      const data = await res.json();
      if (data.success && typeof data.basePrice === 'number' && typeof data.extraShotPrice === 'number') {
        const newCfg: KitConfig = {
          basePrice: Number(data.basePrice),
          extraShotPrice: Number(data.extraShotPrice),
        };
        setKitConfig(newCfg);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kodelocal_kit_config', JSON.stringify(newCfg));
        }
      }
    } catch (e) {
      console.error('Error cargando kit-config:', e);
    }
  };

  const triggerCartPulse = useCallback(() => {
    setIsCartPulsing(true);
    setTimeout(() => {
      setIsCartPulsing(false);
    }, 800);
  }, []);

  const syncCartWithLiveCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/products?fresh=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        saveStoredProducts(data.products);
        setCart((prev) => reconcileCartWithCatalog(prev, data.products));
      }
    } catch (e) {
      console.error('Error sincronizando inventario del carrito:', e);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    refreshKitConfig();

    const handleUpdate = () => {
      refreshKitConfig();
    };
    const handleProductsUpdated = () => {
      const stored = getStoredProducts();
      if (stored && stored.length > 0) {
        setCart((prev) => reconcileCartWithCatalog(prev, stored));
      }
    };

    window.addEventListener('kodelocal_kit_config_updated', handleUpdate);
    window.addEventListener('kodelocal_products_updated', handleProductsUpdated);
    window.addEventListener('storage', handleProductsUpdated);

    try {
      const saved = localStorage.getItem('aromaniak_online_cart');
      if (saved) {
        const parsedCart = JSON.parse(saved);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (e) {
      console.error('Error cargando carrito online:', e);
    }

    syncCartWithLiveCatalog();

    return () => {
      window.removeEventListener('kodelocal_kit_config_updated', handleUpdate);
      window.removeEventListener('kodelocal_products_updated', handleProductsUpdated);
      window.removeEventListener('storage', handleProductsUpdated);
    };
  }, [syncCartWithLiveCatalog]);

  useEffect(() => {
    if (isMounted && isCartOpen && cart.length > 0) {
      syncCartWithLiveCatalog();
    }
  }, [isMounted, isCartOpen, cart.length, syncCartWithLiveCatalog]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('aromaniak_online_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  // Recalcular precios del carrito automáticamente si el cliente tiene precios especiales o nivel VIP
  useEffect(() => {
    if (!isMounted) return;
    setCart((prev) => {
      let changed = false;
      const updated = prev.map((item) => {
        if (item.kitDetails) {
          const baseKit = item.originalUnitPrice ?? item.product.price;
          const kitPricing = applyCustomerProductPricing(baseKit, item.product, item.presentation, customer);
          if (kitPricing.price !== item.unitPrice || kitPricing.originalPrice !== item.originalUnitPrice) {
            changed = true;
            return {
              ...item,
              unitPrice: kitPricing.price,
              originalUnitPrice: kitPricing.originalPrice,
              totalPrice: Number((kitPricing.price * item.quantity).toFixed(2)),
            };
          }
          return item;
        }

        const presentations = getPresentationsForProduct(item.product, customer);
        const opt = presentations.find((p) => p.id === item.presentation) || presentations[0];
        const newUnitPrice = opt.price;
        const newOriginalPrice = opt.originalPrice ?? opt.price;

        if (newUnitPrice !== item.unitPrice || newOriginalPrice !== item.originalUnitPrice) {
          changed = true;
          return {
            ...item,
            unitPrice: newUnitPrice,
            originalUnitPrice: newOriginalPrice,
            totalPrice: Number((newUnitPrice * item.quantity).toFixed(2)),
          };
        }
        return item;
      });
      return changed ? updated : prev;
    });
  }, [
    customer?.id,
    customer?.specialEssencePrice,
    customer?.specialHalfEssencePrice,
    customer?.specialBottlePrice,
    customer?.tierId,
    customer?.tier?.discountPct,
    customer?.customDiscountPct,
    customer?.bottleTierId,
    customer?.bottleTier?.discountPct,
    customer?.bottleCustomDiscountPct,
    customer?.suppliesTierId,
    customer?.suppliesTier?.discountPct,
    customer?.suppliesCustomDiscountPct,
    isMounted,
    cart.length,
  ]);

  const addToCart = useCallback((
    product: ProductItem, 
    presentation: ProductPresentation = product.category === 'Esencias para Perfume' ? 'ONZA_COMPLETA' : 'UNIDAD',
    quantity: number = 1,
    selectedBottle?: ProductItem
  ) => {
    const storedCatalog = typeof window !== 'undefined' ? getStoredProducts() : [];
    const liveProduct = storedCatalog.find((p) => p.id === product.id) || product;
    const liveSelectedBottle = selectedBottle
      ? (storedCatalog.find((p) => p.id === selectedBottle.id) || selectedBottle)
      : undefined;

    const presentations = getPresentationsForProduct(liveProduct, customer);
    const selectedOption = presentations.find(p => p.id === presentation) || presentations[0];
    const isEssence = liveProduct.category === 'Esencias para Perfume';
    
    const unitPrice = selectedOption.price;
    const originalUnitPrice = selectedOption.originalPrice ?? selectedOption.price;

    const itemId = liveSelectedBottle 
      ? `${liveProduct.id}-${presentation}-${liveSelectedBottle.id}` 
      : `${liveProduct.id}-${presentation}`;

    const totalStock = typeof liveProduct.stock === 'number' ? liveProduct.stock : 0;
    if (totalStock <= 0) {
      return;
    }

    if (liveSelectedBottle) {
      const totalBottleStock = typeof liveSelectedBottle.stock === 'number' ? liveSelectedBottle.stock : 0;
      if (totalBottleStock <= 0) {
        return;
      }
    }

    setCart(prev => {
      const existingPerfume = prev.find(item => item.id === itemId);
      const currentQty = existingPerfume ? existingPerfume.quantity : 0;
      const desiredQty = currentQty + quantity;

      // Validación estricta de inventario discreto
      if (isEssence) {
        const discrete = getEssenceDiscreteStock(totalStock, prev, liveProduct.id, itemId, liveProduct.stockHalf || 0);
        if (presentation === 'ONZA_COMPLETA' && (discrete.available1oz <= 0 || desiredQty > discrete.available1oz)) {
          return prev;
        }
        if (presentation === 'MEDIA_ONZA' && (discrete.availableHalfOz <= 0 || desiredQty > discrete.availableHalfOz)) {
          return prev;
        }
      } else {
        const availableUnits = getBottleAvailableStock(totalStock, prev, liveProduct.id, itemId);
        if (availableUnits <= 0 || desiredQty > availableUnits) {
          return prev;
        }
      }

      if (liveSelectedBottle) {
        const bottleItemId = `${liveSelectedBottle.id}-BOTE-${liveProduct.id}`;
        const totalBottleStock = typeof liveSelectedBottle.stock === 'number' ? liveSelectedBottle.stock : 0;
        const availableBottle = getBottleAvailableStock(totalBottleStock, prev, liveSelectedBottle.id, bottleItemId);
        if (availableBottle <= 0 || desiredQty > availableBottle) {
          return prev;
        }
      }

      let updatedCart = [...prev];

      // Agregar o actualizar el Perfume
      if (existingPerfume) {
        updatedCart = updatedCart.map(item => 
          item.id === itemId
            ? { 
                ...item, 
                product: liveProduct,
                quantity: desiredQty,
                unitPrice,
                originalUnitPrice,
                totalPrice: Number((desiredQty * unitPrice).toFixed(2))
              }
            : item
        );
      } else {
        const bottleOpt = liveSelectedBottle ? getPresentationsForProduct(liveSelectedBottle, customer)[0] : null;
        updatedCart.push({
          id: itemId,
          product: liveProduct,
          presentation,
          presentationName: selectedOption.name,
          unitPrice,
          originalUnitPrice,
          quantity: desiredQty,
          totalPrice: Number((unitPrice * desiredQty).toFixed(2)),
          selectedBottle: liveSelectedBottle ? {
            id: liveSelectedBottle.id,
            name: liveSelectedBottle.name,
            price: bottleOpt ? bottleOpt.price : liveSelectedBottle.price,
            imageUrl: liveSelectedBottle.imageUrl
          } : undefined
        });
      }

      // 2. Si eligió un bote para el perfume preparado, sumarlo también al carrito
      if (liveSelectedBottle) {
        const bottleItemId = `${liveSelectedBottle.id}-BOTE-${liveProduct.id}`;
        const bottleOpt = getPresentationsForProduct(liveSelectedBottle, customer)[0];
        const bottlePrice = bottleOpt ? bottleOpt.price : liveSelectedBottle.price;
        const bottleOrigPrice = bottleOpt?.originalPrice ?? liveSelectedBottle.price;
        const existingBottle = updatedCart.find(item => item.id === bottleItemId);
        if (existingBottle) {
          updatedCart = updatedCart.map(item =>
            item.id === bottleItemId
              ? {
                  ...item,
                  product: liveSelectedBottle,
                  quantity: desiredQty,
                  unitPrice: bottlePrice,
                  originalUnitPrice: bottleOrigPrice,
                  totalPrice: Number((desiredQty * bottlePrice).toFixed(2))
                }
              : item
          );
        } else {
          updatedCart.push({
            id: bottleItemId,
            product: liveSelectedBottle,
            presentation: 'UNIDAD',
            presentationName: `Bote para ${liveProduct.officialName || liveProduct.name}`,
            unitPrice: bottlePrice,
            originalUnitPrice: bottleOrigPrice,
            quantity: desiredQty,
            totalPrice: Number((bottlePrice * desiredQty).toFixed(2))
          });
        }
      }

      return updatedCart;
    });

    trackMetaAddToCart({
      productId: liveProduct.id,
      productName: liveProduct.officialName || liveProduct.name,
      category: liveProduct.category,
      unitPrice,
      quantity,
    });

    triggerCartPulse();
  }, [customer, triggerCartPulse]);

  const addKitToCart = useCallback(({
    essence,
    bottle,
    hasLabel,
    isPlus,
    quantity = 1,
  }: {
    essence: ProductItem;
    bottle: ProductItem;
    hasLabel: boolean;
    isPlus: boolean;
    quantity?: number;
  }) => {
    const storedCatalog = typeof window !== 'undefined' ? getStoredProducts() : [];
    const liveEssence = storedCatalog.find((p) => p.id === essence.id) || essence;
    const liveBottle = storedCatalog.find((p) => p.id === bottle.id) || bottle;

    // Precio dinámico: base + extra shot si seleccionó PLUS
    const baseKitPrice = liveEssence.finishedPerfumePrice != null ? Number(liveEssence.finishedPerfumePrice) : kitConfig.basePrice;
    const extraShotPrice = kitConfig.extraShotPrice;
    const rawKitPrice = isPlus ? Number((baseKitPrice + extraShotPrice).toFixed(2)) : baseKitPrice;
    const presentation: ProductPresentation = isPlus ? 'KIT_PREPARADO_PLUS' : 'KIT_PREPARADO';
    const bottleDisplayName = liveBottle.name || liveBottle.officialName || 'Frasco 100ml';
    const bottlePuestoTag = liveBottle.puesto ? ` [${liveBottle.puesto}]` : '';
    const labelDisplay = hasLabel ? 'Con etiqueta' : 'Sin etiqueta';
    const formulaDisplay = isPlus ? 'Arma tu propio perfume PLUS (1.5 oz)' : 'Arma tu propio perfume (1 oz)';
    const presentationName = `${formulaDisplay} | Frasco: ${bottleDisplayName}${bottlePuestoTag} | ${labelDisplay}`;
    const itemId = `kit-${liveEssence.id}-${liveBottle.id}-${hasLabel ? 'label' : 'nolabel'}-${isPlus ? 'plus' : 'std'}`;

    const totalEssenceStock = typeof liveEssence.stock === 'number' ? liveEssence.stock : 0;
    const totalBottleStock = typeof liveBottle.stock === 'number' ? liveBottle.stock : 0;
    if (totalEssenceStock <= 0 || totalBottleStock <= 0) {
      return;
    }

    const essenceImageUrl = liveEssence.sku 
      ? '/images/essence_bottle_blank.webp'
      : liveEssence.id 
      ? `/images/esencias/${liveEssence.id}.webp?v=aroma_official_v4`
      : '/images/essence_bottle_blank.webp';

    const kitProduct: ProductItem = {
      ...liveEssence,
      id: itemId,
      name: `Arma tu propio perfume: ${liveEssence.officialName || liveEssence.name}`,
      officialName: `Arma tu propio perfume: ${liveEssence.officialName || liveEssence.name}`,
      category: 'Arma tu propio perfume',
      price: rawKitPrice,
      imageUrl: essenceImageUrl,
    };

    const kitPricing = applyCustomerProductPricing(rawKitPrice, kitProduct, presentation, customer);
    const unitPrice = kitPricing.price;
    const originalUnitPrice = kitPricing.originalPrice;

    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      const desiredQty = (existing ? existing.quantity : 0) + quantity;

      // Cada kit requiere 1 bote de 1 oz, 1 frasco de 100ml; y si es PLUS, requiere además 1 bote de ½ oz
      const discrete = getEssenceDiscreteStock(totalEssenceStock, prev, liveEssence.id, itemId, liveEssence.stockHalf || 0);
      const availableBottle = getBottleAvailableStock(totalBottleStock, prev, liveBottle.id, itemId);

      if (desiredQty > discrete.available1oz) {
        return prev;
      }
      if (isPlus && desiredQty > discrete.availableHalfOz) {
        return prev;
      }
      if (desiredQty > availableBottle) {
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                product: kitProduct,
                quantity: desiredQty,
                unitPrice,
                originalUnitPrice,
                totalPrice: Number((desiredQty * unitPrice).toFixed(2))
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: itemId,
          product: kitProduct,
          presentation,
          presentationName,
          unitPrice,
          originalUnitPrice,
          quantity: desiredQty,
          totalPrice: Number((unitPrice * desiredQty).toFixed(2)),
          selectedBottle: {
            id: liveBottle.id,
            name: liveBottle.name,
            price: 0,
            imageUrl: liveBottle.imageUrl
          },
          kitDetails: {
            essenceId: liveEssence.id,
            essenceName: liveEssence.officialName || liveEssence.name,
            essenceSku: liveEssence.sku,
            essenceBrand: liveEssence.brand,
            essencePuesto: liveEssence.puesto,
            essenceImageUrl,
            bottleId: liveBottle.id,
            bottleName: bottleDisplayName,
            bottlePuesto: liveBottle.puesto,
            bottleImageUrl: liveBottle.imageUrl,
            hasLabel,
            isPlus,
            ouncesText: isPlus ? '1.5 Onzas (1 oz base + ½ oz extra PLUS)' : '1 Onza Estándar'
          }
        }
      ];
    });

    trackMetaAddToCart({
      productId: liveEssence.id,
      productName: `Arma tu propio perfume: ${liveEssence.officialName || liveEssence.name}`,
      category: 'Arma tu propio perfume',
      unitPrice,
      quantity,
    });

    triggerCartPulse();
  }, [kitConfig, customer, triggerCartPulse]);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(prev => {
      const current = prev.find(item => item.id === id);
      if (!current) return prev;

      let effectiveQuantity = Math.floor(quantity);

      // Validar y ajustar al inventario máximo disponible si es un aumento de cantidad
      if (effectiveQuantity > current.quantity) {
        const storedCatalog = typeof window !== 'undefined' ? getStoredProducts() : [];
        const prod = current.product;
        const liveProd = storedCatalog.find((p) => p.id === (current.kitDetails?.essenceId || prod.id)) || prod;
        const totalStock = typeof liveProd.stock === 'number' ? liveProd.stock : 0;
        const isEssence = liveProd.category === 'Esencias para Perfume' || prod.category === 'Esencias para Perfume';

        let maxAllowed = effectiveQuantity;
        if (current.kitDetails) {
          const discrete = getEssenceDiscreteStock(totalStock, prev, current.kitDetails.essenceId, id, liveProd.stockHalf || 0);
          maxAllowed = discrete.available1oz;
          if (current.kitDetails.isPlus) {
            maxAllowed = Math.min(maxAllowed, discrete.availableHalfOz);
          }
          if (current.kitDetails.bottleId) {
            const liveBottle = storedCatalog.find((p) => p.id === current.kitDetails?.bottleId);
            if (liveBottle) {
              const availableBottle = getBottleAvailableStock(
                typeof liveBottle.stock === 'number' ? liveBottle.stock : 0,
                prev,
                current.kitDetails.bottleId,
                id
              );
              maxAllowed = Math.min(maxAllowed, availableBottle);
            }
          }
        } else if (isEssence) {
          const discrete = getEssenceDiscreteStock(totalStock, prev, prod.id, id, liveProd.stockHalf || 0);
          if (current.presentation === 'ONZA_COMPLETA') {
            maxAllowed = discrete.available1oz;
          } else if (current.presentation === 'MEDIA_ONZA') {
            maxAllowed = discrete.availableHalfOz;
          }
        } else {
          maxAllowed = getBottleAvailableStock(totalStock, prev, prod.id, id);
        }

        effectiveQuantity = Math.min(effectiveQuantity, Math.max(current.quantity, maxAllowed));
        if (effectiveQuantity <= current.quantity) {
          return prev;
        }

        trackMetaAddToCart({
          productId: current.kitDetails?.essenceId || prod.id,
          productName: prod.officialName || prod.name,
          category: prod.category,
          unitPrice: current.unitPrice,
          quantity: effectiveQuantity - current.quantity,
        });

        triggerCartPulse();
      }

      return prev.map(item => 
        item.id === id 
          ? { ...item, quantity: effectiveQuantity, totalPrice: Number((item.unitPrice * effectiveQuantity).toFixed(2)) }
          : item
      );
    });
  }, [removeFromCart, triggerCartPulse]);

  const totalItems = useMemo(() => cart.reduce((acc, it) => acc + it.quantity, 0), [cart]);
  const subtotal = useMemo(() => Number(cart.reduce((acc, it) => acc + it.totalPrice, 0).toFixed(2)), [cart]);
  const rawSubtotal = useMemo(
    () =>
      Number(
        cart
          .reduce((acc, it) => acc + Number(((it.originalUnitPrice ?? it.unitPrice) * it.quantity).toFixed(2)), 0)
          .toFixed(2)
      ),
    [cart]
  );
  const discountTotal = useMemo(() => Number(Math.max(0, rawSubtotal - subtotal).toFixed(2)), [rawSubtotal, subtotal]);



  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    addKitToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    isCartPulsing,
    triggerCartPulse,
    totalItems,
    subtotal,
    rawSubtotal,
    discountTotal,

    isArmaTuPerfumeActive,
    setIsArmaTuPerfumeActive,
    kitConfig,
    refreshKitConfig,
    syncCartWithLiveCatalog
  }), [
    cart,
    addToCart,
    addKitToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    isCartPulsing,
    triggerCartPulse,
    totalItems,
    subtotal,
    rawSubtotal,
    discountTotal,

    isArmaTuPerfumeActive,
    kitConfig,
    refreshKitConfig,
    syncCartWithLiveCatalog
  ]);

  return (
    <EcommerceCartContext.Provider value={contextValue}>
      {children}
    </EcommerceCartContext.Provider>
  );
}

export function useEcommerceCart() {
  const context = useContext(EcommerceCartContext);
  if (!context) {
    throw new Error('useEcommerceCart debe ser usado dentro de EcommerceCartProvider');
  }
  return context;
}
