import React from 'react';
import Link from 'next/link';
import { FileCheck, ArrowLeft, Shield, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Condiciones del Servicio - Aromaniak SV',
  description: 'Términos y Condiciones del Servicio de Aromaniak SV.',
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          href="/"
          className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>
        <span className="text-xs text-slate-400 font-medium">Última actualización: Septiembre 2026</span>
      </div>

      <div className="clay-card p-6 sm:p-10 bg-white space-y-8 rounded-3xl border border-white/90 shadow-xl">
        <div className="border-b border-purple-100 pb-5 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3 shadow-sm">
            <FileCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Condiciones del Servicio
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            Términos y condiciones aplicables a las compras y uso de la plataforma de <strong>Aromaniak SV</strong> (<a href="https://aromaniaksv.com" className="text-purple-700 underline font-bold">https://aromaniaksv.com</a>).
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>1. Servicio y Productos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Aromaniak SV es una distribuidora de esencias de perfumería fina, aromas químicos, aromas de esencias, botes de vidrio y materias primas en El Salvador. Ofrecemos entregas a domicilio a todo El Salvador o retiro en local.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>2. Cuentas de Usuario y Seguridad</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Los clientes pueden crear su cuenta voluntariamente mediante su correo electrónico o autenticación segura con Google. El usuario es responsable de mantener la seguridad de sus accesos y se compromete a proporcionar información veraz para el despacho y entrega de sus pedidos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-600" />
            <span>3. Pedidos y Envíos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Los envíos se gestionan a nivel nacional en El Salvador a través de empresas de mensajería aliadas. Al completar un pedido, el cliente recibe un comprobante electrónico y actualizaciones periódicas sobre el estado de su paquete.
          </p>
        </section>
      </div>
    </main>
  );
}
