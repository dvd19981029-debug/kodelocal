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
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md bg-[#f1f4f9]/90 border-b border-white/80 px-3 sm:px-6 py-2 sm:py-2.5 shadow-2xs transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      isScrolled ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'
    }`}>
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
        
        {/* ================= LADO IZQUIERDO: Botón de Usuario / Mi Cuenta ================= */}
        <div className="flex items-center justify-start gap-2">
          {isLoggedIn && customer ? (
            <button
              onClick={() => openDrawer('orders')}
              className="flex items-center gap-1.5 sm:gap-2 py-1 px-2 sm:px-2.5 rounded-xl bg-white/95 hover:bg-white hover:border-indigo-300 border border-slate-200/80 shadow-2xs transition-all text-left cursor-pointer active:scale-95 group"
              title="Ver mi perfil y pedidos"
            >
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
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-indigo-700 bg-indigo-50/95 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline font-black">Mi Cuenta</span>
            </button>
          )}
        </div>

        {/* ================= CENTRO: Logo oficial de Aromaniak ================= */}
        <div className="flex items-center justify-center">
          <Link 
            href="/" 
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center group transition-transform active:scale-95 py-0.5 cursor-pointer"
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
          {/* Botón Carrito de Compras con Animación Suave y Elegante */}
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
              <span className={`px-2 h-5 rounded-full bg-purple-950/85 text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center shadow-md transition-all duration-300 ${
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
