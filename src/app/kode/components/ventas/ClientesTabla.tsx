'use client';

import React from 'react';
import {
  UserPlus,
  ExternalLink,
  Phone,
  MessageCircle,
  CreditCard,
  Mail,
  User,
} from 'lucide-react';
import { ClienteDirectorioItem } from '../../types';

interface ClientesTablaProps {
  clientes: ClienteDirectorioItem[];
  totalClientes: number;
  onVolver: () => void;
  onNuevoCliente: () => void;
  onVerFicha: (cliente: ClienteDirectorioItem) => void;
  onSeleccionarCliente: (cliente: ClienteDirectorioItem) => void;
}

export const ClientesTabla: React.FC<ClientesTablaProps> = ({
  clientes,
  totalClientes,
  onVolver,
  onNuevoCliente,
  onVerFicha,
  onSeleccionarCliente,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            ← Volver a Ventas
          </button>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
            Directorio de Clientes ({totalClientes})
          </span>
        </div>

        <button
          type="button"
          onClick={onNuevoCliente}
          className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Nuevo Cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">Nombre completo</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Teléfono / WhatsApp</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Documento</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Correo electrónico</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Departamento</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Municipio</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Dirección de entrega</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Punto de referencia</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nombre Completo */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onVerFicha(c)}
                        className="font-extrabold text-slate-900 hover:text-indigo-600 hover:underline text-left cursor-pointer transition-colors inline-flex items-center gap-1.5 group"
                        title="Ver ficha del cliente e historial de pedidos"
                      >
                        <span>{c.nombre}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    </td>

                    {/* Teléfono / WhatsApp */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{c.telefono}</span>
                        <div className="inline-flex items-center gap-0.5">
                          <a
                            href={`tel:503${c.telefono}`}
                            className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title={`Llamar a ${c.nombre}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/503${c.telefono}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title={`Enviar WhatsApp a ${c.nombre}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Documento */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.numero_documento ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>{c.tipo_documento || 'DUI'}: {c.numero_documento}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">-</span>
                      )}
                    </td>

                    {/* Correo Electrónico */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1.5 text-blue-700 hover:underline font-medium text-xs"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          <span>{c.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">-</span>
                      )}
                    </td>

                    {/* Departamento */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                      {c.departamento || '-'}
                    </td>

                    {/* Municipio */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                      {c.municipio || '-'}
                    </td>

                    {/* Dirección de entrega */}
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate whitespace-nowrap" title={c.direccion}>
                      {c.direccion || '-'}
                    </td>

                    {/* Punto de referencia */}
                    <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate whitespace-nowrap" title={c.referencia || ''}>
                      {c.referencia || <span className="text-slate-400 text-[11px] italic">-</span>}
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => onVerFicha(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Ver ficha completa e historial"
                        >
                          <User className="w-3 h-3 text-slate-500" />
                          <span>Ficha</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSeleccionarCliente(c)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          + Pedido
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
