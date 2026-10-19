'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import EcommerceHeader from '@/components/ecommerce/EcommerceHeader';
import PromoTickerBar from '@/components/ecommerce/PromoTickerBar';
import EcommerceFooter from '@/components/ecommerce/EcommerceFooter';
import HalloweenDecorations from '@/components/ecommerce/HalloweenDecorations';
import { EcommerceCartProvider, useEcommerceCart } from '@/context/EcommerceCartContext';
import { CustomerAuthProvider, useCustomerAuth } from '@/context/CustomerAuthContext';

const Navbar = dynamic(() => import('@/components/Navbar').then(m => m.Navbar), { ssr: false });
const BlogHeader = dynamic(() => import('@/components/blog/BlogHeader'), { ssr: false });
const CartDrawer = dynamic(() => import('@/components/ecommerce/CartDrawer'), { ssr: false });
const CustomerDrawer = dynamic(() => import('@/components/ecommerce/CustomerDrawer'), { ssr: false });
const CustomerAuthModal = dynamic(() => import('@/components/ecommerce/CustomerAuthModal'), { ssr: false });

function EcommerceLazyOverlays() {
  const { isCartOpen } = useEcommerceCart();
  const { isDrawerOpen, isAuthModalOpen } = useCustomerAuth();

  return (
    <>
      {isCartOpen && <CartDrawer />}
      {isDrawerOpen && <CustomerDrawer />}
      {isAuthModalOpen && <CustomerAuthModal />}
    </>
  );
}

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
        <div className={!isOperationalRoute && !isKodeRoute && !isLoginPage ? 'halloween-ecommerce-skin' : ''}>
          {!isKodeRoute && <EcommerceLazyOverlays />}
        </div>

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
          <main className="flex-1 max-w-[1600px] w-full mx-auto p-2 sm:p-5 lg:p-6 pb-28 sm:pb-8 overflow-x-clip">
            {children}
          </main>
        </>
      ) : isBlogRoute ? (
        // En el Blog: Cabecera con opciones hacia el ecommerce, sin barra de promociones
        <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden halloween-ecommerce-skin">
          <BlogHeader />
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
            {children}
          </main>
          <EcommerceFooter />
        </div>
      ) : (
        // En la tienda pública (E-commerce) se muestra la barra de promociones en el tope superior, cabecera original y pie de Aromaniak
        <div className="flex flex-col min-h-screen relative halloween-ecommerce-skin">
          {/* Parche visual para el arrastre (rubber-banding) en iOS Safari para el TickerBar */}
          <div className="absolute top-0 left-0 w-full h-[50vh] bg-[#ea580c] -translate-y-full z-0"></div>
          <HalloweenDecorations />
          <PromoTickerBar />
          <EcommerceHeader />
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


