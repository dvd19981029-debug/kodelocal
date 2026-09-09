'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, MapPin, Phone, Mail, Clock, ShieldCheck, Truck, CreditCard } from 'lucide-react';

export default function EcommerceFooter() {
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('reset-home-page'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#f1f4f9] border-t border-white/80 pt-12 pb-8 px-4 sm:px-8 mt-16 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Grilla Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Marca & Misión */}
          <div className="space-y-3">
            <div className="flex items-center">
              <Link 
                href="/" 
                onClick={handleLogoClick}
                className="inline-flex items-center cursor-pointer group transition-transform active:scale-95"
              >
                <img
                  src="/images/logo.png"
                  alt="Aromaniak"
                  loading="lazy"
                  decoding="async"
                  className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
                />
              </Link>
            </div>
            <p className="text-slate-500 leading-relaxed font-medium">
              Especialistas en inspiraciones de alta gama con fijación prolongada. Gran variedad de muchas fragancias para damas, caballeros y unisex en El Salvador. Marca registrada, propiedad de Grupo Kode SAS de C.V. El Salvador.
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-700 font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Esencias 100% Puras de Alta Concentración</span>
            </div>
          </div>

          {/* Col 2: Cobertura y Envíos */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
              Envíos & Cobertura
            </h4>
            <ul className="space-y-2 text-slate-500 font-medium">
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Envíos a los 14 departamentos con C807</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Cobertura nacional de 24 a 48 horas</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Entregas de Lunes a Sábado</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Métodos de Pago */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
              Formas de Pago
            </h4>
            <ul className="space-y-2 text-slate-500 font-medium">
              <li className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tarjeta de Crédito y Débito</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Banco Agrícola, BAC & Cuscatlán</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Transferencia Bancaria Inmediata</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contacto y Atención */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
              Atención al Cliente
            </h4>
            <div className="space-y-2 text-slate-500 font-medium">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp: +503 7000-0000</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>ventas@aromaniaksv.com</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2">
                Horario: Lunes a Sábado 8:00 AM – 6:00 PM
              </p>
            </div>
          </div>

        </div>

        {/* Separador y Copyright */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px] font-semibold">
          <div className="space-y-0.5 text-center sm:text-left">
            <p>© 2026 Aromaniak SV®. Marca registrada. Todos los derechos reservados.</p>
            <p className="text-slate-400 font-medium">Propiedad de <strong>Grupo Kode SAS de C.V.</strong> — El Salvador</p>
          </div>
          <p className="text-slate-400 text-center sm:text-right">San Salvador, El Salvador • Fragancias & Inspiraciones</p>
        </div>

      </div>
    </footer>
  );
}
