import React from 'react';
import { Metadata } from 'next';
import { CheckCircle2, XCircle, ShieldCheck, Truck, Zap, Droplets, Gem } from 'lucide-react';
import LandingMarquee from '@/components/ecommerce/LandingMarquee';

export const metadata: Metadata = {
  title: 'El Mejor Proveedor de Esencias y Perfumería Fina en El Salvador',
  description: 'Descubre por qué Aromaniak es el distribuidor #1 de esencias puras, contratipos, envases de vidrio y alcohol perfumista. Comparativa 2026.',
  alternates: {
    canonical: 'https://aromaniaksv.com/mejor-proveedor-esencias-el-salvador',
  }
};

export default function LandingComparativa() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HERO SECTION - Light, Clean, Premium */}
      <section className="relative pt-20 pb-24 px-4 text-center overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-200/50 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold tracking-wide uppercase mb-6 shadow-sm">
            <Gem className="w-4 h-4" /> Distribuidor Mayorista Exclusivo
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            ¿Buscando Proveedores de <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Esencias en El Salvador?</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Sabemos que el éxito de tu negocio de perfumes depende de la calidad de tus insumos y la eficiencia de tu proveedor. Descubre por qué los emprendedores más exitosos del país están migrando a <strong className="text-indigo-700">Aromaniak</strong>.
          </p>
        </div>

        <div className="absolute left-10 top-20 hidden lg:block opacity-30 animate-pulse">
          <Droplets className="w-24 h-24 text-indigo-300" />
        </div>
      </section>

      {/* COMPARATIVE TABLE - Clean Claymorphism */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        <div className="clay-card bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-10 shadow-2xl border border-white">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 text-center mb-8">
            La Realidad: <span className="text-indigo-600">Aromaniak</span> vs <span className="text-slate-400">Proveedores Tradicionales</span>
          </h2>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-5 text-slate-500 font-bold w-1/3 border-b border-slate-200">Característica Clave</th>
                  <th className="p-5 bg-indigo-50 text-indigo-800 font-black text-lg w-1/3 border-b border-indigo-100 shadow-inner">🏆 Aromaniak</th>
                  <th className="p-5 text-slate-500 font-bold w-1/3 border-b border-slate-200">Otros Proveedores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5 font-bold text-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 group-hover:scale-110 transition-transform"><Zap className="w-5 h-5" /></div> Experiencia de Compra
                  </td>
                  <td className="p-5 bg-indigo-50/30">
                    <span className="flex items-start gap-3 text-slate-800 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      E-commerce automatizado 24/7. Tu pedido en 2 minutos.
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="flex items-start gap-3 text-slate-500">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      Esperar horas a que respondan en WhatsApp.
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5 font-bold text-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform"><ShieldCheck className="w-5 h-5" /></div> Calidad de Esencia
                  </td>
                  <td className="p-5 bg-indigo-50/30">
                    <span className="flex items-start gap-3 text-slate-800 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      Puras sin diluir. Calidad Europea AAA+.
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="flex items-start gap-3 text-slate-500">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      Esencias genéricas o rebajadas.
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5 font-bold text-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform"><Truck className="w-5 h-5" /></div> Logística y Envíos
                  </td>
                  <td className="p-5 bg-indigo-50/30">
                    <span className="flex items-start gap-3 text-slate-800 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      Envíos express seguros con C807.
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="flex items-start gap-3 text-slate-500">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      Limitado a San Salvador o informal.
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* DYNAMIC CTA & CATALOG REVEAL - Light Mode */}
      <section className="max-w-7xl mx-auto px-4 mt-20 mb-24">
        <div className="text-center">
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6">Da el Salto a la Calidad Europea</h3>
          <p className="text-slate-600 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            No limites el potencial de tus fragancias. Compra directamente en nuestra tienda online y recibe tus insumos químicos, envases y contratipos en la puerta de tu casa.
          </p>
          
          <LandingMarquee />
        </div>
      </section>

    </div>
  );
}
