'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductItem } from '@/lib/store';

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
}

export function getPresentationsForProduct(product: ProductItem): PresentationOption[] {
  if (product.category === 'Esencias para Perfume') {
    const onzaPrice = Number((product.price || 3.25).toFixed(2));
    const mediaOnzaPrice = Number((onzaPrice / 2).toFixed(2));
    return [
      {
        id: 'ONZA_COMPLETA',
        name: '1 Onza',
        description: 'Esencia pura concentrada (1 oz)',
        price: onzaPrice
      },
      {
        id: 'MEDIA_ONZA',
        name: '½ Onza',
        description: 'Media onza de esencia pura (0.5 oz)',
        price: mediaOnzaPrice
      }
    ];
  }

  return [
    {
      id: 'UNIDAD',
      name: `${product.unit || 'Unidad'}`,
      description: 'Precio por unidad individual',
      price: product.price
    }
  ];
}

export interface EcommerceCartItem {
  id: string; // `${productId}-${presentation}` o `kit-${...}`
  product: ProductItem;
  presentation: ProductPresentation;
  presentationName: string;
  unitPrice: number;
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
}

const EcommerceCartContext = createContext<EcommerceCartContextType | undefined>(undefined);

export function EcommerceCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<EcommerceCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartPulsing, setIsCartPulsing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const triggerCartPulse = () => {
    setIsCartPulsing(true);
    setTimeout(() => {
      setIsCartPulsing(false);
    }, 800);
  };

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('aromaniak_online_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando carrito online:', e);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('aromaniak_online_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  const addToCart = (
    product: ProductItem, 
    presentation: ProductPresentation = product.category === 'Esencias para Perfume' ? 'ONZA_COMPLETA' : 'UNIDAD',
    quantity: number = 1,
    selectedBottle?: ProductItem
  ) => {
    const presentations = getPresentationsForProduct(product);
    const selectedOption = presentations.find(p => p.id === presentation) || presentations[0];
    const unitPrice = selectedOption.price;
    const itemId = selectedBottle 
      ? `${product.id}-${presentation}-${selectedBottle.id}` 
      : `${product.id}-${presentation}`;

    const totalStock = typeof product.stock === 'number' ? product.stock : 0;
    const isEssence = product.category === 'Esencias para Perfume';

    setCart(prev => {
      // 1. Calcular consumo actual de este producto en el carrito excluyendo este item en particular
      const otherEssenceUsed = prev
        .filter(item => item.product.id === product.id && item.id !== itemId)
        .reduce((acc, item) => {
          if (item.presentation === 'MEDIA_ONZA') return acc + item.quantity * 0.5;
          if (item.presentation === 'ONZA_COMPLETA') return acc + item.quantity * 1.0;
          return acc + item.quantity;
        }, 0);

      const existingPerfume = prev.find(item => item.id === itemId);
      const currentQty = existingPerfume ? existingPerfume.quantity : 0;
      const desiredQty = currentQty + quantity;

      // Calcular inventario requerido para la nueva cantidad deseada
      const requiredOuncesForDesired = isEssence
        ? (presentation === 'MEDIA_ONZA' ? desiredQty * 0.5 : desiredQty * 1.0)
        : desiredQty;

      // Si excede el inventario total disponible, bloquear la adición
      if (otherEssenceUsed + requiredOuncesForDesired > totalStock) {
        return prev;
      }

      let updatedCart = [...prev];

      // Agregar o actualizar el Perfume
      if (existingPerfume) {
        updatedCart = updatedCart.map(item => 
          item.id === itemId
            ? { 
                ...item, 
                quantity: desiredQty,
                totalPrice: Number((desiredQty * item.unitPrice).toFixed(2))
              }
            : item
        );
      } else {
        updatedCart.push({
          id: itemId,
          product,
          presentation,
          presentationName: selectedOption.name,
          unitPrice,
          quantity: desiredQty,
          totalPrice: Number((unitPrice * desiredQty).toFixed(2)),
          selectedBottle: selectedBottle ? {
            id: selectedBottle.id,
            name: selectedBottle.name,
            price: selectedBottle.price,
            imageUrl: selectedBottle.imageUrl
          } : undefined
        });
      }

      // 2. Si eligió un bote para el perfume preparado, sumarlo también al carrito
      if (selectedBottle) {
        const bottleItemId = `${selectedBottle.id}-BOTE-${product.id}`;
        const existingBottle = updatedCart.find(item => item.id === bottleItemId);
        if (existingBottle) {
          updatedCart = updatedCart.map(item =>
            item.id === bottleItemId
              ? {
                  ...item,
                  quantity: desiredQty,
                  totalPrice: Number((desiredQty * item.unitPrice).toFixed(2))
                }
              : item
          );
        } else {
          updatedCart.push({
            id: bottleItemId,
            product: selectedBottle,
            presentation: 'UNIDAD',
            presentationName: `Bote para ${product.officialName || product.name}`,
            unitPrice: selectedBottle.price,
            quantity: desiredQty,
            totalPrice: Number((selectedBottle.price * desiredQty).toFixed(2))
          });
        }
      }

      return updatedCart;
    });

    triggerCartPulse();
  };

  const addKitToCart = ({
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
    // Precio fijo $15.00 base, o $18.00 si seleccionó versión PLUS (+½ oz extra)
    const unitPrice = isPlus ? 18.00 : 15.00;
    const presentation: ProductPresentation = isPlus ? 'KIT_PREPARADO_PLUS' : 'KIT_PREPARADO';
    const presentationName = isPlus ? 'Arma tu propio perfume PLUS (1.5 oz)' : 'Arma tu propio perfume (1 oz)';
    const itemId = `kit-${essence.id}-${bottle.id}-${hasLabel ? 'label' : 'nolabel'}-${isPlus ? 'plus' : 'std'}`;

    const totalEssenceStock = typeof essence.stock === 'number' ? essence.stock : 0;
    const ozPerKit = isPlus ? 1.5 : 1.0;

    const kitProduct: ProductItem = {
      ...essence,
      id: itemId,
      name: `Arma tu propio perfume: ${essence.officialName || essence.name}`,
      category: 'Arma tu propio perfume',
      price: unitPrice,
      imageUrl: bottle.imageUrl || essence.imageUrl,
    };

    setCart(prev => {
      // Calcular consumo actual de la esencia en el carrito
      const currentEssenceUsed = prev
        .filter(item => item.product.id === essence.id || (item.kitDetails && item.kitDetails.essenceId === essence.id))
        .reduce((acc, item) => {
          if (item.kitDetails) {
            return acc + (item.kitDetails.isPlus ? item.quantity * 1.5 : item.quantity * 1.0);
          }
          if (item.presentation === 'MEDIA_ONZA') return acc + item.quantity * 0.5;
          if (item.presentation === 'ONZA_COMPLETA') return acc + item.quantity * 1.0;
          return acc + item.quantity;
        }, 0);

      const existing = prev.find(item => item.id === itemId);
      const desiredQty = (existing ? existing.quantity : 0) + quantity;
      const additionalOz = ozPerKit * quantity;

      if (currentEssenceUsed + additionalOz > totalEssenceStock) {
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity: desiredQty,
                totalPrice: Number((desiredQty * item.unitPrice).toFixed(2))
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
  };

  const updateQuantity = (id: string, quantity: number) => {
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
          const ozPerKit = current.kitDetails.isPlus ? 1.5 : 1.0;
          const otherUsed = prev
            .filter(item => item.id !== id && (item.product.id === current.kitDetails?.essenceId || item.kitDetails?.essenceId === current.kitDetails?.essenceId))
            .reduce((acc, item) => {
              if (item.kitDetails) return acc + (item.kitDetails.isPlus ? item.quantity * 1.5 : item.quantity * 1.0);
              if (item.presentation === 'MEDIA_ONZA') return acc + item.quantity * 0.5;
              if (item.presentation === 'ONZA_COMPLETA') return acc + item.quantity * 1.0;
              return acc + item.quantity;
            }, 0);

          if (otherUsed + (ozPerKit * quantity) > totalStock) {
            return prev; // Bloquear aumento más allá del stock
          }
        } else if (isEssence) {
          const otherUsed = prev
            .filter(item => item.id !== id && item.product.id === prod.id)
            .reduce((acc, item) => {
              if (item.presentation === 'MEDIA_ONZA') return acc + item.quantity * 0.5;
              if (item.presentation === 'ONZA_COMPLETA') return acc + item.quantity * 1.0;
              return acc + item.quantity;
            }, 0);

          const desiredOz = current.presentation === 'MEDIA_ONZA' ? quantity * 0.5 : quantity * 1.0;
          if (otherUsed + desiredOz > totalStock) {
            return prev; // Bloquear aumento más allá del stock
          }
        } else {
          if (quantity > totalStock) {
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
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = Number(cart.reduce((acc, it) => acc + it.totalPrice, 0).toFixed(2));

  return (
    <EcommerceCartContext.Provider value={{
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
      subtotal
    }}>
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
