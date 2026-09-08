'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';

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

  // Bloquear el scroll de fondo mientras el carrito esté abierto
  useEffect(() => {
    if (!isCartOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cerrar al presionar la tecla Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop oscuro con clic para cerrar */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
        title="Clic fuera para cerrar y seguir comprando"
      />

      {/* Contenedor del Drawer pegado a la derecha sin desbordes */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full flex">
        <div className="w-full h-full bg-[#f1f4f9] shadow-2xl flex flex-col border-l border-white/80 relative z-10 overscroll-contain">
          
          {/* Header del Carrito con botón Cerrar evidente */}
          <div className="p-3.5 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-white/70 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">Tu Carrito de Fragancias</h3>
                <p className="text-[11px] text-slate-500 font-semibold">{totalItems} artículo{totalItems === 1 ? '' : 's'}</p>
              </div>
            </div>

            {/* Botón de Cerrar claro y visible con texto e icono */}
            <button
              onClick={() => setIsCartOpen(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
              aria-label="Cerrar carrito"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Cerrar</span>
            </button>
          </div>

          {/* Lista de Productos Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 overscroll-contain">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center shadow-inner">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Tu carrito está vacío</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Explora nuestro catálogo de contratipos finos y agrega tus fragancias favoritas.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="clay-btn clay-btn-primary px-5 py-2 text-xs rounded-xl mt-2 font-bold cursor-pointer"
                >
                  Explorar Fragancias
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const productImage = getProductImage(item.product);
                const displayName = item.product.officialName?.trim() ? item.product.officialName : item.product.name;

                return (
                  <div 
                    key={item.id}
                    className="clay-card p-3 sm:p-3.5 flex flex-col gap-2.5 bg-white border border-slate-100 rounded-2xl relative group shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      {/* Miniatura visual de la fragancia / producto */}
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/70 shrink-0 flex items-center justify-center shadow-2xs">
                        <img
                          src={productImage}
                          alt={displayName}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&q=80';
                          }}
                          className="w-full h-full object-cover object-center"
                        />
                        {item.kitDetails && (
                          <span className="absolute bottom-0 inset-x-0 bg-indigo-950/85 text-[8px] sm:text-[8.5px] font-black text-white text-center py-0.5 tracking-tight">
                            Kit 100ml
                          </span>
                        )}
                      </div>

                      {/* Información de la fragancia */}
                      <div className="flex-1 min-w-0 pr-0.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            {item.product.brand && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                                {item.product.brand}
                              </span>
                            )}
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-snug truncate" title={displayName}>
                              {displayName}
                            </h4>
                            {item.product.officialName && (
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                Inspirado en {item.product.name}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Quitar del carrito"
                            aria-label="Quitar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Detalles de presentación o kit limpio */}
                        {item.kitDetails ? (
                          <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] space-y-0.5 text-slate-700">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-indigo-700">
                                {item.kitDetails.isPlus ? 'Perfume Preparado PLUS (100ml)' : 'Perfume Preparado (100ml)'}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                                item.kitDetails.isPlus 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300/60' 
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {item.kitDetails.isPlus ? '1.5 Onzas PLUS' : '1 Onza'}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-slate-500 truncate">
                              Frasco: <strong className="text-slate-700">{item.kitDetails.bottleName}</strong> • {item.kitDetails.hasLabel ? 'Con etiqueta' : 'Sin etiqueta'}
                            </p>
                          </div>
                        ) : item.selectedBottle ? (
                          <div className="mt-1 flex items-center justify-between text-[10.5px]">
                            <span className="font-bold text-indigo-600">{item.presentationName}</span>
                            <span className="text-[9.5px] text-slate-500 truncate">Frasco: {item.selectedBottle.name}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] font-semibold text-indigo-600 mt-1">
                            {item.presentationName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Fila inferior: Cantidad y Precio */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      {/* Control de cantidad */}
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1 border border-slate-200/80 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white font-bold cursor-pointer transition-colors"
                          aria-label="Disminuir una unidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-black text-slate-800 w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white font-bold cursor-pointer transition-colors"
                          aria-label="Aumentar una unidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Precio alineado */}
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black font-mono text-slate-900">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[9.5px] text-slate-400 block font-mono">
                            (${item.unitPrice.toFixed(2)} c/u)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del Carrito con Subtotal, Pago Seguro y botón Seguir Comprando */}
          {cart.length > 0 && (
            <div className="p-3.5 sm:p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-sm space-y-2.5 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono font-black text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Envío nacional C807:</span>
                  <span className="text-emerald-700 font-bold">Calculado al pagar</span>
                </div>
                <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200/70">
                  <span>Total estimado:</span>
                  <span className="font-mono font-black text-indigo-700 text-base">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón Principal: Proceder a pago seguro */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="clay-btn clay-btn-primary w-full py-3 text-xs sm:text-sm font-black rounded-xl flex items-center justify-center gap-2 !shadow-[0_4px_16px_rgba(99,102,241,0.4)] tracking-wide cursor-pointer active:scale-95"
              >
                <span>Proceder a pago seguro</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Botón Explícito: Seguir Comprando / Agregar más */}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-black text-slate-700 bg-white hover:bg-slate-50 border-2 border-slate-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>Seguir Comprando (Agregar más)</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Compra segura con envíos C807 en El Salvador</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
