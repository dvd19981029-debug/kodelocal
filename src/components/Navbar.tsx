'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Store, 
  Package, 
  ReceiptText, 
  Truck, 
  Settings, 
  Sparkles,
  Layers,
  CircleDot
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/pos', label: 'Punto de Venta', icon: Store },
    { href: '/inventario', label: 'Inventario', icon: Package },
    { href: '/ventas', label: 'Ventas & DTE', icon: ReceiptText },
    { href: '/logistica', label: 'Envíos & Logística', icon: Truck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#f1f4f9]/80 border-b border-white/60 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo with Claymorphic Badge */}
        <Link href="/pos" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-[4px_6px_12px_rgba(99,102,241,0.4),inset_2px_2px_3px_rgba(255,255,255,0.6),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-800">KodeLocal</span>
              <span className="clay-badge bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 border border-indigo-100">
                CLAY OS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">POS • Inventario • Factura Llama</p>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 shadow-[inset_2px_2px_5px_rgba(164,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] border border-white/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`clay-btn px-4 py-2 text-sm rounded-xl transition-all ${
                  isActive
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.4)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges */}
        <div className="flex items-center gap-3">
          {/* Factura Llama Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-[2px_3px_6px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">DTE El Salvador:</span>
            <span className="font-bold">Factura Llama</span>
          </div>

          {/* Quick Cash Register Status */}
          <div className="clay-badge bg-amber-50 text-amber-700 border border-amber-200 text-xs py-1 px-3 hidden lg:flex items-center gap-1.5">
            <CircleDot className="w-3.5 h-3.5 text-amber-500" />
            <span>Caja 1: <strong>Abierta</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
}
