'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import EcommerceHeader from '@/components/ecommerce/EcommerceHeader';
import BlogHeader from '@/components/blog/BlogHeader';
import PromoTickerBar from '@/components/ecommerce/PromoTickerBar';
import EcommerceFooter from '@/components/ecommerce/EcommerceFooter';
import CartDrawer from '@/components/ecommerce/CartDrawer';
import CustomerDrawer from '@/components/ecommerce/CustomerDrawer';
import CustomerAuthModal from '@/components/ecommerce/CustomerAuthModal';
import { EcommerceCartProvider } from '@/context/EcommerceCartContext';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Rutas operativas del sistema interno (empleados, cajeros, bodegueros, admin)
  const isOperationalRoute = 
    pathname.startsWith('/pos') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/bodega') ||
    pathname.startsWith('/ventas') ||
    pathname.startsWith('/inventario') ||
    pathname.startsWith('/logistica');

  const isKodeRoute = pathname.startsWith('/kode');
  const isLoginPage = pathname === '/login';
  const isBlogRoute = pathname.startsWith('/blog');

  return (
    <CustomerAuthProvider>
      <EcommerceCartProvider>
        {!isKodeRoute && <CartDrawer />}
        {!isKodeRoute && <CustomerDrawer />}
        {!isKodeRoute && <CustomerAuthModal />}

      {isKodeRoute ? (
        // En KODE: Sistema totalmente independiente (marca paralela sin mezclar con Aromaniak)
        <main className="flex-1 w-full min-h-screen bg-slate-950 text-slate-100">{children}</main>
      ) : isLoginPage ? (
        // En login solo se muestra el contenido limpio
        <main className="flex-1 w-full">{children}</main>
      ) : isOperationalRoute ? (
        // En rutas operativas se muestra la barra de navegación administrativa de empleados
        <>
          <Navbar />
          <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6">
            {children}
          </main>
        </>
      ) : isBlogRoute ? (
        // En el Blog: Cabecera con opciones hacia el ecommerce, sin barra de promociones
        <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
          <BlogHeader />
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
            {children}
          </main>
          <EcommerceFooter />
        </div>
      ) : (
        // En la tienda pública (E-commerce) se muestra la cabecera original, barra de promociones y pie de Aromaniak
        <div className="flex flex-col min-h-screen">
          <EcommerceHeader />
          <PromoTickerBar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
            {children}
          </main>
          <EcommerceFooter />
        </div>
      )}
      </EcommerceCartProvider>
    </CustomerAuthProvider>
  );
}

