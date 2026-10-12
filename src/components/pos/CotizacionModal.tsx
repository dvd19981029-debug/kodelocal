'use client';

import React, { useState } from 'react';
import { Printer, Download, Share2, X, FileText, AlertTriangle, Tag, Loader2 } from 'lucide-react';
import { SaleRecord } from '@/lib/store';
import { downloadQuotePdf, QuotePriceChange, QuotePromotion } from '@/lib/quotePdf';

export interface CotizacionNotices {
  validUntil?: string | Date | null;
  priceChanges?: QuotePriceChange[];
  promotions?: QuotePromotion[];
  isExpired?: boolean;
}

interface CotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleRecord | null;
  notices?: CotizacionNotices | null;
}

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function CotizacionModal({ isOpen, onClose, sale, notices }: CotizacionModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !sale) return null;

  const validUntil =
    notices?.validUntil ||
    new Date(new Date(sale.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000);
  const hasChanges = !!notices?.priceChanges && notices.priceChanges.length > 0;
  const hasPromos = !!notices?.promotions && notices.promotions.length > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadQuotePdf({
        quoteNumber: sale.orderNumber || sale.saleNumber,
        createdAt: sale.createdAt,
        validUntil,
        customer: {
          nombre: sale.cliente.nombre,
          numDocumento: sale.cliente.numDocumento,
          nrc: sale.cliente.nrc,
          correo: sale.cliente.correo,
          telefono: sale.cliente.telefono,
          direccion: sale.cliente.direccion,
        },
        vendedor: sale.vendedor,
        items: sale.items.map((it) => ({
          quantity: it.quantity,
          unit: it.unit,
          name: it.name,
          price: it.price,
          total: it.total,
          puesto: it.puesto,
        })),
        subtotal: sale.subtotal,
        ivaTotal: sale.ivaTotal,
        total: sale.total,
        priceChanges: notices?.priceChanges,
        promotions: notices?.promotions,
        isExpired: notices?.isExpired,
      });
    } catch (err) {
      console.error('Error generando PDF de cotización:', err);
      alert('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!sale) return;
    const clientPhone = sale.cliente.telefono?.replace(/[^0-9]/g, '') || '';
    const text = encodeURIComponent(
      `Hola ${sale.cliente.nombre}, le compartimos la cotización #${sale.orderNumber || sale.saleNumber} de Aromaniak.\n` +
      `Total: $${sale.total.toFixed(2)} (${sale.items.length} productos).\n` +
      `Quedamos a sus órdenes.`
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
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
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
              className="clay-btn px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
              title="Imprimir"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-slate-900 shadow-sm disabled:opacity-60"
              title="Descargar cotización en PDF"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Descargar PDF</span>
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

          {/* Encabezado con logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-amber-600/70">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/aromaniak_black_logo.png"
                alt="Aromaniak"
                className="h-12 w-auto object-contain"
              />
              <div className="text-[10px] text-slate-500 mt-2 space-y-0.5 font-medium">
                <p>Distribuidora de esencias de perfumería fina</p>
                <p>Centro Comercial El Rosal, Calle El Progreso, San Salvador</p>
                <p>NIT: 0614-120590-101-2 • NRC: 245678-9 • Tel: +503 2245-8800</p>
              </div>
            </div>

            <div className="text-left sm:text-right min-w-[200px]">
              <span className="text-2xl font-black tracking-tight text-slate-900 block leading-none">
                COTIZACIÓN
              </span>
              <span className="text-sm font-mono font-black text-amber-700 block mt-1">
                N° {sale.orderNumber || sale.saleNumber}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Fecha: {fmtDate(sale.createdAt)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Válida hasta: {fmtDate(validUntil)}
              </span>
            </div>
          </div>

          {/* Avisos de actualización */}
          {(notices?.isExpired || hasChanges || hasPromos) && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 space-y-2.5 print:break-inside-avoid">
              {notices?.isExpired && (
                <p className="flex items-start gap-2 text-[11px] font-bold text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Esta cotización venció el {fmtDate(validUntil)}. Solicite una cotización actualizada.
                </p>
              )}

              {hasChanges && (
                <div>
                  <p className="flex items-start gap-2 text-[11px] font-black text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Los precios de lista de estos productos cambiaron desde que se emitió esta cotización:
                  </p>
                  <ul className="mt-1.5 space-y-1 pl-5">
                    {notices!.priceChanges!.map((c) => {
                      const diff = c.currentListPrice - c.quotedListPrice;
                      return (
                        <li key={c.productId} className="text-[11px] text-slate-700 flex flex-wrap justify-between gap-x-3">
                          <span className="font-bold">{c.name}</span>
                          <span className="font-mono">
                            ${c.quotedListPrice.toFixed(2)} → <strong>${c.currentListPrice.toFixed(2)}</strong>{' '}
                            <span className={diff >= 0 ? 'text-red-600' : 'text-emerald-700'}>
                              ({diff >= 0 ? '+' : '-'}${Math.abs(diff).toFixed(2)})
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {hasPromos && (
                <div>
                  <p className="flex items-start gap-2 text-[11px] font-black text-amber-900">
                    <Tag className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Promociones vigentes actualmente:
                  </p>
                  <ul className="mt-1.5 space-y-1 pl-5">
                    {notices!.promotions!.map((p) => (
                      <li key={p.code} className="text-[11px] text-slate-700">
                        <strong className="font-mono">{p.code}</strong>
                        {p.description ? ` - ${p.description}` : ''} •{' '}
                        {p.discountType === 'PERCENTAGE'
                          ? `${p.discountValue}% de descuento`
                          : `$${p.discountValue.toFixed(2)} de descuento`}
                        {p.minPurchase ? ` • compra mínima $${p.minPurchase.toFixed(2)}` : ''}
                        {p.endDate ? ` • hasta ${fmtDate(p.endDate)}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Datos del Cliente */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block mb-0.5">
                Cotizado a
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
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block mb-0.5">
                Contacto y ubicación
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
                <p className="text-[10.5px] text-slate-700 font-bold mt-1">
                  Atendido por: {sale.vendedor}
                </p>
              )}
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-[10.5px] font-black uppercase tracking-wider text-white">
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3">Unidad</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3 text-right">Precio unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sale.items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-stone-50' : 'bg-white'}>
                    <td className="py-2.5 px-3 font-mono font-black text-center text-slate-800">
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
                          Ubicación: {it.puesto}
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
              <p className="font-bold text-slate-700">Términos y condiciones</p>
              <p>• Los precios incluyen el Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA 13%).</p>
              <p>• Precios sujetos a cambio sin previo aviso; la cotización es válida hasta la fecha indicada.</p>
              <p>• Esta cotización no tiene validez como documento tributario oficial (DTE). Al momento del pago se emitirá su Factura o Crédito Fiscal electrónico con sello de Hacienda.</p>
            </div>

            <div className="w-full sm:w-60 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal (neto)</span>
                <span className="font-mono">${sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>IVA (13%)</span>
                <span className="font-mono">${sale.ivaTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-amber-600/60">
                <span>TOTAL</span>
                <span className="font-mono text-amber-700 font-black">
                  ${sale.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Pie */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
            <span>Aromaniak SV • Gracias por su preferencia</span>
            <span>aromaniaksv.com</span>
          </div>

        </div>

      </div>
    </div>
  );
}
