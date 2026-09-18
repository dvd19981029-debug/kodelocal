'use client';

import { useState, useEffect } from 'react';
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts, saveStoredProducts } from '@/lib/store';

/**
 * Hook para mantener el catálogo de productos y precios sincronizado en tiempo real
 * con las existencias y modificaciones del POS y de la base de datos Supabase.
 */
export function useLiveProducts(initialProducts?: ProductItem[]) {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts;
    if (typeof window !== 'undefined') {
      const stored = getStoredProducts();
      if (stored && stored.length > 0) return stored;
    }
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    let isMounted = true;

    // 1. Cargar datos locales del POS si están disponibles para actualización inmediata
    if (typeof window !== 'undefined') {
      const stored = getStoredProducts();
      if (stored && stored.length > 0) {
        setProducts(stored);
      }
    }

    // 2. Sincronizar con la API de productos para obtener cambios recientes del POS/DB
    fetch('/api/products?fresh=true')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          saveStoredProducts(data.products);
        }
      })
      .catch((err) => console.error('Error sincronizando productos en vivo:', err));

    // 3. Escuchar eventos en tiempo real emitidos por ventas o cambios de precios en el POS
    const handleUpdate = () => {
      if (isMounted && typeof window !== 'undefined') {
        const fresh = getStoredProducts();
        if (fresh && fresh.length > 0) {
          setProducts(fresh);
        }
      }
    };

    window.addEventListener('kodelocal_products_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('kodelocal_products_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return products;
}
