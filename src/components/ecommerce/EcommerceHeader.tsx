'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, ChevronDown, FileDown, Loader2, LogIn } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useScrolled } from '@/hooks/useScrolled';
import { getCurrentCatalogMonthYear } from '@/lib/aromaniakCatalogPdf';

export default function EcommerceHeader() {
  const pathname = usePathname();
  const { totalItems, subtotal, setIsCartOpen, isCartPulsing } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal, openDrawer } = useCustomerAuth();
  const isScrolled = useScrolled(75);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuGroupRef = useRef<HTMLDivElement>(null);

  const { label: monthYearLabel } = getCurrentCatalogMonthYear();

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key) && menuGroupRef.current) {
        const items = Array.from(
          menuGroupRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        );
        if (items.length === 0) return;
        e.preventDefault();
        const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement);
        let nextIdx = 0;
        if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = items.length - 1;
        else if (currentIdx < 0) nextIdx = e.key === 'ArrowUp' ? items.length - 1 : 0;
        else {
          nextIdx = (currentIdx + (e.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
        }
        items[nextIdx]?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Cerrar menú cuando el header se oculta al hacer scroll
  useEffect(() => {
    if (isScrolled && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isScrolled, isMenuOpen]);

  const handleDownloadCatalog = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const { downloadLiveAromaniakCatalogPdf } = await import('@/lib/aromaniakCatalogPdf');
      await downloadLiveAromaniakCatalogPdf();
    } catch (err) {
      console.error('Error al generar catálogo PDF:', err);
      window.open('/catalogo-aromaniak.pdf', '_blank');
    } finally {
      setIsDownloadingPdf(false);
      setIsMenuOpen(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('kodelocal_ecommerce_catalog_state_v1');
        sessionStorage.removeItem('kodelocal_ecommerce_return_scroll_v1');
      } catch {}
    }
    if (pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('reset-home-page'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full bg-[#f1f4f9]/90 backdrop-blur-md border-b border-white/80 shadow-2xs transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      isScrolled ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'
    }`}>
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center relative px-3 sm:px-6 py-2 sm:py-2.5">
        
        {/* ================= LADO IZQUIERDO: Botón de Usuario / Mi Cuenta + Descarga Catálogo ================= */}
        <div ref={containerRef} className="relative flex items-center justify-start gap-2">
          <button
            ref={triggerRef}
            id="profile-menu-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={
              isLoggedIn && customer
                ? 'flex items-center gap-1.5 sm:gap-2 py-1 px-2 sm:px-2.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 hover:border-indigo-300 shadow-2xs transition-all text-left cursor-pointer active:scale-95 group'
                : 'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-indigo-700 bg-indigo-50/95 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer group'
            }
            title="Opciones de cuenta y catálogo PDF"
          >
            {isLoggedIn && customer ? (
              <>
                {customer.avatarUrl ? (
                  <img
                    src={customer.avatarUrl}
                    alt={customer.name}
                    className="w-6 h-6 rounded-full object-cover border border-indigo-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] font-black text-slate-800 hidden sm:inline truncate max-w-[90px]">
                  {customer.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                <span className="hidden sm:inline">Mi Cuenta</span>
                <ChevronDown className={`w-3 h-3 text-indigo-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 sm:w-72 rounded-2xl bg-white/98 backdrop-blur-md border border-slate-200/90 shadow-[0_14px_34px_rgba(15,23,42,0.14)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div
                ref={menuGroupRef}
                {...({ focusgroup: 'menu nomemory' } as any)}
                role="menu"
                aria-labelledby="profile-menu-trigger"
                className="flex flex-col"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (isLoggedIn && customer) {
                      openDrawer('orders');
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-indigo-50/80 focus-visible:bg-indigo-50 focus-visible:outline-none transition-colors cursor-pointer group"
                >
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {isLoggedIn && customer ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      {isLoggedIn && customer ? 'Mi Perfil y Pedidos' : 'Iniciar Sesión'}
                    </span>
                    <span className="block text-[10.5px] font-medium text-slate-500 truncate mt-0.5">
                      {isLoggedIn && customer ? 'Ver compras y datos de envío' : 'Acceder o crear tu cuenta'}
                    </span>
                  </div>
                </button>

                <hr className="border-slate-100 my-1" />

                <button
                  type="button"
                  role="menuitem"
                  disabled={isDownloadingPdf}
                  onClick={handleDownloadCatalog}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-purple-50/85 focus-visible:bg-purple-50 focus-visible:outline-none transition-colors cursor-pointer group disabled:opacity-65"
                >
                  <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                    {isDownloadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      {isDownloadingPdf ? 'Generando Catálogo PDF...' : 'Descargar Catálogo PDF'}
                    </span>
                    <span className="block text-[10.5px] font-semibold text-purple-700 truncate mt-0.5">
                      {monthYearLabel} • Hombre, Mujer y Unisex
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= CENTRO: Logo oficial de Aromaniak ================= */}
        <div className="flex items-center justify-center">
          <Link 
            href="/" 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center gap-1.5 group transition-transform active:scale-95 py-0.5 cursor-pointer relative"
          >
            <img
              src="/images/logo.png"
              alt="Aromaniak"
              fetchPriority="high"
              decoding="async"
              className="h-11 sm:h-14 md:h-16 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
          </Link>
        </div>

        {/* ================= LADO DERECHO: Botón de Carrito ================= */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsCartOpen(true)}
            className={`clay-btn clay-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 relative transition-all duration-300 cursor-pointer ${
              isCartPulsing
                ? 'scale-105 ring-4 ring-purple-300 shadow-[0_4px_20px_rgba(124,58,237,0.45)]'
                : '!shadow-[2px_4px_12px_rgba(124,58,237,0.3)] hover:brightness-105 active:scale-95'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 text-white transition-transform duration-300 ${isCartPulsing ? '-translate-y-0.5 scale-110' : ''}`} />
            <span className="text-xs font-black hidden sm:inline text-white">Carrito</span>
            {totalItems > 0 && (
              <span className={`px-2 h-5 rounded-full bg-purple-950/85 text-white border border-purple-400/30 text-[10px] sm:text-[11px] font-black flex items-center justify-center shadow-md transition-all duration-300 ${
                isCartPulsing ? 'scale-115 ring-2 ring-white' : ''
              }`}>
                ${subtotal.toFixed(2)}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
