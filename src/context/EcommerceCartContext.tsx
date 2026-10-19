'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useCustomerAuth } from "@/context/CustomerAuthContext";

import { ProductItem } from '@/lib/store';
import { isHalloweenPromoProduct, HALLOWEEN_PROMO_PRICE_1OZ } from '@/lib/halloweenPromo';

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
  const isHalloween1Oz = presentation === 'ONZA_COMPLETA' && isHalloweenPromoProduct(product);

  if (!customer) {
    const publicPrice = isHalloween1Oz ? Math.min(originalPrice, HALLOWEEN_PROMO_PRICE_1OZ) : originalPrice;
    return { price: publicPrice, originalPrice };
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

  let effectivePrice = isHalloween1Oz ? Math.min(originalPrice, HALLOWEEN_PROMO_PRICE_1OZ) : originalPrice;

  if (isEssence && customer.specialEssencePrice != null && Number(customer.specialEssencePrice) > 0) {
    const baseSpecial = Number(customer.specialEssencePrice);
    const specialCandidate =
      presentation === 'MEDIA_ONZA'
        ? Number((baseSpecial / 2).toFixed(2))
        : Number(baseSpecial.toFixed(2));
    effectivePrice = isHalloween1Oz ? Math.min(specialCandidate, HALLOWEEN_PROMO_PRICE_1OZ) : specialCandidate;
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
  if (product.category === 'Esencias para Perfume') {
    const onzaBase = Number((product.price || 3.25).toFixed(2));
    const mediaOnzaBase = product.priceHalfOunce != null 
      ? Number(Number(product.priceHalfOunce).toFixed(2)) 
      : Number((onzaBase / 2).toFixed(2));
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
    essenceImageUrl?: string;
    bottleId: string;
    bottleName: string;
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

  useEffect(() => {
    setIsMounted(true);
    refreshKitConfig();

    const handleUpdate = () => {
      refreshKitConfig();
    };
    window.addEventListener('kodelocal_kit_config_updated', handleUpdate);

    try {
      const saved = localStorage.getItem('aromaniak_online_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando carrito online:', e);
    }

    return () => {
      window.removeEventListener('kodelocal_kit_config_updated', handleUpdate);
    };
  }, []);

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
  ]);

  const addToCart = useCallback((
    product: ProductItem, 
    presentation: ProductPresentation = product.category === 'Esencias para Perfume' ? 'ONZA_COMPLETA' : 'UNIDAD',
    quantity: number = 1,
    selectedBottle?: ProductItem
  ) => {
    const presentations = getPresentationsForProduct(product, customer);
    const selectedOption = presentations.find(p => p.id === presentation) || presentations[0];
    const isEssence = product.category === 'Esencias para Perfume';
    
    const unitPrice = selectedOption.price;
    const originalUnitPrice = selectedOption.originalPrice ?? selectedOption.price;

    const itemId = selectedBottle 
      ? `${product.id}-${presentation}-${selectedBottle.id}` 
      : `${product.id}-${presentation}`;

    const totalStock = typeof product.stock === 'number' ? product.stock : 0;
    if (totalStock <= 0) {
      return;
    }

    setCart(prev => {
      const existingPerfume = prev.find(item => item.id === itemId);
      const currentQty = existingPerfume ? existingPerfume.quantity : 0;
      const desiredQty = currentQty + quantity;

      // Validación estricta de inventario discreto
      if (isEssence) {
        const discrete = getEssenceDiscreteStock(totalStock, prev, product.id, itemId, product.stockHalf || 0);
        if (presentation === 'ONZA_COMPLETA' && (discrete.available1oz <= 0 || desiredQty > discrete.available1oz)) {
          return prev;
        }
        if (presentation === 'MEDIA_ONZA' && (discrete.availableHalfOz <= 0 || desiredQty > discrete.availableHalfOz)) {
          return prev;
        }
      } else {
        const otherUnitsUsed = prev
          .filter(it => it.product.id === product.id && it.id !== itemId)
          .reduce((acc, it) => acc + it.quantity, 0);
        if (otherUnitsUsed + desiredQty > totalStock) {
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
                quantity: desiredQty,
                unitPrice,
                originalUnitPrice,
                totalPrice: Number((desiredQty * unitPrice).toFixed(2))
              }
            : item
        );
      } else {
        const bottleOpt = selectedBottle ? getPresentationsForProduct(selectedBottle, customer)[0] : null;
        updatedCart.push({
          id: itemId,
          product,
          presentation,
          presentationName: selectedOption.name,
          unitPrice,
          originalUnitPrice,
          quantity: desiredQty,
          totalPrice: Number((unitPrice * desiredQty).toFixed(2)),
          selectedBottle: selectedBottle ? {
            id: selectedBottle.id,
            name: selectedBottle.name,
            price: bottleOpt ? bottleOpt.price : selectedBottle.price,
            imageUrl: selectedBottle.imageUrl
          } : undefined
        });
      }

      // 2. Si eligió un bote para el perfume preparado, sumarlo también al carrito
      if (selectedBottle) {
        const bottleItemId = `${selectedBottle.id}-BOTE-${product.id}`;
        const bottleOpt = getPresentationsForProduct(selectedBottle, customer)[0];
        const bottlePrice = bottleOpt ? bottleOpt.price : selectedBottle.price;
        const bottleOrigPrice = bottleOpt?.originalPrice ?? selectedBottle.price;
        const existingBottle = updatedCart.find(item => item.id === bottleItemId);
        if (existingBottle) {
          updatedCart = updatedCart.map(item =>
            item.id === bottleItemId
              ? {
                  ...item,
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
            product: selectedBottle,
            presentation: 'UNIDAD',
            presentationName: `Bote para ${product.officialName || product.name}`,
            unitPrice: bottlePrice,
            originalUnitPrice: bottleOrigPrice,
            quantity: desiredQty,
            totalPrice: Number((bottlePrice * desiredQty).toFixed(2))
          });
        }
      }

      return updatedCart;
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
    // Precio dinámico: base + extra shot si seleccionó PLUS
    const baseKitPrice = essence.finishedPerfumePrice != null ? Number(essence.finishedPerfumePrice) : kitConfig.basePrice;
    const extraShotPrice = kitConfig.extraShotPrice;
    const rawKitPrice = isPlus ? Number((baseKitPrice + extraShotPrice).toFixed(2)) : baseKitPrice;
    const presentation: ProductPresentation = isPlus ? 'KIT_PREPARADO_PLUS' : 'KIT_PREPARADO';
    const presentationName = isPlus ? 'Arma tu propio perfume PLUS (1.5 oz)' : 'Arma tu propio perfume (1 oz)';
    const itemId = `kit-${essence.id}-${bottle.id}-${hasLabel ? 'label' : 'nolabel'}-${isPlus ? 'plus' : 'std'}`;

    const totalEssenceStock = typeof essence.stock === 'number' ? essence.stock : 0;
    if (totalEssenceStock <= 0) {
      return;
    }

    const essenceImageUrl = essence.sku 
      ? '/images/essence_bottle_blank.webp'
      : essence.id 
      ? `/images/esencias/${essence.id}.webp?v=aroma_official_v4`
      : '/images/essence_bottle_blank.webp';

    const kitProduct: ProductItem = {
      ...essence,
      id: itemId,
      name: `Arma tu propio perfume: ${essence.officialName || essence.name}`,
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

      // Cada kit requiere 1 bote de 1 oz; y si es PLUS, requiere además 1 bote de ½ oz
      const discrete = getEssenceDiscreteStock(totalEssenceStock, prev, essence.id, itemId, essence.stockHalf || 0);

      if (desiredQty > discrete.available1oz) {
        return prev;
      }
      if (isPlus && desiredQty > discrete.availableHalfOz) {
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? {
                ...item,
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
            id: bottle.id,
            name: bottle.name,
            price: 0,
            imageUrl: bottle.imageUrl
          },
          kitDetails: {
            essenceId: essence.id,
            essenceName: essence.officialName || essence.name,
            essenceSku: essence.sku,
            essenceBrand: essence.brand,
            essenceImageUrl,
            bottleId: bottle.id,
            bottleName: bottle.name,
            bottleImageUrl: bottle.imageUrl,
            hasLabel,
            isPlus,
            ouncesText: isPlus ? '1.5 Onzas (1 oz base + ½ oz extra PLUS)' : '1 Onza Estándar'
          }
        }
      ];
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

      // Validar inventario si es un aumento de cantidad
      if (quantity > current.quantity) {
        const prod = current.product;
        const totalStock = typeof prod.stock === 'number' ? prod.stock : 0;
        const isEssence = prod.category === 'Esencias para Perfume';

        if (current.kitDetails) {
          const discrete = getEssenceDiscreteStock(totalStock, prev, current.kitDetails.essenceId, id, prod.stockHalf || 0);
          if (quantity > discrete.available1oz) {
            return prev;
          }
          if (current.kitDetails.isPlus && quantity > discrete.availableHalfOz) {
            return prev;
          }
        } else if (isEssence) {
          const discrete = getEssenceDiscreteStock(totalStock, prev, prod.id, id, prod.stockHalf || 0);
          if (current.presentation === 'ONZA_COMPLETA' && quantity > discrete.available1oz) {
            return prev;
          }
          if (current.presentation === 'MEDIA_ONZA' && quantity > discrete.availableHalfOz) {
            return prev;
          }
        } else {
          const otherUnitsUsed = prev
            .filter(it => it.product.id === prod.id && it.id !== id)
            .reduce((acc, it) => acc + it.quantity, 0);
          if (otherUnitsUsed + quantity > totalStock) {
            return prev; // Bloquear aumento más allá del stock
          }
        }

        triggerCartPulse();
      }

      return prev.map(item => 
        item.id === id 
          ? { ...item, quantity, totalPrice: Number((item.unitPrice * quantity).toFixed(2)) }
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
    refreshKitConfig
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
    refreshKitConfig
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
