'use client';

import React from 'react';
import { Printer, Download, Share2, X, CheckCircle2, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { SaleRecord } from '@/lib/store';

interface CotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleRecord | null;
}

export default function CotizacionModal({ isOpen, onClose, sale }: CotizacionModalProps) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!sale) return;
    const clientPhone = sale.cliente.telefono?.replace(/[^0-9]/g, '') || '';
    const text = encodeURIComponent(
      `Hola ${sale.cliente.nombre}, le compartimos la cotización de su pedido #${sale.orderNumber || sale.saleNumber} de Kode Fragancias.\n` +
      `Total: $${sale.total.toFixed(2)} (${sale.items.length} productos).\n` +
      `Quedamos a sus órdenes para la preparación de su fragancia.`
    );
    const url = clientPhone ? `https://wa.me/${clientPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Barra Superior de Controles */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-800">
                Cotización / Prefactura Comercial
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Orden #{sale.orderNumber || sale.saleNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="clay-btn px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5"
              title="Compartir por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-indigo-600 shadow-sm"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hoja de Cotización (Optimizada para pantalla e impresión) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-800 text-xs font-sans print:p-0 print:m-0">
          
          {/* Encabezado Corporativo */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-indigo-700 uppercase">
                Kode Perfumería & Fragancias
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Soluciones en esencias puras, contratipos de lujo y atomizadores
              </p>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5 font-medium">
                <p>NIT: 0614-120590-101-2 • NRC: 245678-9</p>
                <p>San Salvador, El Salvador • Tel: +503 2245-8800</p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 min-w-[200px]">
              <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider block">
                Cotización / Prefactura
              </span>
              <span className="text-lg font-mono font-black text-indigo-700 block">
                #{sale.orderNumber || sale.saleNumber}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Fecha: {new Date(sale.createdAt).toLocaleDateString()}
              </span>
              <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                Válida por 15 días
              </span>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Cliente / Cotizado a:
              </span>
              <p className="font-black text-slate-800 text-sm">
                {sale.cliente.nombre}
              </p>
              {sale.cliente.numDocumento && (
                <p className="text-slate-600 font-mono text-[11px]">
                  Documento: <strong>{sale.cliente.numDocumento}</strong>
                </p>
              )}
              {sale.cliente.nrc && (
                <p className="text-slate-600 font-mono text-[11px]">
                  NRC: <strong>{sale.cliente.nrc}</strong>
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Contacto & Ubicación:
              </span>
              {sale.cliente.correo && (
                <p className="text-slate-600 text-[11px]">
                  Correo: {sale.cliente.correo}
                </p>
              )}
              {sale.cliente.telefono && (
                <p className="text-slate-600 text-[11px]">
                  Teléfono: {sale.cliente.telefono}
                </p>
              )}
              {sale.cliente.direccion && (
                <p className="text-slate-500 text-[10.5px] mt-0.5">
                  Dirección: {sale.cliente.direccion}
                </p>
              )}
              {sale.vendedor && (
                <p className="text-[10.5px] text-indigo-700 font-bold mt-1">
                  Atendido por: {sale.vendedor}
                </p>
              )}
            </div>
          </div>

          {/* Tabla de Productos / Detalle de Fragancias */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-[10.5px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3">Cant.</th>
                  <th className="py-2.5 px-3">Unidad</th>
                  <th className="py-2.5 px-3">Descripción de la Fragancia / Insumo</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sale.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      {it.unit || 'Oz'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800 block">
                        {it.name}
                      </span>
                      {it.puesto && (
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          📍 Ubicación: {it.puesto}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ${it.price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-800">
                      ${it.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen Financiero */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-[10px] text-slate-500 max-w-sm space-y-1">
              <p className="font-bold text-slate-700">Términos y Condiciones:</p>
              <p>• Los precios incluyen el Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA 13%).</p>
              <p>• Esta cotización no tiene validez como documento tributario oficial (DTE). Al momento del pago en ventanilla, se emitirá su Factura o Crédito Fiscal electrónico con sello de Hacienda.</p>
            </div>

            <div className="w-full sm:w-60 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal (Neto):</span>
                <span className="font-mono">${sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>IVA (13%):</span>
                <span className="font-mono">${sale.ivaTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Cotizado:</span>
                <span className="font-mono text-indigo-700 font-black">
                  ${sale.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Firma o Pie */}
          <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
            <span>KodeLocal ERP • Sistema de Perfumería</span>
            <span>Documento generado para fines informativos</span>
          </div>

        </div>

      </div>
    </div>
  );
}
