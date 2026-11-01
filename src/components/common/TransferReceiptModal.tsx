'use client';

import React, { useState } from 'react';
import { Eye, ExternalLink, X, FileText, Building2 } from 'lucide-react';
import { extractTransferReceiptUrl } from '@/lib/bankAccounts';

interface TransferReceiptButtonProps {
  order?: any;
  receiptUrl?: string | null;
  orderNumber?: string;
  customerName?: string;
  total?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function TransferReceiptButton({
  order,
  receiptUrl,
  orderNumber,
  customerName,
  total,
  size = 'xs',
  className = '',
}: TransferReceiptButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const resolvedUrl = receiptUrl || extractTransferReceiptUrl(order);
  if (!resolvedUrl) return null;

  const resolvedOrderNum =
    orderNumber || order?.orderNumber || order?.saleNumber || '';
  const resolvedCustomer =
    customerName ||
    order?.customerName ||
    order?.cliente?.nombre ||
    'Cliente';
  const resolvedTotal =
    typeof total === 'number'
      ? total
      : typeof order?.total === 'number'
      ? order.total
      : Number(order?.total || 0);

  const isPdf =
    resolvedUrl.toLowerCase().endsWith('.pdf') ||
    resolvedUrl.startsWith('data:application/pdf');

  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1.5 text-xs gap-1.5 rounded-xl'
      : size === 'sm'
      ? 'px-2.5 py-1 text-[11px] gap-1 rounded-lg'
      : 'px-2.5 py-1 text-[10.5px] gap-1 rounded-lg';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`bg-indigo-600 hover:bg-indigo-700 text-white font-black inline-flex items-center shadow-xs transition-colors cursor-pointer shrink-0 ${sizeClasses} ${className}`}
        title="Ver archivo de comprobante de transferencia subido por el cliente"
      >
        <Eye className="w-3.5 h-3.5 shrink-0" />
        <span>Ver Comprobante</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                    <Building2 className="w-3 h-3" />
                    Comprobante de Transferencia
                  </span>
                  {resolvedOrderNum && (
                    <span className="font-mono font-black text-xs text-slate-700">
                      #{resolvedOrderNum}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                    <img
                      src="/images/banks/bancoagricola.svg"
                      alt="Bancoagrícola"
                      className="h-3 w-auto object-contain"
                    />
                    <span className="h-2.5 w-px bg-slate-200" />
                    <img
                      src="/images/banks/bac.svg"
                      alt="BAC Credomatic"
                      className="h-2.5 w-auto object-contain"
                    />
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate mt-1">
                  {resolvedCustomer}
                  {resolvedTotal > 0 ? ` • Monto orden: $${resolvedTotal.toFixed(2)}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nota informativa de que la validación es manual */}
            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200/80 text-[11px] text-amber-900 font-semibold">
              Archivo adjuntado por el cliente. Verifica el depósito en el banco antes de confirmar la transferencia manualmente.
            </div>

            {/* Cuerpo / Visor */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-100/70 flex items-center justify-center min-h-[280px]">
              {isPdf ? (
                <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
                  <iframe
                    src={resolvedUrl}
                    title="Comprobante PDF"
                    className="w-full h-full rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              ) : (
                <img
                  src={resolvedUrl}
                  alt={`Comprobante ${resolvedOrderNum}`}
                  className="max-w-full max-h-[62vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                {isPdf ? <FileText className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>Abrir archivo completo</span>
              </a>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
