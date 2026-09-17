// src/components/blog/BlogMobileStickyBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check, X } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { getProductUrl } from '@/lib/productUrl';

interface BlogMobileStickyBarProps {
  product: ProductItem;
}

export default function BlogMobileStickyBar({ product }: BlogMobileStickyBarProps) {
  const { addToCart } = useEcommerceCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const handleScroll = () => {
      // Mostrar después de hacer scroll más de 350px
      const scrollY = window.scrollY;
      const shouldShow = scrollY > 350;
      setIsVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (isDismissed || !isVisible) return null;

  const displayName = product.officialName?.trim() || product.name;
  const productImage = getProductImage(product);
  const inspiracionName = getInspiracionPerfumeName(product);
  const price = product.price || 3.75;

  const handleAdd = () => {
    addToCart(product, 'ONZA_COMPLETA', 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
        
        {/* Imagen del producto */}
        <Link href={getProductUrl(product)} className="shrink-0 relative block">
          <img
            src={productImage}
            alt={displayName}
            onError={(e) => {
              e.currentTarget.src = '/images/essence_bottle_blank.webp';
            }}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
          />
        </Link>

        {/* Información resumida */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h5 className="text-xs font-black text-slate-900 truncate leading-tight">
              {displayName}
            </h5>
            <span className="text-[11px] font-black text-indigo-700 shrink-0">
              ${price.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
            Inspirado en {inspiracionName} (1 oz)
          </p>
        </div>

        {/* Botón de compra rápida */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAdd}
            className={`clay-btn clay-btn-primary px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer ${
              justAdded ? 'scale-105' : ''
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>¡Listo!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>

          {/* Botón para cerrar la barra si no desea verla */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar barra"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
