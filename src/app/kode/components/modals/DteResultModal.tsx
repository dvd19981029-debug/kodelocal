// src/app/kode/components/modals/DteResultModal.tsx
import React from 'react';
import { ReceiptText, ExternalLink, FileText } from 'lucide-react';

interface Props {
  data: {
    pedido: {
      numero_pedido: string;
      cliente_nombre: string;
    };
    result: {
      estado?: string;
      codigo_generacion?: string;
      numero_control?: string;
      sello_recepcion?: string;
      pdf_url?: string;
      json_url?: string;
    };
  } | null;
  onClose: () => void;
}

export function DteResultModal({ data, onClose }: Props) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="clay-card max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Factura Electrónica Emitida (DTE)</h3>
            <p className="text-xs text-slate-500 font-medium">
              Pedido #{data.pedido.numero_pedido} - {data.pedido.cliente_nombre}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Estado Hacienda:</span>
            <span className="clay-badge bg-emerald-100 text-emerald-800 font-black">
              ✓ {data.result.estado || 'PROCESADO'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Código Generación:</span>
            <span className="font-mono text-slate-800 font-black truncate max-w-[220px]" title={data.result.codigo_generacion}>
              {data.result.codigo_generacion}
            </span>
          </div>
          {data.result.numero_control && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-bold">Número Control:</span>
              <span className="font-mono text-slate-800 font-black">{data.result.numero_control}</span>
            </div>
          )}
          {data.result.sello_recepcion && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-bold">Sello Recepción MH:</span>
              <span className="font-mono text-slate-800 font-bold truncate max-w-[220px]" title={data.result.sello_recepcion}>
                {data.result.sello_recepcion}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {data.result.pdf_url && (
            <a
              href={data.result.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 clay-btn clay-btn-primary py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Descargar PDF Factura
            </a>
          )}
          {data.result.json_url && (
            <a
              href={data.result.json_url}
              target="_blank"
              rel="noreferrer"
              className="clay-btn clay-btn-light py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              Ver JSON DTE
            </a>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
