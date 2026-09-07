'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Check, Wand2 } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts } from '@/lib/store';
import PerfumeKitBuilderModal from '@/components/ecommerce/PerfumeKitBuilderModal';
import { useRouter } from 'next/navigation';

export default function ArmaTuPropioPerfumePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(() => INITIAL_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
          return;
        }
      } catch (err) {
        console.error('Fallback a productos locales:', err);
      }
      const loaded = getStoredProducts();
      setProducts(loaded && loaded.length > 0 ? loaded : INITIAL_PRODUCTS);
    };

    loadCatalog();
  }, []);

  const availableBottles = useMemo(() => {
    const list = products.filter(p => p.category === 'Botes' || p.category === 'Botes & Envases');
    if (list.length > 0) return list;
    return INITIAL_PRODUCTS.filter(p => p.category === 'Botes');
  }, [products]);

  const availableEssences = useMemo(() => {
    return products.filter(p => p.category === 'Esencias para Perfume');
  }, [products]);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen pb-16 pt-4 px-2 sm:px-4 flex flex-col items-center justify-center">
      <PerfumeKitBuilderModal
        isOpen={isModalOpen}
        onClose={handleClose}
        availableEssences={availableEssences}
        availableBottles={availableBottles}
      />

      {/* Vista de respaldo si se cierra el modal */}
      <div className="clay-card p-6 sm:p-8 max-w-lg w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shadow-xs">
          <Wand2 className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Arma tu propio perfume por solo <span className="text-emerald-700 font-mono">$15.00</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          Personaliza tu contratipo favorito en frasco de 100ml con fijador de alta duración y etiqueta gratis.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto clay-btn clay-btn-primary px-6 py-2.5 rounded-full text-xs sm:text-sm font-black text-white"
          >
            Abrir Configurador ($15)
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Volver a la Tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
