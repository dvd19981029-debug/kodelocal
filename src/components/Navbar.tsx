'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Store, 
  Package, 
  ReceiptText, 
  Truck, 
  Crown, 
  CircleDot,
  LogOut,
  User
} from 'lucide-react';
import { getActiveUser, setActiveUser, UserAccount } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    setCurrentUser(getActiveUser());
  }, [pathname]);

  // Si estamos en la página de login, ocultamos la barra de navegación para una vista limpia
  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    { href: '/pos', label: 'Punto de Venta', icon: Store },
    { href: '/inventario', label: 'Inventario', icon: Package },
    { href: '/ventas', label: 'Ventas & DTE', icon: ReceiptText },
    { href: '/logistica', label: 'Envíos & Logística', icon: Truck },
    { href: '/admin', label: 'Gerencia', icon: Crown, adminOnly: true },
  ];

  const handleLogout = () => {
    setActiveUser(null);
    router.push('/login');
  };

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
              <span className="clay-badge bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 border border-indigo-100 font-bold tracking-tight">
                by Kode Tech
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">POS • Inventario • Factura Llama</p>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/60 shadow-[inset_2px_2px_5px_rgba(164,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] border border-white/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`clay-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center shrink-0 ${
                  isActive
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.4)]'
                    : item.adminOnly 
                    ? 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${item.adminOnly && !isActive ? 'text-indigo-600' : ''}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges & Active User */}
        <div className="flex items-center gap-3">
          
          {/* Factura Llama Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-[2px_3px_6px_rgba(16,185,129,0.15)] hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Factura Llama</span>
          </div>

          {/* Active User Pill & Logout Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-white/80 p-1.5 pl-3 rounded-2xl shadow-[2px_3px_8px_rgba(164,177,198,0.25)] border border-white">
              <div className="text-left">
                <span className="text-xs font-black text-slate-800 block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-bold text-indigo-600">
                  {currentUser.role === 'ADMIN' ? '👑 Gerente' : `🛒 ${currentUser.cashRegister || 'Caja'}`}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Cambiar Usuario / Salir"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="clay-btn clay-btn-primary px-3 py-1.5 text-xs rounded-xl"
            >
              Iniciar Sesión
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
