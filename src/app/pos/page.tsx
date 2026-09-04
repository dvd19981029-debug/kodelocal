'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Sparkles, 
  AlertCircle,
  X,
  FileCheck,
  Building,
  User,
  Sparkle,
  Droplets,
  Tag
} from 'lucide-react';
import { INITIAL_PRODUCTS, ProductItem, CartItem, SaleRecord, PERFUME_CATEGORIES } from '@/lib/store';

export default function PosPage() {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kodelocal_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Si tiene los productos viejos de tecnología, reiniciamos a esencias de perfumería
          if (parsed.length < 50 || parsed[0]?.category === 'Audio') {
            localStorage.setItem('kodelocal_products', JSON.stringify(INITIAL_PRODUCTS));
            return INITIAL_PRODUCTS;
          }
          return parsed;
        } catch (e) {}
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Esencias para Perfume');
  const [selectedGender, setSelectedGender] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  
  // Modal de Cobro
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'BITCOIN'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [tipoComprobante, setTipoComprobante] = useState<'TICKET' | '01' | '03'>('01');
  
  // Datos de cliente
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteDoc, setClienteDoc] = useState('');
  const [clienteNrc, setClienteNrc] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteGiro, setClienteGiro] = useState('');

  // Proceso de emisión
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);

  // Guardar productos en localStorage
  useEffect(() => {
    localStorage.setItem('kodelocal_products', JSON.stringify(products));
  }, [products]);

  // Filtrado de productos (Optimizado para 600+ esencias)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(product => {
      // Filtro de categoría
      const matchesCat = selectedCategory === 'Todos' || product.category === selectedCategory;
      
      // Filtro de género (solo si es esencia)
      const matchesGender = 
        selectedGender === 'Todos' || 
        (product.gender && product.gender.toLowerCase() === selectedGender.toLowerCase());

      // Búsqueda inteligente por código, contratipo, marca o código de barras
      const matchesQuery = 
        !q ||
        product.sku.toLowerCase() === q ||
        product.name.toLowerCase().includes(q) ||
        (product.brand && product.brand.toLowerCase().includes(q)) ||
        (product.puesto && product.puesto.toLowerCase().includes(q)) ||
        product.barcode.includes(q);

      return matchesCat && matchesGender && matchesQuery;
    });
  }, [products, selectedCategory, selectedGender, searchQuery]);

  // Mostrar un máximo de 60 productos a la vez para rendimiento ultra fluido
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, 60);
  }, [filteredProducts]);

  // Totales del carrito
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Desglose IVA 13% El Salvador
  const ivaCalculado = useMemo(() => {
    return (cartSubtotal - (cartSubtotal / 1.13));
  }, [cartSubtotal]);

  const subtotalNeto = useMemo(() => {
    return cartSubtotal / 1.13;
  }, [cartSubtotal]);

  // Manejo del carrito
  const addToCart = (product: ProductItem) => {
    if (product.stock <= 0) {
      alert('¡Producto sin existencias!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stock máximo alcanzado (${product.stock} disponibles).`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            alert(`Stock máximo alcanzado (${item.product.stock} disponibles).`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Escaneo rápido de código o SKU
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const q = barcodeInput.trim().toLowerCase();
    const found = products.find(p => p.barcode === q || p.sku.toLowerCase() === q);
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      alert(`No se encontró esencia con código: ${barcodeInput}`);
    }
  };

  // Cálculo de cambio
  const parsedCash = parseFloat(cashAmount) || 0;
  const changeAmount = parsedCash >= cartSubtotal ? (parsedCash - cartSubtotal) : 0;

  // Finalizar venta
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const saleNumber = `POS-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
    let dteResponseData: any = null;

    if (tipoComprobante === '01' || tipoComprobante === '03') {
      try {
        const res = await fetch('/api/dte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoDte: tipoComprobante,
            saleId: saleNumber,
            items: cart.map(item => ({
              sku: item.product.sku,
              name: `${item.product.name} (${item.product.unit})`,
              quantity: item.quantity,
              price: item.product.price
            })),
            cliente: {
              nombre: clienteNombre,
              numDocumento: clienteDoc || (tipoComprobante === '01' ? '00000000-0' : ''),
              nrc: clienteNrc,
              correo: clienteEmail,
              direccion: 'San Salvador, El Salvador'
            },
            metodoPago: paymentMethod
          })
        });
        const data = await res.json();
        if (data.success && data.dte) {
          dteResponseData = data.dte;
        }
      } catch (err) {
        console.error('Error al emitir DTE:', err);
      }
    }

    // Descontar inventario
    setProducts(prev => {
      const updated = prev.map(prod => {
        const itemInCart = cart.find(ci => ci.product.id === prod.id);
        if (itemInCart) {
          return { ...prod, stock: prod.stock - itemInCart.quantity };
        }
        return prod;
      });
      return updated;
    });

    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      saleNumber,
      createdAt: new Date().toISOString(),
      total: cartSubtotal,
      subtotal: subtotalNeto,
      ivaTotal: ivaCalculado,
      paymentMethod,
      cashReceived: paymentMethod === 'CASH' ? parsedCash : undefined,
      cashChange: paymentMethod === 'CASH' ? changeAmount : undefined,
      tipoComprobante,
      cliente: {
        nombre: clienteNombre,
        numDocumento: clienteDoc,
        nrc: clienteNrc,
        correo: clienteEmail
      },
      dteInfo: dteResponseData ? {
        codigoGeneracion: dteResponseData.codigoGeneracion,
        numeroControl: dteResponseData.numeroControl,
        selloRecepcion: dteResponseData.selloRecepcion,
        estado: dteResponseData.estado,
        simulated: dteResponseData.simulated,
        mensaje: dteResponseData.mensaje
      } : undefined,
      items: cart.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        total: i.quantity * i.product.price,
        unit: i.product.unit
      }))
    };

    const savedSales = JSON.parse(localStorage.getItem('kodelocal_sales') || '[]');
    localStorage.setItem('kodelocal_sales', JSON.stringify([newSale, ...savedSales]));

    setIsProcessing(false);
    setIsCheckoutOpen(false);
    setCompletedSale(newSale);
    clearCart();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-12">
      
      {/* ================= COLUMNA IZQUIERDA: CATÁLOGO DE PERFUMERÍA ================= */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Barra superior de Búsqueda y Cotizador Rápido */}
        <div className="clay-card p-4 sm:p-5 flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Buscador inteligente */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Buscar por código (100), contratipo (Sauvage), marca o puesto (A1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clay-input has-icon w-full pr-4 py-2.5 text-sm"
              autoFocus
            />
          </div>

          {/* Lector o código rápido */}
          <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-60">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Código o SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="clay-input has-icon w-full pr-4 py-2.5 text-sm font-mono border-indigo-200"
            />
          </form>
        </div>

        {/* Filtro de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['Todos', ...PERFUME_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`clay-btn px-4 py-2 text-xs rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'clay-btn-primary'
                  : 'clay-btn-light'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subfiltro de Género (Especial para Esencias) */}
        {selectedCategory === 'Esencias para Perfume' && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/70 border border-white shadow-[inset_1px_1px_3px_rgba(164,177,198,0.2)]">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-bold px-2">
              <Droplets className="w-3.5 h-3.5 text-indigo-500" />
              <span>Género:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Todos', val: 'Todos' },
                { label: '👨 Caballero', val: 'Caballero' },
                { label: '👩 Dama', val: 'Dama' },
                { label: '⚥ Unisex', val: 'Unisex' }
              ].map(g => (
                <button
                  key={g.val}
                  onClick={() => setSelectedGender(g.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedGender === g.val
                      ? 'bg-indigo-600 text-white shadow-[2px_3px_6px_rgba(99,102,241,0.3)]'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de resultados */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <span>
            Mostrando <strong>{displayedProducts.length}</strong> de <strong>{filteredProducts.length}</strong> productos
          </span>
          <span className="text-indigo-600 font-bold">
            Precio Esencia: $3.25 / Oz
          </span>
        </div>

        {/* Cuadrícula de Productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {displayedProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const itemInCart = cart.find(ci => ci.product.id === product.id);
            const cartQty = itemInCart ? itemInCart.quantity : 0;
            const availableRemaining = Math.max(0, product.stock - cartQty);
            const isLowStock = availableRemaining > 0 && availableRemaining <= product.minStock;

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && availableRemaining > 0 && addToCart(product)}
                className={`clay-card p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                  isOutOfStock || availableRemaining <= 0
                    ? 'opacity-60 grayscale cursor-not-allowed' 
                    : 'clay-card-interactive active:scale-[0.98]'
                }`}
              >
                <div>
                  {/* Header de la tarjeta con Código, Puesto, Stock Badge y Género */}
                  <div className="flex items-center justify-between gap-1 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="clay-badge bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[11px] py-0.5 px-2">
                        #{product.sku}
                      </span>
                      {product.puesto && (
                        <span className="clay-badge bg-amber-50 text-amber-900 border border-amber-200/80 font-mono font-black text-[10px] py-0.5 px-1.5 shadow-sm" title="Puesto / Estante">
                          📍 {product.puesto}
                        </span>
                      )}
                    </div>

                    {/* Stock disponible en tiempo real */}
                    {isOutOfStock || availableRemaining <= 0 ? (
                      <span className="clay-badge bg-rose-50 text-rose-700 border border-rose-200 text-[10px] py-0.5 px-2 font-bold">
                        Agotado
                      </span>
                    ) : isLowStock ? (
                      <span className="clay-badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px] py-0.5 px-2 font-bold">
                        ¡{availableRemaining} {product.unit === 'Onza' ? 'Oz' : 'Un.'}!
                      </span>
                    ) : (
                      <span className="clay-badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] py-0.5 px-2 font-bold">
                        {availableRemaining} {product.unit === 'Onza' ? 'Oz' : 'Un.'}
                      </span>
                    )}

                    {product.gender && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {product.gender}
                      </span>
                    )}
                  </div>

                  {/* Marca comercial inspirada */}
                  {product.brand && (
                    <span className="text-[11px] font-bold text-indigo-500 block truncate">
                      {product.brand}
                    </span>
                  )}

                  {/* Nombre del contratipo */}
                  <h3 className="font-extrabold text-sm text-slate-800 line-clamp-2 leading-snug mt-0.5">
                    {product.name}
                  </h3>
                </div>

                {/* Footer: Unidad, Precio y Botón Agregar */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Por {product.unit === 'Onza' ? 'Oz' : product.unit}
                      </span>
                      {cartQty > 0 && (
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {cartQty} en orden
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-black text-indigo-600">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    availableRemaining <= 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-50 text-indigo-600 shadow-[2px_3px_6px_rgba(99,102,241,0.2),inset_1px_1px_2px_rgba(255,255,255,0.8)] hover:bg-indigo-600 hover:text-white'
                  }`}>
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="clay-card p-12 text-center text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-bold text-base text-slate-700">No se encontró ninguna esencia o producto</p>
            <p className="text-xs mt-1">Prueba buscando por número de código (ej. 100) o parte del nombre.</p>
          </div>
        )}
      </div>

      {/* ================= COLUMNA DERECHA: ORDEN DE VENTA Y COTIZACIÓN ================= */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        <div className="clay-card p-5 flex flex-col h-[calc(100vh-140px)] sticky top-24">
          
          {/* Header del Carrito */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-800 leading-none">Orden Actual</h2>
                <span className="text-[11px] text-slate-400 font-medium">{totalItemsCount} unidades</span>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vaciar
              </button>
            )}
          </div>

          {/* Lista de productos en la orden */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                <Droplets className="w-12 h-12 mb-2 opacity-30 stroke-[1.5] text-indigo-400" />
                <p className="font-bold text-sm text-slate-600">Cotización Vacía</p>
                <p className="text-xs mt-1">Selecciona esencias, botes o empaque para cotizar y cobrar</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.product.id}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-white flex items-center justify-between gap-2.5 shadow-[inset_1px_1px_3px_rgba(164,177,198,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.8)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 font-mono">
                        #{item.product.sku}
                      </span>
                      {item.product.puesto && (
                        <span className="text-[9px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                          📍 {item.product.puesto}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 truncate leading-tight">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ${item.product.price.toFixed(2)} por {item.product.unit}
                    </p>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl shadow-[2px_2px_5px_rgba(164,177,198,0.25)]">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black w-6 text-center text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal del item */}
                  <div className="text-right min-w-[50px]">
                    <span className="font-black text-xs text-slate-800">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desglose de Totales e Impuestos */}
          {cart.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Subtotal (Neto):</span>
                <span>${subtotalNeto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>IVA (13% incluido):</span>
                <span>${ivaCalculado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total a Cobrar:</span>
                <span className="text-indigo-600 text-xl font-extrabold">
                  ${cartSubtotal.toFixed(2)}
                </span>
              </div>

              {/* Botón de Cobro Claymórfico */}
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="clay-btn clay-btn-success w-full py-3.5 text-base mt-2.5 rounded-2xl shadow-[4px_6px_16px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
              >
                <Banknote className="w-5 h-5" />
                <span>Cobrar ${cartSubtotal.toFixed(2)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL DE COBRO Y EMISIÓN DTE ================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
            
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">Finalizar Venta de Perfumería</h3>
            <p className="text-xs text-slate-500 mb-5">Selecciona el comprobante legal y método de pago.</p>

            {/* Selector de Comprobante */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Tipo de Comprobante
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoComprobante('TICKET')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    tipoComprobante === 'TICKET' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  Ticket Local
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComprobante('01')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    tipoComprobante === '01' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  Factura (01)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComprobante('03')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    tipoComprobante === '03' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  Crédito Fiscal (03)
                </button>
              </div>
            </div>

            {/* Datos del Cliente */}
            {(tipoComprobante === '01' || tipoComprobante === '03') && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 mb-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <FileCheck className="w-4 h-4" />
                  <span>Datos Fiscales (Factura Llama - El Salvador)</span>
                </div>
                
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {tipoComprobante === '03' ? 'Razón Social / Empresa *' : 'Nombre del Cliente'}
                  </label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez o Distribuidora S.A. de C.V."
                    className="clay-input w-full text-xs py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {tipoComprobante === '03' ? 'NIT *' : 'DUI o NIT'}
                    </label>
                    <input
                      type="text"
                      value={clienteDoc}
                      onChange={(e) => setClienteDoc(e.target.value)}
                      placeholder="00000000-0"
                      className="clay-input w-full text-xs py-2 font-mono"
                    />
                  </div>

                  {tipoComprobante === '03' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        NRC *
                      </label>
                      <input
                        type="text"
                        value={clienteNrc}
                        onChange={(e) => setClienteNrc(e.target.value)}
                        placeholder="123456-7"
                        className="clay-input w-full text-xs py-2 font-mono"
                      />
                    </div>
                  )}

                  <div className={tipoComprobante === '03' ? 'col-span-2' : ''}>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={(e) => setClienteEmail(e.target.value)}
                      placeholder="cliente@correo.com"
                      className="clay-input w-full text-xs py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Método de Pago */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold ${
                    paymentMethod === 'CASH' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold ${
                    paymentMethod === 'CARD' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold ${
                    paymentMethod === 'TRANSFER' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span>Transf.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BITCOIN')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold ${
                    paymentMethod === 'BITCOIN' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>Bitcoin</span>
                </button>
              </div>
            </div>

            {/* Calculadora de Efectivo */}
            {paymentMethod === 'CASH' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Monto Recibido</label>
                  <span className="text-xs text-slate-500 font-medium">
                    Total: <strong>${cartSubtotal.toFixed(2)}</strong>
                  </span>
                </div>
                
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="clay-input w-full text-xl font-bold py-2 text-center text-slate-800"
                />

                <div className="flex gap-2 mt-2">
                  {[cartSubtotal, 5, 10, 20, 50].map((amt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCashAmount(amt.toFixed(2))}
                      className="clay-btn clay-btn-light text-[11px] py-1.5 px-2 flex-1 rounded-lg"
                    >
                      ${amt.toFixed(2)}
                    </button>
                  ))}
                </div>

                {parsedCash >= cartSubtotal && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                    <span className="font-bold text-slate-700 text-sm">Cambio / Vuelto:</span>
                    <span className="font-black text-emerald-600 text-xl">
                      ${changeAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="clay-btn clay-btn-light flex-1 py-3"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isProcessing || (paymentMethod === 'CASH' && parsedCash < cartSubtotal)}
                onClick={handleCompleteSale}
                className={`clay-btn clay-btn-success flex-1 py-3 text-base shadow-[4px_6px_16px_rgba(16,185,129,0.4)] ${
                  isProcessing || (paymentMethod === 'CASH' && parsedCash < cartSubtotal)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    Emitiendo...
                  </span>
                ) : (
                  <span>Completar Venta</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE RECIBO FINALIZADO ================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-[2px_3px_6px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-800">¡Venta Exitosa!</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{completedSale.saleNumber}</p>
            </div>

            {completedSale.dteInfo && (
              <div className="my-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    DTE-{completedSale.tipoComprobante} Emitido
                  </span>
                  <span className="clay-badge bg-emerald-100 text-emerald-700 text-[10px] py-0.5 px-2">
                    {completedSale.dteInfo.estado}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-600 space-y-0.5">
                  <p><strong>N° Control:</strong> {completedSale.dteInfo.numeroControl}</p>
                  <p className="truncate"><strong>Cód. Gen:</strong> {completedSale.dteInfo.codigoGeneracion}</p>
                  {completedSale.dteInfo.selloRecepcion && (
                    <p className="truncate"><strong>Sello MH:</strong> {completedSale.dteInfo.selloRecepcion}</p>
                  )}
                </div>
              </div>
            )}

            <div className="py-3 text-xs space-y-2 border-b border-dashed border-slate-200">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Cliente:</span>
                <span className="font-bold text-slate-800">{completedSale.cliente.nombre}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Método de Pago:</span>
                <span className="font-bold text-slate-800">{completedSale.paymentMethod}</span>
              </div>
              {completedSale.cashChange !== undefined && (
                <div className="flex justify-between font-medium text-emerald-600">
                  <span>Cambio Entregado:</span>
                  <span className="font-bold">${completedSale.cashChange.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center py-4">
              <span className="text-sm font-bold text-slate-700">Total Cobrado:</span>
              <span className="text-2xl font-black text-indigo-600">
                ${completedSale.total.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="clay-btn clay-btn-light flex-1 py-3 text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir Ticket
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="clay-btn clay-btn-primary flex-1 py-3 text-xs"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
