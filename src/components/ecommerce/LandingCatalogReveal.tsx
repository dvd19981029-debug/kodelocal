'use client';

import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';

export default function LandingCatalogReveal() {
  const [showCatalog, setShowCatalog] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleReveal = async () => {
    setShowCatalog(true);
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        // Solo mostramos esencias y botes para la landing
        const filtered = data.products.filter(
          (p: ProductItem) => p.category === 'Esencias para Perfume' || p.category === 'Botes'
        );
        setProducts(filtered.slice(0, 24)); // Mostrar los primeros 24
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!showCatalog) {
    return (
      <button 
        onClick={handleReveal}
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:scale-105 hover:bg-indigo-700 transition-all active:scale-95 text-lg"
      >
        Ver Catálogo de Productos
        <ArrowRight className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="w-full mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-white/50 py-10 rounded-3xl border border-slate-200 shadow-xl">
      <div className="flex items-center justify-center gap-2 mb-10">
        <Sparkles className="w-6 h-6 text-indigo-500" />
        <h2 className="text-3xl font-black text-slate-800">Catálogo Premium</h2>
        <Sparkles className="w-6 h-6 text-indigo-500" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-10 text-left">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      {!loading && products.length > 0 && (
        <div className="mt-16 text-center">
          <a href="/" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
            Ver todo el inventario en la tienda
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      )}
    </div>
  );
}
