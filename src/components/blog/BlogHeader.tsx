// src/components/blog/BlogHeader.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, ChevronDown, Menu, X, Sparkles, Wand2, Briefcase, Compass, FileDown, Loader2, LogIn } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { getCurrentCatalogMonthYear } from '@/lib/aromaniakCatalogPdf';

export default function BlogHeader() {
  const { totalItems, subtotal, setIsCartOpen, isCartPulsing } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal, openDrawer } = useCustomerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  const { label: monthYearLabel } = getCurrentCatalogMonthYear();

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  const handleDownloadCatalog = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const { downloadLiveAromaniakCatalogPdf } = await import('@/lib/aromaniakCatalogPdf');
      await downloadLiveAromaniakCatalogPdf();
    } catch {
      window.open('/catalogo-aromaniak.pdf', '_blank');
    } finally {
      setIsDownloadingPdf(false);
      setIsProfileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#f1f4f9]/95 border-b border-white/80 px-3 sm:px-6 py-2 sm:py-2.5 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ================= LADO IZQUIERDO: Logo Oficial Aromaniak ================= */}
        <div className="flex items-center gap-3">
          {/* Botón menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/90 border border-slate-200/80 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link href="/" className="inline-flex items-center group transition-transform active:scale-95 py-0.5">
            <img
              src="/images/logo.png"
              alt="Aromaniak"
              className="h-10 sm:h-12 md:h-13 w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            />
          </Link>
        </div>

        {/* ================= CENTRO: Enlaces que llevan al E-commerce ================= */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl text-xs lg:text-sm font-bold text-slate-700 hover:text-purple-700 hover:bg-white/80 transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-purple-600" />
            Productos
          </Link>

          <Link
            href="/?categoria=Arma+tu+perfume"
            className="px-3 py-1.5 rounded-xl text-xs lg:text-sm font-bold text-slate-700 hover:text-purple-700 hover:bg-white/80 transition-all flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-500" />
            Arma tu Perfume
          </Link>

          <Link
            href="/blog/como-vender-perfumes-desde-casa-el-salvador-e3de2e19"
            className="px-3 py-1.5 rounded-xl text-xs lg:text-sm font-bold text-slate-700 hover:text-purple-700 hover:bg-white/80 transition-all flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            Emprende con Nosotros
          </Link>

          <Link
            href="/blog"
            className="px-3 py-1.5 rounded-xl text-xs lg:text-sm font-black text-purple-900 bg-purple-100/80 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            Blog
          </Link>
        </nav>

        {/* ================= LADO DERECHO: Mi Cuenta y Carrito ================= */}
        <div className="flex items-center justify-end gap-2">
          {/* Mi Cuenta */}
          <div ref={profileContainerRef} className="relative">
            <button
              id="blog-profile-menu-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={
                isLoggedIn && customer
                  ? 'flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-xl bg-white/95 hover:bg-white hover:border-indigo-300 border border-slate-200/80 shadow-2xs transition-all text-left cursor-pointer active:scale-95 group'
                  : 'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-indigo-700 bg-indigo-50/95 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer'
              }
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
                  <span className="text-[11px] font-black text-slate-800 hidden lg:inline truncate max-w-[80px]">
                    {customer.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline font-black">Mi Cuenta</span>
                  <ChevronDown className={`w-3 h-3 text-indigo-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl bg-white/98 backdrop-blur-md border border-slate-200/90 shadow-[0_14px_34px_rgba(15,23,42,0.14)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div
                  {...({ focusgroup: 'menu nomemory' } as any)}
                  role="menu"
                  aria-labelledby="blog-profile-menu-trigger"
                  className="flex flex-col"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
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

          {/* Botón Carrito de Compras de Aromaniak */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`clay-btn clay-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 relative transition-all duration-300 cursor-pointer ${
              isCartPulsing
                ? 'scale-105 ring-4 ring-purple-300 shadow-[0_4px_20px_rgba(124,58,237,0.45)]'
                : '!shadow-[2px_4px_12px_rgba(124,58,237,0.3)] active:scale-95'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 text-white transition-transform duration-300 ${isCartPulsing ? '-translate-y-0.5 scale-110' : ''}`} />
            <span className="text-xs font-black hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <span className="px-2 h-5 rounded-full bg-purple-950/85 text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center shadow-md">
                ${subtotal.toFixed(2)}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* ================= MENÚ MÓVIL DESPLEGABLE ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 pt-3 pb-2 border-t border-slate-200/80 flex flex-col space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-white bg-slate-50/50"
          >
            <Compass className="w-4 h-4 text-purple-600" />
            Ver Catálogo de Productos
          </Link>
          <Link
            href="/?categoria=Arma+tu+perfume"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-white bg-slate-50/50"
          >
            <Wand2 className="w-4 h-4 text-amber-500" />
            Arma tu Perfume (100ml)
          </Link>
          <Link
            href="/blog/como-vender-perfumes-desde-casa-el-salvador-e3de2e19"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-white bg-slate-50/50"
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Emprende con Nosotros (Mayoreo)
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-purple-900 bg-purple-100"
          >
            <Sparkles className="w-4 h-4 text-purple-700" />
            Blog Aromaniak SV
          </Link>
        </div>
      )}
    </header>
  );
}
