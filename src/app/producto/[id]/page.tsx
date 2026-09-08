'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Check, 
  ShoppingBag, 
  Truck, 
  Droplets, 
  ShieldCheck, 
  Wand2, 
  Sparkles, 
  Plus, 
  Minus, 
  ChevronRight
} from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';
import { getFragranceProfile } from '@/lib/fragranceProfiles';
import PerfumeKitBuilderModal from '@/components/ecommerce/PerfumeKitBuilderModal';
import ProductCard from '@/components/ecommerce/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [products, setProducts] = useState<ProductItem[]>(() => INITIAL_PRODUCTS);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>('ONZA_COMPLETA');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);


  const { cart, addToCart } = useEcommerceCart();

  // 1. Sincronización con catálogo local o API
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
          return;
        }
      } catch (err) {
        console.error('Error cargando catálogo, usando local:', err);
      }

      const stored = getStoredProducts();
      setProducts(stored && stored.length > 0 ? stored : INITIAL_PRODUCTS);
    };

    loadCatalog();
  }, []);

  // 2. Encontrar producto por ID o por SKU
  const product = useMemo(() => {
    if (!productId) return null;
    const decoded = decodeURIComponent(productId).toLowerCase().trim();
    return products.find(p => 
      p.id.toLowerCase() === decoded || 
      String(p.sku || '').toLowerCase() === decoded
    ) || null;
  }, [products, productId]);

  const presentations = useMemo(() => {
    if (!product) return [];
    return getPresentationsForProduct(product);
  }, [product]);

  const activeOption = useMemo(() => {
    return presentations.find(p => p.id === selectedPresentation) || presentations[0];
  }, [presentations, selectedPresentation]);

  const profile = useMemo(() => {
    if (!product) return null;
    return getFragranceProfile(product);
  }, [product]);

  // Lista de botellas para el Kit Builder
  const availableBottles = useMemo(() => {
    const list = products.filter(p => p.category === 'Botes' || p.category === 'Botes & Envases');
    if (list.length > 0) return list;
    return INITIAL_PRODUCTS.filter(p => p.category === 'Botes');
  }, [products]);

  // Lista de esencias disponibles
  const availableEssences = useMemo(() => {
    return products.filter(p => p.category === 'Esencias para Perfume');
  }, [products]);

  // Perfumes relacionados
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && p.category === 'Esencias para Perfume' && (p.gender === product.gender || p.gender === 'Unisex'))
      .slice(0, 4);
  }, [products, product]);

  // Cálculo de inventario restante
  const totalStock = typeof product?.stock === 'number' ? product.stock : 0;
  const isOutOfStock = totalStock <= 0;
  const cartUsed = useMemo(() => {
    if (!product) return 0;
    return cart
      .filter(item => item.product.id === product.id)
      .reduce((acc, item) => {
        if (item.presentation === 'MEDIA_ONZA') return acc + item.quantity * 0.5;
        if (item.presentation === 'ONZA_COMPLETA') return acc + item.quantity * 1.0;
        return acc + item.quantity;
      }, 0);
  }, [cart, product]);

  const remainingStock = Math.max(0, totalStock - cartUsed);
  const requiredStock = selectedPresentation === 'MEDIA_ONZA' ? 0.5 : 1.0;
  const canAddMore = remainingStock >= (requiredStock * quantity);

  if (!product || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-xs">
          <Droplets className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Fragancia no encontrada</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
          No pudimos localizar esta fragancia en nuestro catálogo activo. Es posible que haya cambiado de código o esté en reposición.
        </p>
        <Link
          href="/"
          className="clay-btn clay-btn-primary px-5 py-2.5 rounded-2xl text-xs font-black text-white flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  const productImage = getProductImage(product);
  const displayName = product.officialName?.trim() ? product.officialName : product.name;

  const handleAddToCart = () => {
    if (isOutOfStock || !canAddMore) return;
    addToCart(product, selectedPresentation, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const getGenderBadge = (gender?: string) => {
    if (!gender) return null;
    const g = gender.toLowerCase();
    if (g.includes('caballero') || g.includes('hombre')) {
      return (
        <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
          Caballero
        </span>
      );
    }
    if (g.includes('dama') || g.includes('mujer')) {
      return (
        <span className="bg-pink-50 border border-pink-200 text-pink-800 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
          Dama
        </span>
      );
    }
    return (
      <span className="bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
        Unisex
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 pt-1">
      


      {/* ================= CONTENEDOR PRINCIPAL PRODUCTO (ESTILO KLONE SCENTS EN CLAYMORPHISM) ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: VITRINA VISUAL CLAYMORPHIC */}
        <div className="lg:col-span-6 space-y-3">
          <div className="clay-card p-3 sm:p-5 bg-white rounded-3xl border border-white/90 relative overflow-hidden shadow-lg group">
            {/* Resplandor suave decorativo de fondo */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-200/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-100/30 blur-2xl pointer-events-none" />

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
              <img
                src={productImage}
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80';
                }}
                className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                  isOutOfStock ? 'grayscale-[25%]' : ''
                }`}
              />

              {/* Badge de género sobre la imagen */}
              <div className="absolute top-3 left-3 z-10">
                {getGenderBadge(product.gender)}
              </div>

              {/* Badge Disponibilidad */}
              <div className="absolute top-3 right-3 z-10">
                {isOutOfStock ? (
                  <span className="bg-slate-900 text-white text-xs font-black py-1 px-3 rounded-lg shadow-md uppercase tracking-wider">
                    Agotado
                  </span>
                ) : (
                  <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-xs font-black py-1 px-3 rounded-lg shadow-md flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Disponible</span>
                  </span>
                )}
              </div>

              {/* Sello de pureza */}
              <div className="absolute bottom-3 left-3 z-10">
                <span className="bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-200 text-[10.5px] font-black py-1 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                  <span>100% Esencia Concentrada</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tira rápida de beneficios visuales */}
          <div className="grid grid-cols-3 gap-2 text-center select-none">
            <div className="clay-card py-2.5 px-2 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-700 shadow-2xs">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Envíos C807 Todo el País</span>
            </div>
            <div className="clay-card py-2.5 px-2 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-700 shadow-2xs">
              <Droplets className="w-4 h-4 text-pink-600" />
              <span>Esencia Pura de Calidad</span>
            </div>
            <div className="clay-card py-2.5 px-2 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantía de Satisfacción</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN, NOTAS Y BOTÓN DE COMPRA */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5">
          
          {/* 1. TÍTULO, CONTRATIPO Y VALORACIÓN */}
          <div className="space-y-2">
            


            {/* Nombre Oficial */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {displayName}
            </h1>

            {/* Inspiración en el diseñador */}
            <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400">Inspirado en:</span>
              <strong className="text-slate-900 font-black">{product.name}</strong>
              {product.brand && (
                <span className="text-indigo-600 font-bold">de {product.brand}</span>
              )}
            </div>

            {/* Precio Prominente */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                ${activeOption ? (activeOption.price * quantity).toFixed(2) : product.price.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {activeOption?.name} {quantity > 1 ? `(${quantity} unidades)` : ''}
              </span>
            </div>

          </div>

          {/* 2. SELECTOR DE PRESENTACIÓN */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Elige tu presentación:
              </label>
              <span className="text-[11px] font-bold text-indigo-600">
                Familia: {profile.family}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {presentations.map((pres) => {
                const isSelected = selectedPresentation === pres.id;
                return (
                  <button
                    key={pres.id}
                    type="button"
                    onClick={() => setSelectedPresentation(pres.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'clay-card bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-400/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-black text-slate-900">
                        {pres.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-black text-indigo-700">
                      ${pres.price.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. TARJETA ESPECIAL: ARMAR EN KIT DE 100ML PREPARADO ($15) */}
          <div 
            onClick={() => setIsKitModalOpen(true)}
            className="clay-card p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-purple-50/70 to-indigo-50/80 border-2 border-amber-300 ring-2 ring-amber-200/40 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between gap-3 shadow-2xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-700 flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    ¿Lo prefieres en perfume preparado?
                  </h4>
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.2 rounded-full font-mono shadow-2xs">
                    $15.00
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                  1 oz pura de este contratipo + frasco de 100ml a elegir + fijador + etiqueta gratis.
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-700 flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Armar</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* 4. SELECTOR DE CANTIDAD Y BOTÓN DE COMPRA */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-3">
              
              {/* Control de cantidad */}
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center text-xs font-black text-slate-800 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!canAddMore}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Botón Principal de Agregar al Carrito */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || !canAddMore}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isOutOfStock || !canAddMore
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : justAdded
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : 'clay-btn clay-btn-primary !text-white active:scale-98 shadow-indigo-500/25'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al Carrito • ${(activeOption.price * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>

            </div>

            {/* Aviso de existencias */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En existencia para envío inmediato con <strong>C807</strong></span>
              </span>
              <span>Existencias: <strong>{Math.floor(remainingStock)} oz</strong></span>
            </div>
          </div>

          {/* 5. PIRÁMIDE OLFATIVA Y NOTAS (ESTILO KLONE SCENTS) */}
          <div className="clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3.5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Pirámide Olfativa (Notas del Perfume)</span>
            </h3>

            {/* Acordes principales */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {profile.accords.map((accord, idx) => (
                <span 
                  key={idx}
                  className="bg-slate-100 text-slate-700 text-[10px] sm:text-[10.5px] font-bold px-2.5 py-0.5 rounded-full"
                >
                  {accord}
                </span>
              ))}
            </div>

            {/* Notas Salida / Corazón / Fondo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              
              <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                <span className="text-[9.5px] font-black text-amber-800 uppercase tracking-wider block">
                  1. Salida (Top)
                </span>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                  {profile.topNotes.join(', ')}
                </p>
                <span className="text-[9px] text-slate-400 block">Primera impresión</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 space-y-1">
                <span className="text-[9.5px] font-black text-indigo-800 uppercase tracking-wider block">
                  2. Corazón (Heart)
                </span>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                  {profile.heartNotes.join(', ')}
                </p>
                <span className="text-[9px] text-slate-400 block">Carácter distintivo</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-1">
                <span className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider block">
                  3. Fondo (Base)
                </span>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                  {profile.baseNotes.join(', ')}
                </p>
                <span className="text-[9px] text-slate-400 block">Estela duradera</span>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* ================= DETALLES DE LA FRAGANCIA Y ENVÍO ================= */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Descripción de la fragancia */}
        <div className="md:col-span-7 clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 space-y-3 shadow-xs">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
            Detalles de la fragancia
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {profile.description}
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[9.5px] font-black uppercase text-slate-400 block">Estación</span>
              <span className="text-xs font-bold text-slate-800">{profile.season}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[9.5px] font-black uppercase text-slate-400 block">Ocasión</span>
              <span className="text-xs font-bold text-slate-800">{profile.occasion}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[9.5px] font-black uppercase text-slate-400 block">Intensidad</span>
              <span className="text-xs font-bold text-indigo-700">{profile.intensity}</span>
            </div>
          </div>
        </div>

        {/* Información de entrega C807 */}
        <div className="md:col-span-5 clay-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between gap-3 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  Envíos a todo el país
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Cobertura en los 14 departamentos con C807
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recibe tu paquete en tu casa u oficina. Puedes pagar en efectivo contra entrega o mediante transferencia bancaria.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>✓ Pago contra entrega</span>
            <span>✓ Envíos seguros</span>
          </div>
        </div>
      </section>

      {/* ================= FRAGANCIAS RELACIONADAS ("TAMBIÉN TE PUEDE GUSTAR") ================= */}
      {relatedProducts.length > 0 && (
        <section className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              También te podría gustar
            </h3>
            <Link
              href="/"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver catálogo completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Modal para configurar Kit Preparado con este perfume ya preseleccionado */}
      <PerfumeKitBuilderModal
        isOpen={isKitModalOpen}
        onClose={() => setIsKitModalOpen(false)}
        availableEssences={availableEssences}
        availableBottles={availableBottles}
      />

    </div>
  );
}
