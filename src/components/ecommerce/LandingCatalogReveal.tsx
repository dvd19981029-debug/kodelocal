'use client';

import React, { useState, useEffect } from 'react';
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
        className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform active:scale-95 relative z-10"
      >
        Ver Catálogo de Productos
        <ArrowRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-center gap-2 mb-8">
        <Sparkles className="w-6 h-6 text-amber-400" />
        <h2 className="text-2xl sm:text-3xl font-black text-white">Catálogo Premium</h2>
        <Sparkles className="w-6 h-6 text-amber-400" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 text-left">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      {!loading && products.length > 0 && (
        <div className="mt-12 text-center">
          <a href="/" className="inline-flex items-center gap-2 bg-indigo-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-800 transition-colors">
            Ver todo el inventario en la tienda
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
