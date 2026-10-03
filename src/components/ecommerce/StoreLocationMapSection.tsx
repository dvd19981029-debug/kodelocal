'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink, Clock, Phone, Navigation, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';

export default function StoreLocationMapSection() {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carga diferida con IntersectionObserver para NO ralentizar la página de inicio
  useEffect(() => {
    if (shouldLoadMap) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [shouldLoadMap]);

  return (
    <section 
      ref={containerRef}
      id="sucursal-aromaniak"
      className="clay-card p-5 sm:p-8 md:p-10 border border-white/90 bg-white/80 space-y-6 sm:space-y-8 rounded-3xl shadow-sm"
    >
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/70 pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Sucursal Física & Retiro Oficial
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Abierto para Retiro y Compra
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Visítanos en Centro Comercial El Rosal, San Salvador
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Puedes comprar directamente en nuestro local o hacer tu pedido en línea y pasar a retirarlo sin pagar costo de envío. Todo nuestro catálogo con stock real disponible en el momento.
          </p>
        </div>

        {/* Botones de acción rápida */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <a
            href="https://maps.app.goo.gl/shtetXTGcPZQpBwY6"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto clay-btn clay-btn-primary px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Cómo llegar (Google Maps)</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
          <a
            href="https://wa.me/50360437496"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto clay-btn clay-btn-light px-4 py-2.5 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Sucursal</span>
          </a>
        </div>
      </div>

      {/* Grid: Información Clave de la Sucursal + Mapa Optimizado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Columna Izquierda (5 Cols): Datos prácticos del local */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Ficha 1: Dirección */}
            <div className="clay-card p-4 bg-white/95 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Dirección exacta</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                Centro Comercial El Rosal, Calle El Progreso, San Salvador, El Salvador.
              </p>
              <p className="text-[11px] text-slate-500">
                Fácil acceso vehicular, zona segura y estacionamiento disponible en el centro comercial.
              </p>
            </div>

            {/* Ficha 2: Horarios */}
            <div className="clay-card p-4 bg-white/95 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Horarios de atención</span>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-500">Lunes a Viernes:</span>
                  <span className="font-extrabold text-slate-900">9:00 AM – 6:00 PM</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-slate-500">Sábados:</span>
                  <span className="font-extrabold text-slate-900">9:00 AM – 1:00 PM</span>
                </p>
                <p className="flex justify-between text-slate-400 text-[11px] pt-0.5">
                  <span>Domingos:</span>
                  <span>Cerrado</span>
                </p>
              </div>
            </div>

            {/* Ficha 3: Ventajas de visitar la sucursal */}
            <div className="clay-card p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-100/90 space-y-2 text-xs">
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                Servicios Disponibles en Sucursal
              </span>
              <ul className="space-y-1.5 text-slate-700 text-[11px] sm:text-xs font-medium">
                <li className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span><strong>Retiro sin costo de envío</strong> de compras web.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span><strong>Venta en mostrador:</strong> esencias puras en 1 oz y ½ oz.</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Botes de vidrio de 100ml, alcohol e insumos de perfumería.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Enlace directo */}
          <div className="pt-1 text-center sm:text-left">
            <a
              href="https://maps.app.goo.gl/shtetXTGcPZQpBwY6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors"
            >
              <span>Ver mapa en pantalla completa en Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Columna Derecha (7 Cols): Contenedor interactivo del Mapa con Carga Ultrarrápida */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative w-full h-[320px] sm:h-[380px] lg:h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100 flex items-center justify-center">
            
            {/* Estado 1: Si aún no se ha hecho scroll a la sección o el usuario prefiere activarlo */}
            {!shouldLoadMap ? (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-xs">
                  <MapPin className="w-6 h-6 text-rose-500 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Centro Comercial El Rosal, San Salvador
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Coordenadas: 13.6968, -89.2208 • Calle El Progreso
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShouldLoadMap(true)}
                  className="clay-btn clay-btn-primary px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Cargar Mapa Interactivo
                </button>
              </div>
            ) : (
              <>
                {/* Skeleton sutil mientras se descargan los tiles de Google */}
                {!isIframeLoaded && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-2">
                    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-slate-600">Cargando Google Maps...</span>
                  </div>
                )}

                <iframe
                  src="https://maps.google.com/maps?q=13.6967763,-89.2208348&hl=es&z=17&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  onLoad={() => setIsIframeLoaded(true)}
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación Aromaniak El Salvador - Centro Comercial El Rosal, Calle El Progreso"
                  className="w-full h-full"
                />
              </>
            )}

            {/* Chip flotante en la esquina del mapa */}
            <div className="absolute bottom-3 left-3 z-20 pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[11px] font-black text-slate-800">Aromaniak SV • El Rosal</span>
              <a
                href="https://maps.app.goo.gl/shtetXTGcPZQpBwY6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-indigo-700 font-bold hover:underline ml-1"
              >
                Abrir App ↗
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
