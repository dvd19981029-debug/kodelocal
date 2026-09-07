'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, MapPin, Phone, Mail, Clock, ShieldCheck, Truck, CreditCard } from 'lucide-react';

export default function EcommerceFooter() {
  return (
    <footer className="w-full bg-[#f1f4f9] border-t border-white/80 pt-12 pb-8 px-4 sm:px-8 mt-16 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Grilla Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Marca & Misión */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-base shadow-md">
                A
              </div>
              <span className="font-black text-lg text-slate-900 tracking-tight">
                Aromaniak SV
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed font-medium">
              Especialistas en contratipos de alta gama e inspiración olfativa con fijación prolongada. Más de 600 fragancias para damas, caballeros y unisex en El Salvador.
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-700 font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Esencias Grado Premium 33%</span>
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
                <span>San Salvador & La Libertad (24 horas)</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Envíos a los 14 departamentos de El Salvador</span>
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
                <span>Pago Contra Entrega (Efectivo)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Transferencia (Agrícola, BAC, Cuscatlán)</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Chivo Wallet & Bitcoin</span>
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
          <p>© 2026 Aromaniak SV. Todos los derechos reservados.</p>
          <p className="text-slate-400">San Salvador, El Salvador • Fragancias & Contratipos</p>
        </div>

      </div>
    </footer>
  );
}
