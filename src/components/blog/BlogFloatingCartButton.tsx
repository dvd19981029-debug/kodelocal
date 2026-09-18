// src/components/blog/BlogFloatingCartButton.tsx
'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';

export default function BlogFloatingCartButton() {
  const { totalItems, subtotal, setIsCartOpen, isCartPulsing } = useEcommerceCart();

  if (totalItems <= 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className={`clay-btn clay-btn-primary px-4 py-2.5 sm:px-5 sm:py-3 rounded-full flex items-center gap-2 sm:gap-2.5 text-white font-black text-xs sm:text-sm shadow-xl transition-all duration-300 active:scale-95 cursor-pointer ${
          isCartPulsing
            ? 'scale-105 ring-4 ring-purple-300 shadow-[0_4px_25px_rgba(124,58,237,0.6)]'
            : 'hover:scale-105 shadow-[0_4px_20px_rgba(124,58,237,0.4)]'
        }`}
        aria-label="Ver carrito de compras"
      >
        <div className="relative">
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {totalItems}
          </span>
        </div>
        <span>Ver Carrito</span>
        <span className="bg-purple-950/80 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black text-white shadow-2xs">
          ${subtotal.toFixed(2)}
        </span>
      </button>
    </div>
  );
}
