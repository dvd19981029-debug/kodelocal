'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Sparkles, Phone, User, LogOut, ChevronDown } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function EcommerceHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [hasScrolled, setHasScrolled] = useState(false);
  const { totalItems, setIsCartOpen } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal, logout } = useCustomerAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHomePage) {
      setHasScrolled(true);
      return;
    }
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#f1f4f9]/85 border-b border-white/70 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Logo oficial de Aromaniak (en la página principal se oculta arriba para dar protagonismo al logo central) */}
        <div className={`transition-all duration-300 flex items-center ${
          isHomePage && !hasScrolled 
            ? 'opacity-0 pointer-events-none -translate-x-2 w-0 overflow-hidden' 
            : 'opacity-100 translate-x-0 w-auto'
        }`}>
          <Link href="/" className="flex items-center group transition-transform active:scale-95 py-0.5">
            <img
              src="/images/logo.png"
              alt="Aromaniak"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain drop-shadow-xs"
            />
          </Link>
        </div>

        {/* Enlaces de Navegación Rápida */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-white/60 shadow-[inset_2px_2px_5px_rgba(164,177,198,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] border border-white/80">
          <Link 
            href="/#catalogo" 
            className="px-4 py-2 text-xs font-black text-slate-700 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-all"
          >
            Catálogo Completo
          </Link>
          <Link 
            href="/#catalogo?genero=Caballero" 
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-all"
          >
            🧔 Caballeros
          </Link>
          <Link 
            href="/#catalogo?genero=Dama" 
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-all"
          >
            👩 Damas
          </Link>
          <Link 
            href="/#catalogo?genero=Unisex" 
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-all"
          >
            ⚧ Unisex
          </Link>
          <Link 
            href="/#catalogo?categoria=Botes" 
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-all"
          >
            🧴 Envases
          </Link>
        </nav>

        {/* Acciones: WhatsApp, Carrito y Acceso a POS */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Asesoría por WhatsApp */}
          <a
            href="https://wa.me/50370000000?text=Hola%20Aromaniak,%20deseo%20consultar%20por%20una%20fragancia"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-sm"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Asesoría WhatsApp</span>
          </a>

          {/* Botón de Autenticación / Perfil de Cliente */}
          {isLoggedIn && customer ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white/90 hover:bg-white border border-slate-200 shadow-2xs transition-all text-left cursor-pointer"
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
                <div className="hidden md:block">
                  <span className="text-[11px] font-black text-slate-800 block leading-tight">
                    {customer.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 block leading-none">
                    Cliente VIP
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Menú Desplegable */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 truncate">{customer.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{customer.email}</p>
                    {customer.department && (
                      <p className="text-[10px] text-indigo-600 font-bold mt-0.5">📍 {customer.department}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Iniciar Sesión</span>
            </button>
          )}

          {/* Botón Carrito de Compras */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="clay-btn clay-btn-primary px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-2 relative !shadow-[3px_4px_12px_rgba(99,102,241,0.35)] active:scale-95 transition-transform cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="text-xs font-extrabold hidden sm:inline">Mi Carrito</span>
            {totalItems > 0 && (
              <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
