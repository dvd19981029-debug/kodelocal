'use client';

import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    subtotal,
    totalItems
  } = useEcommerceCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#f1f4f9] shadow-2xl flex flex-col border-l border-white/80">
          
          {/* Header del Carrito */}
          <div className="p-4 sm:p-5 border-b border-white flex items-center justify-between bg-white/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Tu Carrito de Fragancias</h3>
                <p className="text-[11px] text-slate-500 font-semibold">{totalItems} artículo{totalItems === 1 ? '' : 's'}</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Productos */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center shadow-inner">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Tu carrito está vacío</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explora nuestro catálogo de más de 600 contratipos y elige tu presentación favorita.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="clay-btn clay-btn-primary px-5 py-2 text-xs rounded-xl mt-2 font-bold"
                >
                  Ver Fragancias
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="clay-card p-3.5 flex flex-col gap-2.5 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="clay-badge text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md">
                          #{item.product.sku}
                        </span>
                        {item.product.brand && (
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {item.product.brand}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                        {item.presentationName}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                      title="Quitar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {/* Stepper de cantidad */}
                    <div className="flex items-center gap-1.5 bg-white/80 rounded-lg p-1 border border-slate-200/60 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-black text-slate-800 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Precio */}
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-slate-900">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (${item.unitPrice.toFixed(2)} c/u)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer del Carrito con Subtotal y Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-white bg-white/50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono font-black text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Envío:</span>
                  <span className="text-emerald-700 font-bold">Calculado al pagar</span>
                </div>
                <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200/70">
                  <span>Total estimado:</span>
                  <span className="font-mono font-black text-indigo-700 text-base">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="clay-btn clay-btn-primary w-full py-3 text-xs font-black rounded-xl flex items-center justify-center gap-2 !shadow-[3px_4px_12px_rgba(99,102,241,0.4)] tracking-wide"
              >
                <span>Proceder al Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pago seguro al recibir o transferencia</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
