import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Truck, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'El Mejor Proveedor de Esencias y Perfumería Fina en El Salvador',
  description: 'Descubre por qué Aromaniak es el distribuidor #1 de esencias puras, contratipos, envases de vidrio y alcohol perfumista. Comparativa 2026.',
  alternates: {
    canonical: 'https://aromaniaksv.com/mejor-proveedor-esencias-el-salvador',
  }
};

export default function LandingComparativa() {
  return (
    <div className="space-y-12 pb-24">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-purple-300/30 blur-[100px] -z-10 rounded-full"></div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          ¿Buscando Proveedores de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Esencias en El Salvador</span>?
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Sabemos que el éxito de tu negocio de perfumes depende de la calidad de tus insumos y de la eficiencia de tu proveedor. Descubre por qué los emprendedores más exitosos del país están migrando a Aromaniak.
        </p>
      </section>

      {/* COMPARATIVE TABLE */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="clay-card bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 text-center mb-10">
            Aromaniak vs Proveedores Tradicionales
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="p-4 text-slate-500 font-bold w-1/3">Característica</th>
                  <th className="p-4 bg-indigo-50/50 rounded-t-2xl text-indigo-700 font-black text-lg w-1/3">Aromaniak</th>
                  <th className="p-4 text-slate-500 font-bold w-1/3">Proveedores Comunes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Experiencia de Compra
                  </td>
                  <td className="p-4 bg-indigo-50/30">
                    <span className="flex items-center gap-2 text-slate-800 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      E-commerce automatizado 24/7. Pedidos en 2 minutos.
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-slate-500">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      Esperar horas a que respondan por WhatsApp.
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Calidad de Esencia
                  </td>
                  <td className="p-4 bg-indigo-50/30">
                    <span className="flex items-center gap-2 text-slate-800 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      Puras sin diluir, calidad Europea AAA+.
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-slate-500">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      Esencias genéricas, a menudo rebajadas.
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-700 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" /> Logística y Envíos
                  </td>
                  <td className="p-4 bg-indigo-50/30 rounded-b-2xl">
                    <span className="flex items-center gap-2 text-slate-800 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      Envíos express a los 14 departamentos con C807.
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-slate-500">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      Limitado a San Salvador o envíos lentos e inseguros.
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 mt-16">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h3 className="text-3xl font-black mb-4 relative z-10">Da el Salto a la Calidad Europea</h3>
          <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto relative z-10">
            No limites el potencial de tus fragancias. Compra directamente en nuestra tienda online y recibe tus insumos químicos, envases y contratipos en la puerta de tu casa.
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform active:scale-95 relative z-10">
            Ver Catálogo de Productos
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
