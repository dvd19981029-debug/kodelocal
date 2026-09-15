'use client';

import React from 'react';
import { RotateCw, UserPlus, Search, Users, Edit3 } from 'lucide-react';
import { CustomerRecord } from '@/lib/customers';

export interface PosCustomerModuleProps {
  customers: CustomerRecord[];
  filteredCustomers: CustomerRecord[];
  customerSearch: string;
  setCustomerSearch: (val: string) => void;
  customerFilterType: 'TODOS' | 'NATURAL' | 'JURIDICA';
  setCustomerFilterType: (val: 'TODOS' | 'NATURAL' | 'JURIDICA') => void;
  refreshCustomers: () => void;
  isSyncingCustomers: boolean;
  handleOpenNewCustomerModal: () => void;
  handleOpenEditCustomerModal: (cust: CustomerRecord) => void;
  handleStartSaleForCustomer: (cust: CustomerRecord) => void;
}

export const PosCustomerModule: React.FC<PosCustomerModuleProps> = React.memo(({
  customers,
  filteredCustomers,
  customerSearch,
  setCustomerSearch,
  customerFilterType,
  setCustomerFilterType,
  refreshCustomers,
  isSyncingCustomers,
  handleOpenNewCustomerModal,
  handleOpenEditCustomerModal,
  handleStartSaleForCustomer,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Cabecera del Directorio de Clientes */}
      <div className="clay-card p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span>Directorio de Clientes</span>
            <span className="clay-badge text-[10px] bg-indigo-100 text-indigo-800 font-bold">
              {customers.length} registrados
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Registro de datos fiscales para Facturas (FC - DTE 01) y Crédito Fiscal (CCF - DTE 03)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={refreshCustomers}
            disabled={isSyncingCustomers}
            className="clay-btn clay-btn-light px-3 py-2 text-xs font-bold flex items-center gap-1.5 text-slate-700 hover:text-indigo-700 transition-all"
            title="Actualizar clientes desde Supabase"
          >
            <RotateCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncingCustomers ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewCustomerModal}
            className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrar Cliente</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="clay-card p-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar cliente por Nombre, DUI, NIT, NRC o Teléfono..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-medium"
          />
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCustomerFilterType('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              customerFilterType === 'TODOS' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setCustomerFilterType('NATURAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              customerFilterType === 'NATURAL' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Naturales (FC)
          </button>
          <button
            type="button"
            onClick={() => setCustomerFilterType('JURIDICA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              customerFilterType === 'JURIDICA' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Empresas (CCF)
          </button>
        </div>
      </div>

      {/* Tabla de Clientes Compacta */}
      <div className="clay-card p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            Mostrando <strong>{filteredCustomers.length}</strong> de {customers.length} clientes registrados
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {filteredCustomers.filter(c => c.tipoPersona === 'JURIDICA' || c.documentoPreferido === '03').length} CCF (Empresas) • {filteredCustomers.filter(c => c.tipoPersona !== 'JURIDICA' && c.documentoPreferido !== '03').length} FC (Consumidor)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2 px-3">Cliente / Razón Social</th>
                <th className="py-2 px-2.5">Tipo</th>
                <th className="py-2 px-2.5">Doc. Fiscal</th>
                <th className="py-2 px-2.5">Contacto / Teléfono</th>
                <th className="py-2 px-2.5">Correo Facturación</th>
                <th className="py-2 px-2.5">Giro / Ubicación</th>
                <th className="py-2 px-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-1.5 opacity-30 text-indigo-500" />
                    <p className="font-bold text-xs text-slate-600">No se encontraron clientes</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Prueba ajustando el filtro de búsqueda o presiona Actualizar.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isCCF = cust.tipoPersona === 'JURIDICA' || cust.documentoPreferido === '03';
                  return (
                    <tr key={cust.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-1.5 px-3">
                        <div className="font-bold text-slate-800 text-xs leading-tight">
                          {cust.name}
                        </div>
                        {cust.nombreComercial && (
                          <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                            {cust.nombreComercial}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider ${
                          isCCF
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {isCCF ? 'CCF (03)' : 'FC (01)'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-xs whitespace-nowrap">
                        <span className="text-slate-800 font-semibold">{cust.numDocumento || '—'}</span>
                        {cust.nrc && (
                          <span className="text-[10px] text-purple-700 ml-1 font-bold">
                            (NRC: {cust.nrc})
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-xs whitespace-nowrap text-slate-700">
                        {cust.phone || '—'}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-[11px] text-slate-600 max-w-[170px] truncate">
                        <span title={cust.email || ''}>{cust.email || '—'}</span>
                      </td>
                      <td className="py-1.5 px-2.5 text-[11px] text-slate-600 max-w-[180px] truncate">
                        <span title={`${cust.actividadEconomica ? `${cust.actividadEconomica} • ` : ''}${cust.municipio ? `${cust.municipio}, ` : ''}${cust.departamento || ''}`}>
                          {cust.actividadEconomica || `${cust.municipio ? `${cust.municipio}, ` : ''}${cust.departamento || cust.direccion || '—'}`}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomerModal(cust)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                            title="Editar datos del cliente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartSaleForCustomer(cust)}
                            className="px-2.5 py-1 text-[10.5px] font-bold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
                            title="Crear orden para este cliente"
                          >
                            + Orden
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

PosCustomerModule.displayName = 'PosCustomerModule';
export default PosCustomerModule;
