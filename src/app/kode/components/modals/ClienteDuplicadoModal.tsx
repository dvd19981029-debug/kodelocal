'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ClienteItem } from '../../types';

interface ClienteDuplicadoModalProps {
  modalData: {
    cliente: ClienteItem;
    crearPedidoDirecto: boolean;
  } | null;
  onClose: () => void;
  onSobreescribir: (crearPedidoDirecto: boolean) => void;
}

export function ClienteDuplicadoModal({
  modalData,
  onClose,
  onSobreescribir,
}: ClienteDuplicadoModalProps) {
  if (!modalData) return null;

  const { cliente, crearPedidoDirecto } = modalData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-2xl shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black leading-tight">Teléfono ya registrado</h3>
            <p className="text-xs text-amber-100 font-medium mt-0.5">
              Ya existe un cliente con este número de WhatsApp.
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Cliente existente:</span>
              <span className="font-extrabold text-slate-900 text-sm">{cliente.nombre_completo || (cliente as any).nombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Teléfono:</span>
              <span className="font-mono font-bold text-slate-800">{cliente.telefono_whatsapp || (cliente as any).telefono}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Ubicación actual:</span>
              <span className="font-medium text-slate-700">
                {cliente.municipio || ''}, {cliente.departamento || ''}
              </span>
            </div>
            {(cliente.direccion_entrega || (cliente as any).direccion) && (
              <div className="pt-1 text-[11px] text-slate-600 truncate">
                <span className="font-semibold text-slate-500">Dirección: </span>
                {cliente.direccion_entrega || (cliente as any).direccion}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            ¿Deseas <strong>sobreescribir</strong> los datos de este cliente con la información que acabas de ingresar o prefieres <strong>cancelar</strong> para corregir el número?
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSobreescribir(crearPedidoDirecto)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200 transition-colors cursor-pointer"
          >
            Sobreescribir datos
          </button>
        </div>
      </div>
    </div>
  );
}
