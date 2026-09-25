import React from 'react';
import { CheckCircle2, FileDown, ExternalLink, Printer } from 'lucide-react';
import { SaleRecord } from '@/lib/store';

export interface PosCompletedSaleModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
  onPrint: () => void;
}

export const PosCompletedSaleModal: React.FC<PosCompletedSaleModalProps> = ({
  sale,
  onClose,
  onPrint,
}) => {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="clay-card w-full max-w-sm p-6 relative bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-slate-800">¡Venta Completada con Éxito!</h3>
        <p className="text-xs text-slate-500 mt-1">Comprobante #{sale.saleNumber}</p>

        <div className="my-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-left text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Cliente:</span>
            <strong className="text-slate-800">{sale.cliente.nombre}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Comprobante:</span>
            <span className="font-bold text-indigo-700">
              {sale.tipoComprobante === '03' ? 'Crédito Fiscal (03)' : sale.tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'}
            </span>
          </div>
          <div className="flex justify-between font-black text-slate-800 pt-1 border-t border-indigo-200">
            <span>Total Cobrado:</span>
            <span className="font-mono text-indigo-600">${sale.total.toFixed(2)}</span>
          </div>
        </div>

        {sale.dteInfo && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                DTE Transmitido a Factura Llama
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                {sale.dteInfo.simulated ? 'Ambiente Test' : 'Hacienda OK'}
              </span>
            </div>
            {sale.dteInfo.numeroControl && (
              <div className="text-[11px] font-mono text-emerald-900 truncate" title={sale.dteInfo.numeroControl}>
                <span className="text-emerald-700 font-semibold">Control: </span>
                {sale.dteInfo.numeroControl}
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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-bold"
          >
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
};
