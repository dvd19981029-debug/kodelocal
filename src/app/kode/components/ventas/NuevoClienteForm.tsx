'use client';

import React, { useState, useMemo } from 'react';
import {
  User,
  MessageCircle,
  AlertCircle,
  CreditCard,
  Mail,
  Plus,
} from 'lucide-react';
import { ClienteDirectorioItem } from '../../types';
import {
  DEPARTAMENTOS_CATALOG,
  getMunicipiosByDepto,
} from '@/lib/svTerritory';

interface NuevoClienteFormProps {
  directorioClientes: ClienteDirectorioItem[];
  onGuardar: (clienteData: any, crearPedidoDirecto: boolean) => Promise<void>;
  guardando: boolean;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function NuevoClienteForm({
  directorioClientes,
  onGuardar,
  guardando,
  onCancel,
  showToast,
}: NuevoClienteFormProps) {
  const [ncNombre, setNcNombre] = useState('');
  const [ncTelefono, setNcTelefono] = useState('');
  const [ncTipoDoc, setNcTipoDoc] = useState('DUI');
  const [ncNumDoc, setNcNumDoc] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ncDepto, setNcDepto] = useState('');
  const [ncMuni, setNcMuni] = useState('');
  const [ncDireccion, setNcDireccion] = useState('');
  const [ncReferencia, setNcReferencia] = useState('');

  const ncMunicipiosDisponibles = useMemo(() => {
    if (!ncDepto) return [];
    return getMunicipiosByDepto(ncDepto);
  }, [ncDepto]);

  const handleSubmit = (crearPedidoDirecto: boolean) => {
    if (!ncNombre.trim() || !ncTelefono.trim() || !ncDepto || !ncMuni || !ncDireccion.trim()) {
      showToast('Por favor completa todos los campos obligatorios (*)', 'error');
      return;
    }

    onGuardar(
      {
        nombre_completo: ncNombre.trim(),
        telefono_whatsapp: ncTelefono.trim(),
        tipo_documento: ncTipoDoc,
        numero_documento: ncNumDoc.trim() || undefined,
        email: ncEmail.trim() || undefined,
        departamento: ncDepto,
        municipio: ncMuni,
        direccion_entrega: ncDireccion.trim(),
        punto_referencia: ncReferencia.trim() || undefined,
      },
      crearPedidoDirecto
    );
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Volver a Ventas
        </button>
        <span className="text-xs text-slate-500 font-medium">Formulario de Registro de Cliente</span>
      </div>

      <div className="clay-card p-6 space-y-6 bg-white border border-slate-200/80 shadow-md">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Registrar Nuevo Cliente</h3>
            <p className="text-[11px] text-slate-500">
              Ingresa los datos de contacto y entrega del cliente para despachos y WhatsApp.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez / Silvia Menjívar"
                value={ncNombre}
                onChange={(e) => setNcNombre(e.target.value)}
                className="clay-input w-full text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Teléfono WhatsApp *</span>
                {ncTelefono.length >= 8 && (
                  <a
                    href={`https://wa.me/503${ncTelefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Probar chat</span>
                  </a>
                )}
              </label>
              <input
                type="text"
                placeholder="Ej. 78901234"
                value={ncTelefono}
                onChange={(e) => setNcTelefono(e.target.value)}
                className="clay-input w-full text-xs font-mono font-bold"
                required
              />
              {(() => {
                const clean = ncTelefono.trim().replace(/\D/g, '');
                if (clean.length < 8) return null;
                const match = directorioClientes.find(
                  (c) => c.telefono.replace(/\D/g, '') === clean
                );
                if (!match) return null;
                return (
                  <p className="mt-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Teléfono ya asignado a: <strong>{match.nombre}</strong>
                    </span>
                  </p>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Tipo de Doc. (Opcional)</span>
              </label>
              <select
                value={ncTipoDoc}
                onChange={(e) => setNcTipoDoc(e.target.value)}
                className="clay-input w-full text-xs font-bold cursor-pointer"
              >
                <option value="DUI">DUI (El Salvador)</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Carnet de Residente">Carnet de Residente</option>
                <option value="Licencia">Licencia de Conducir</option>
                <option value="NIT">NIT</option>
                <option value="Otro">Otro Documento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                N° de Documento (Opcional)
              </label>
              <input
                type="text"
                placeholder={
                  ncTipoDoc === 'DUI'
                    ? 'Ej. 01234567-8'
                    : ncTipoDoc === 'Pasaporte'
                    ? 'Ej. A12345678'
                    : ncTipoDoc === 'NIT' || ncTipoDoc === 'Licencia'
                    ? 'Ej. 0614-010190-001-1'
                    : 'Ej. N° de identificación'
                }
                value={ncNumDoc}
                onChange={(e) => setNcNumDoc(e.target.value)}
                className="clay-input w-full text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Correo Electrónico (Opcional)</span>
              </label>
              <input
                type="email"
                placeholder="Ej. cliente@correo.com"
                value={ncEmail}
                onChange={(e) => setNcEmail(e.target.value)}
                className="clay-input w-full text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Departamento *
              </label>
              <select
                value={ncDepto}
                onChange={(e) => {
                  const depto = e.target.value;
                  setNcDepto(depto);
                  setNcMuni('');
                }}
                className="clay-input w-full text-xs font-bold cursor-pointer"
                required
              >
                <option value="">-- Seleccionar Departamento --</option>
                {DEPARTAMENTOS_CATALOG.filter((d) => d.id !== '00').map((d) => (
                  <option key={d.id} value={d.nombre}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Municipio *
              </label>
              <select
                value={ncMuni}
                onChange={(e) => setNcMuni(e.target.value)}
                disabled={!ncDepto}
                className="clay-input w-full text-xs font-bold cursor-pointer disabled:opacity-50"
                required
              >
                <option value="">
                  {ncDepto ? '-- Seleccionar Municipio --' : '-- Primero selecciona departamento --'}
                </option>
                {ncMunicipiosDisponibles.map((m: any) => {
                  const nombreMuni = m.nombre_municipio || m.nombre_mh || m.nombre || String(m);
                  return (
                    <option key={m.id_municipio || nombreMuni} value={nombreMuni}>
                      {nombreMuni}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Dirección Exacta de Entrega *
            </label>
            <textarea
              rows={2}
              placeholder="Calle, número de casa, colonia, pasaje, residencial..."
              value={ncDireccion}
              onChange={(e) => setNcDireccion(e.target.value)}
              className="clay-input w-full text-xs font-medium resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Punto de Referencia (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Frente a Farmacia San Nicolás, portón negro..."
              value={ncReferencia}
              onChange={(e) => setNcReferencia(e.target.value)}
              className="clay-input w-full text-xs font-medium"
            />
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold cursor-pointer"
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="clay-btn bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 text-xs font-black shadow-xs cursor-pointer"
            >
              {guardando ? 'Guardando...' : 'Guardar Cliente'}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={guardando}
              className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar y Crear Pedido</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
