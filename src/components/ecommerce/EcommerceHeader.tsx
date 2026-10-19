'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, ChevronDown } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useScrolled } from '@/hooks/useScrolled';

export default function EcommerceHeader() {
  const pathname = usePathname();
  const { totalItems, subtotal, setIsCartOpen, isCartPulsing } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal, openDrawer } = useCustomerAuth();
  const isScrolled = useScrolled(75);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('reset-home-page'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md bg-gradient-to-r from-[#fff7ed]/95 via-[#ffedd5]/95 to-[#fff7ed]/95 border-b-2 border-orange-400/60 px-3 sm:px-6 py-2 sm:py-2.5 shadow-[0_4px_16px_rgba(234,88,12,0.12)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      isScrolled ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'
    }`}>
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center relative">
        
        {/* ================= LADO IZQUIERDO: Botón de Usuario / Mi Cuenta ================= */}
        <div className="flex items-center justify-start gap-2">
          {isLoggedIn && customer ? (
            <button
              onClick={() => openDrawer('orders')}
              className="flex items-center gap-1.5 sm:gap-2 py-1 px-2 sm:px-2.5 rounded-xl bg-white/95 hover:bg-orange-50 hover:border-orange-400 border border-orange-200 shadow-2xs transition-all text-left cursor-pointer active:scale-95 group"
              title="Ver mi perfil y pedidos"
            >
              {customer.avatarUrl ? (
                <img
                  src={customer.avatarUrl}
                  alt={customer.name}
                  className="w-6 h-6 rounded-full object-cover border border-orange-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-black">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-black text-slate-800 hidden sm:inline truncate max-w-[90px]">
                {customer.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-orange-600 transition-colors" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-orange-800 bg-orange-100/90 hover:bg-orange-200/80 border border-orange-300 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="hidden sm:inline font-black">🎃 Mi Cuenta</span>
            </button>
          )}
        </div>

        {/* ================= CENTRO: Logo oficial de Aromaniak con detalle Halloween ================= */}
        <div className="flex items-center justify-center">
          <Link 
            href="/" 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center gap-1.5 group transition-transform active:scale-95 py-0.5 cursor-pointer relative"
          >
            <span className="hidden sm:inline-block text-lg select-none -rotate-12 group-hover:rotate-0 transition-transform" aria-hidden="true">🕸️</span>
            <img
              src="/images/logo.png"
              alt="Aromaniak"
              fetchPriority="high"
              decoding="async"
              className="h-11 sm:h-14 md:h-16 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="hidden sm:inline-block text-lg select-none rotate-12 group-hover:rotate-0 transition-transform" aria-hidden="true">🎃</span>
          </Link>
        </div>

        {/* ================= LADO DERECHO: Botón de Carrito Temática Calabaza ================= */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsCartOpen(true)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 relative transition-all duration-300 cursor-pointer bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#d97706] text-white border border-orange-300/60 ${
              isCartPulsing
                ? 'scale-105 ring-4 ring-orange-300 shadow-[0_4px_20px_rgba(234,88,12,0.55)]'
                : 'shadow-[2px_4px_12px_rgba(234,88,12,0.35)] hover:brightness-105 active:scale-95'
            }`}
          >
            <span className="text-xs leading-none select-none" aria-hidden="true">🎃</span>
            <ShoppingBag className={`w-4 h-4 text-white transition-transform duration-300 ${isCartPulsing ? '-translate-y-0.5 scale-110' : ''}`} />
            <span className="text-xs font-black hidden sm:inline text-white">Carrito</span>
            {totalItems > 0 && (
              <span className={`px-2 h-5 rounded-full bg-slate-950/85 text-amber-300 border border-orange-400/40 text-[10px] sm:text-[11px] font-black flex items-center justify-center shadow-md transition-all duration-300 ${
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
