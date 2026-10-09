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
  Box,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { getActiveUser, setActiveUser, UserAccount, getStoredRoles, getStoredUsers, CustomRole } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [roles, setRoles] = useState<CustomRole[]>([]);

  useEffect(() => {
    setCurrentUser(getActiveUser());
    setRoles(getStoredRoles());
  }, [pathname]);

  // Si estamos en la página de login, ocultamos la barra de navegación para una vista limpia
  if (pathname === '/login') {
    return null;
  }

  const currentRole = roles.find(r => r.code === currentUser?.role);
  const allowedViews = currentRole ? currentRole.allowedViews : ['pos', 'admin'];

  const macroNavItems = [
    { 
      id: 'admin', 
      href: '/admin', 
      label: 'Administración', 
      icon: Crown, 
      isAdmin: true,
      matchPaths: ['/admin'],
      checkAccess: () => currentUser?.role === 'ADMIN' || allowedViews.includes('admin')
    },
    { 
      id: 'pos', 
      href: '/pos', 
      label: 'Punto de Venta', 
      icon: Store, 
      isAdmin: false,
      matchPaths: ['/pos', '/ventas', '/logistica'],
      checkAccess: () => currentUser?.role === 'ADMIN' || allowedViews.includes('pos') || allowedViews.includes('ventas')
    },
    { 
      id: 'bodega', 
      href: '/bodega', 
      label: 'Bodega & Preparación', 
      icon: Box, 
      isAdmin: false,
      matchPaths: ['/bodega', '/inventario'],
      checkAccess: () => currentUser?.role === 'ADMIN' || allowedViews.includes('bodega') || allowedViews.includes('inventario')
    },
  ];

  // Filtrado dinámico de vistas según los permisos del rol del usuario
  const visibleNavItems = macroNavItems.filter(item => {
    if (currentUser?.role === 'ADMIN') return true;
    return item.checkAccess();
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/kode/auth/logout', { method: 'POST' });
    } catch(e) {}
    if (typeof document !== 'undefined') {
      document.cookie = 'kode_session_ui=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    setActiveUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#f1f4f9]/90 border-b border-white/60 px-3 sm:px-8 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo with Claymorphic Badge */}
        <Link href={currentUser?.role === 'ADMIN' ? '/admin' : '/pos'} className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-[4px_6px_12px_rgba(99,102,241,0.4),inset_2px_2px_3px_rgba(255,255,255,0.6),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform shrink-0">
            K
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-800">KodeLocal</span>
              <span className="clay-badge bg-indigo-50 text-indigo-600 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border border-indigo-100 font-bold tracking-tight whitespace-nowrap">
                by Kode Tech
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 font-medium truncate">POS • Inventario • Factura Llama</p>
          </div>
        </Link>

        {/* Center Navigation: Módulos / Perfiles autorizados (Desktop) */}
        <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 shadow-[inset_2px_2px_5px_rgba(164,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] border border-white/80">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPaths.some(p => pathname.startsWith(p));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`clay-btn px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.4)] ring-2 ring-indigo-400/30'
                    : 'text-slate-600 hover:text-indigo-900 hover:bg-white/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges & Active User */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Factura Llama Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-[2px_3px_6px_rgba(16,185,129,0.15)] hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Factura Llama</span>
          </div>

          {/* Active User Pill & Fast Switcher */}
          {currentUser ? (
            <div className="relative">
              <div 
                onClick={() => setIsSwitchUserOpen(!isSwitchUserOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 bg-white/90 p-1 sm:p-1.5 pl-2 sm:pl-3 rounded-xl sm:rounded-2xl shadow-[2px_3px_8px_rgba(164,177,198,0.25)] border border-white cursor-pointer hover:bg-white transition-all max-w-[170px] sm:max-w-none"
              >
                <div className="text-left min-w-0">
                  <span className="text-[11px] sm:text-xs font-black text-slate-800 block leading-tight truncate">
                    {currentUser.name}
                  </span>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className={`text-[9px] sm:text-[10px] font-black truncate ${
                      currentUser.role === 'ADMIN' ? 'text-purple-600' : 
                      currentUser.role === 'BODEGA' ? 'text-amber-600' : 'text-indigo-600'
                    }`}>
                      {currentRole?.name || currentUser.role}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors ml-0.5 sm:ml-1 shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Selector Rápido de Usuarios para probar roles */}
              {isSwitchUserOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSwitchUserOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 clay-card p-3 z-50 animate-in fade-in zoom-in-95 space-y-1">
                    <Link
                      href="/pos"
                      onClick={() => setIsSwitchUserOpen(false)}
                      className="w-full text-left p-2 rounded-xl text-xs flex items-center gap-2 bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100 transition-colors mb-1"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Ir a Punto de Venta (POS)</span>
                    </Link>

                    <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                      Cambiar de Rol / Usuario:
                    </p>
                    {users.map(u => {
                      const uRole = roles.find(r => r.code === u.role);
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => handleQuickSwitch(u)}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-indigo-50 font-black text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <span className="text-[10px] text-slate-400">{uRole?.name || u.role}</span>
                          </div>
                          {isSelected && <span className="text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
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

      {/* Mobile Navigation Strip (Solo visible en pantallas móviles) */}
      <div className="flex md:hidden items-center gap-1.5 pt-2 border-t border-slate-200/60 mt-1.5 max-w-7xl mx-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPaths.some(p => pathname.startsWith(p));
          const shortLabel = item.id === 'admin' ? 'Admin' : item.id === 'pos' ? 'POS Venta' : 'Bodega';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-xl text-center flex items-center justify-center gap-1.5 transition-all truncate ${
                isActive
                  ? 'clay-btn-primary !shadow-[2px_3px_8px_rgba(79,70,229,0.35)]'
                  : 'bg-white/80 text-slate-600 border border-slate-200/60 shadow-xs'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
