'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductItem } from '@/lib/store';

export type ProductPresentation = 
  | '1_OZ'            // 1 Onza pura ($3.25)
  | '2_OZ'            // 2 Onzas puras ($6.50)
  | 'PERFUME_30ML'    // Perfume preparado 30ml ($6.50)
  | 'PERFUME_50ML'    // Perfume preparado 50ml ($9.50)
  | 'PERFUME_100ML'   // Perfume preparado 100ml ($14.99)
  | 'UNIDAD';         // Para botes, empaque, alcohol

export interface PresentationOption {
  id: ProductPresentation;
  name: string;
  description: string;
  price: number;
}

export function getPresentationsForProduct(product: ProductItem): PresentationOption[] {
  if (product.category === 'Esencias para Perfume') {
    return [
      {
        id: 'PERFUME_50ML',
        name: 'Perfume Preparado 50ml',
        description: 'Frasco de vidrio + atomizador + esencia al 33% concentración',
        price: 9.50
      },
      {
        id: 'PERFUME_100ML',
        name: 'Perfume Preparado 100ml Premium',
        description: 'Frasco de lujo 100ml + atomizador + máxima duración',
        price: 14.99
      },
      {
        id: 'PERFUME_30ML',
        name: 'Perfume de Bolsillo 30ml',
        description: 'Frasco portátil compacto con spray',
        price: 6.50
      },
      {
        id: '1_OZ',
        name: '1 Onza de Esencia Pura',
        description: 'Esencia pura concentrada para reenvase',
        price: product.price || 3.25
      },
      {
        id: '2_OZ',
        name: '2 Onzas de Esencia Pura',
        description: '2 Onzas puras de contratipo fino',
        price: Number(((product.price || 3.25) * 2).toFixed(2))
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
  id: string; // `${productId}-${presentation}`
  product: ProductItem;
  presentation: ProductPresentation;
  presentationName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface EcommerceCartContextType {
  cart: EcommerceCartItem[];
  addToCart: (product: ProductItem, presentation?: ProductPresentation, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const EcommerceCartContext = createContext<EcommerceCartContextType | undefined>(undefined);

export function EcommerceCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<EcommerceCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
    presentation: ProductPresentation = product.category === 'Esencias para Perfume' ? 'PERFUME_50ML' : 'UNIDAD',
    quantity: number = 1
  ) => {
    const presentations = getPresentationsForProduct(product);
    const selectedOption = presentations.find(p => p.id === presentation) || presentations[0];
    const unitPrice = selectedOption.price;
    const itemId = `${product.id}-${presentation}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.map(item => 
          item.id === itemId
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                totalPrice: Number(((item.quantity + quantity) * item.unitPrice).toFixed(2))
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: itemId,
            product,
            presentation,
            presentationName: selectedOption.name,
            unitPrice,
            quantity,
            totalPrice: Number((unitPrice * quantity).toFixed(2))
          }
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity, totalPrice: Number((item.unitPrice * quantity).toFixed(2)) }
        : item
    ));
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
      updateQuantity,
      removeFromCart,
      clearCart,
      isCartOpen,
      setIsCartOpen,
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
