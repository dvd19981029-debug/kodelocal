'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Phone, User, LogOut, ChevronDown } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function EcommerceHeader() {
  const { totalItems, setIsCartOpen, isCartPulsing } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal, logout } = useCustomerAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#f1f4f9]/90 border-b border-white/80 px-3 sm:px-6 py-2 sm:py-2.5 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
        
        {/* ================= LADO IZQUIERDO: Botón de Usuario / Mi Cuenta ================= */}
        <div className="flex items-center justify-start gap-2">
          {isLoggedIn && customer ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 py-1 px-2 sm:px-2.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200/80 shadow-2xs transition-all text-left cursor-pointer active:scale-95"
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
                <span className="text-[11px] font-black text-slate-800 hidden sm:inline truncate max-w-[80px]">
                  {customer.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Menú Desplegable */}
              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-indigo-700 bg-indigo-50/95 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline font-black">Mi Cuenta</span>
            </button>
          )}

          {/* Asesoría por WhatsApp en pantallas medianas / grandes */}
          <a
            href="https://wa.me/50370000000?text=Hola%20Aromaniak,%20deseo%20consultar%20por%20una%20fragancia"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Asesoría</span>
          </a>
        </div>

        {/* ================= CENTRO: Logo oficial de Aromaniak MÁS GRANDE Y CENTRADO ================= */}
        <div className="flex items-center justify-center">
          <Link href="/" className="inline-flex items-center justify-center group transition-transform active:scale-95 py-0.5">
            <img
              src="/images/logo.png"
              alt="Aromaniak"
              className="h-11 sm:h-14 md:h-16 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
          </Link>
        </div>

        {/* ================= LADO DERECHO: Botón de Carrito (+ WhatsApp en móvil) ================= */}
        <div className="flex items-center justify-end gap-2">
          {/* Asesoría WhatsApp en móvil */}
          <a
            href="https://wa.me/50370000000?text=Hola%20Aromaniak,%20deseo%20consultar%20por%20una%20fragancia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex md:hidden items-center justify-center p-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs active:scale-95 transition-transform"
            title="Asesoría WhatsApp"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>

          {/* Botón Carrito de Compras con Palpitación Animada */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`clay-btn clay-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 relative transition-all duration-300 cursor-pointer ${
              isCartPulsing
                ? 'scale-110 !bg-gradient-to-r !from-pink-500 !via-purple-600 !to-indigo-600 !shadow-[0_0_24px_rgba(236,72,153,0.7)] ring-4 ring-pink-300/80 animate-pulse'
                : '!shadow-[2px_4px_12px_rgba(99,102,241,0.35)] active:scale-95'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 text-white transition-transform ${isCartPulsing ? 'scale-125 rotate-12' : ''}`} />
            <span className="text-xs font-black hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <span className={`w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center shadow-md transition-all ${
                isCartPulsing ? 'scale-125 bg-pink-600 ring-2 ring-white' : ''
              }`}>
                {totalItems}
              </span>
            )}
            {/* Onda expansiva de palpitación al añadir producto */}
            {isCartPulsing && (
              <span className="absolute inset-0 rounded-xl bg-pink-400/40 animate-ping pointer-events-none" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
