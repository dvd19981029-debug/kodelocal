import React from 'react';
import { X, CheckCircle2, FileDown, ExternalLink, Printer } from 'lucide-react';
import { SaleRecord } from '@/lib/store';

export interface PosSaleDetailModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
  onPrint: () => void;
}

export const PosSaleDetailModal: React.FC<PosSaleDetailModalProps> = ({
  sale,
  onClose,
  onPrint,
}) => {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="clay-card w-full max-w-md p-5 relative bg-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-3 border-b border-slate-100 mb-3">
          <h4 className="text-sm font-black text-slate-800">Detalle de Comprobante</h4>
          <p className="font-mono text-xs text-indigo-700 font-bold">#{sale.saleNumber}</p>
        </div>

        <div className="space-y-2 text-xs mb-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Cliente:</span>
            <strong className="text-slate-800">{sale.cliente.nombre}</strong>
          </div>
          {sale.cliente.numDocumento && (
            <div className="flex justify-between">
              <span className="text-slate-500">Documento:</span>
              <span className="font-mono">{sale.cliente.numDocumento}</span>
            </div>
          )}
          {sale.dteInfo?.numeroControl && (
            <div className="flex justify-between">
              <span className="text-slate-500">N° Control Hacienda:</span>
              <span className="font-mono font-bold text-emerald-700">{sale.dteInfo.numeroControl}</span>
            </div>
          )}

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto">
            {sale.items.map((it, idx) => (
              <div key={idx} className="py-1 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{it.name}</span>
                  <span className="text-[10px] text-slate-400">{it.quantity} {it.unit || 'Oz'} x ${it.price.toFixed(2)}</span>
                </div>
                <span className="font-mono font-black text-slate-800">${it.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal Neto:</span>
              <span className="font-mono font-bold">${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (13%):</span>
              <span className="font-mono font-bold">${sale.ivaTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-indigo-900 pt-1 border-t border-indigo-200">
              <span>Total:</span>
              <span className="font-mono text-indigo-600">${sale.total.toFixed(2)}</span>
            </div>
          </div>

          {sale.dteInfo && (
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  DTE Certificado por Factura Llama
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                  {sale.dteInfo.simulated ? 'Test' : 'Hacienda OK'}
                </span>
              </div>
              {sale.dteInfo.numeroControl && (
                <div className="text-[11px] font-mono text-emerald-900 truncate" title={sale.dteInfo.numeroControl}>
                  <span className="text-emerald-700 font-semibold">Control: </span>
                  {sale.dteInfo.numeroControl}
                </div>
              )}
              {sale.dteInfo.selloRecepcion && (
                <div className="text-[10px] font-mono text-emerald-900 truncate" title={sale.dteInfo.selloRecepcion}>
                  <span className="text-emerald-700 font-semibold">Sello: </span>
                  {sale.dteInfo.selloRecepcion}
                </div>
              )}
              {sale.dteInfo.codigoGeneracion && (
                <div className="text-[10px] font-mono text-slate-500 truncate" title={sale.dteInfo.codigoGeneracion}>
                  <span className="text-slate-400">UUID: </span>
                  {sale.dteInfo.codigoGeneracion}
                </div>
              )}
              <div className="pt-2 flex gap-1.5">
                <a
                  href={`/api/dte/${sale.dteInfo.codigoGeneracion}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 text-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </a>
                {sale.dteInfo.mhDteUrl && (
                  <a
                    href={sale.dteInfo.mhDteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 text-center rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-bold text-[11px] inline-flex items-center justify-center gap-1 transition-all"
                    title="Ver consulta pública en Ministerio de Hacienda"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Hacienda</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
