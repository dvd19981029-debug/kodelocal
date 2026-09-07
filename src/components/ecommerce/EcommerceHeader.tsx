'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, Phone } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';

export default function EcommerceHeader() {
  const { totalItems, setIsCartOpen } = useEcommerceCart();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#f1f4f9]/85 border-b border-white/70 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Logo de Aromaniak */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-[4px_6px_14px_rgba(99,102,241,0.35),inset_2px_2px_3px_rgba(255,255,255,0.6),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-slate-900">
                Aromaniak
              </span>
              <span className="clay-badge bg-pink-50 text-pink-700 text-[10px] px-2 py-0.5 border border-pink-100 font-extrabold tracking-tight">
                SV
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
              Perfumería Fina • Contratipos de Lujo
            </p>
          </div>
        </Link>

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

          {/* Botón Carrito de Compras */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="clay-btn clay-btn-primary px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-2 relative !shadow-[3px_4px_12px_rgba(99,102,241,0.35)] active:scale-95 transition-transform"
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
