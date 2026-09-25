// src/app/kode/components/modals/ComprobanteLightboxModal.tsx
import React from 'react';
import { ExternalLink, X } from 'lucide-react';

interface Props {
  url: string | null;
  onClose: () => void;
}

export function ComprobanteLightboxModal({ url, onClose }: Props) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-base">📸</span>
            <h3 className="font-bold text-slate-800 text-sm">
              Comprobante / Captura de Pago
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download="comprobante-pago.jpg"
              className="clay-btn clay-btn-secondary px-2.5 py-1 text-xs font-bold flex items-center gap-1"
              title="Abrir en pestaña nueva o descargar"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Original
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center bg-slate-100/50 overflow-auto max-h-[calc(90vh-70px)]">
          <img
            src={url}
            alt="Comprobante Bancario"
            className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-200 shadow-md"
          />
        </div>
      </div>
    </div>
  );
}
