import React from 'react';
import { 
  X, 
  UserPlus, 
  User, 
  Building2, 
  FileText, 
  ReceiptText, 
  Check 
} from 'lucide-react';
import { 
  TipoPersona, 
  TipoDocumentoCliente, 
  CategoriaContribuyente 
} from '@/lib/customers';
import { 
  DEPARTAMENTOS_CATALOG, 
  getMunicipiosByDepartamento 
} from '@/lib/svTerritory';
import { TipoComprobante } from '../../types';

export interface PosCustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomerId: string | null;
  custTipoPersona: TipoPersona;
  setCustTipoPersona: (val: TipoPersona) => void;
  custTipoDocumento: TipoDocumentoCliente;
  setCustTipoDocumento: (val: TipoDocumentoCliente) => void;
  custDocumentoPreferido: TipoComprobante;
  setCustDocumentoPreferido: (val: TipoComprobante) => void;
  custName: string;
  setCustName: (val: string) => void;
  custNombreComercial: string;
  setCustNombreComercial: (val: string) => void;
  custNumDocumento: string;
  setCustNumDocumento: (val: string) => void;
  custNrc: string;
  setCustNrc: (val: string) => void;
  custGiro: string;
  setCustGiro: (val: string) => void;
  custCategoria: CategoriaContribuyente;
  setCustCategoria: (val: CategoriaContribuyente) => void;
  custEmail: string;
  setCustEmail: (val: string) => void;
  custPhone: string;
  setCustPhone: (val: string) => void;
  custDepartamento: string;
  setCustDepartamento: (val: string) => void;
  custMunicipio: string;
  setCustMunicipio: (val: string) => void;
  custDireccion: string;
  setCustDireccion: (val: string) => void;
  onSaveCustomer: (e: React.FormEvent) => void;
}

export const PosCustomerFormModal: React.FC<PosCustomerFormModalProps> = ({
  isOpen,
  onClose,
  editingCustomerId,
  custTipoPersona,
  setCustTipoPersona,
  custTipoDocumento,
  setCustTipoDocumento,
  custDocumentoPreferido,
  setCustDocumentoPreferido,
  custName,
  setCustName,
  custNombreComercial,
  setCustNombreComercial,
  custNumDocumento,
  setCustNumDocumento,
  custNrc,
  setCustNrc,
  custGiro,
  setCustGiro,
  custCategoria,
  setCustCategoria,
  custEmail,
  setCustEmail,
  custPhone,
  setCustPhone,
  custDepartamento,
  setCustDepartamento,
  custMunicipio,
  setCustMunicipio,
  custDireccion,
  setCustDireccion,
  onSaveCustomer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="clay-card w-full max-w-2xl p-6 relative bg-white animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>{editingCustomerId ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            Formulario oficial para emisión de Facturas a Consumidor (FC) y Comprobantes de Crédito Fiscal (CCF).
          </p>
        </div>

        <form onSubmit={onSaveCustomer} className="space-y-4">
          {/* Tipo de Persona Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Tipo de Contribuyente / Persona *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCustTipoPersona('NATURAL');
                  setCustTipoDocumento('DUI');
                  setCustDocumentoPreferido('01');
                }}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  custTipoPersona === 'NATURAL'
                    ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Persona Natural</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustTipoPersona('JURIDICA');
                  setCustTipoDocumento('NIT');
                  setCustDocumentoPreferido('03');
                }}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  custTipoPersona === 'JURIDICA'
                    ? 'bg-purple-600 text-white shadow-md border-purple-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Persona Jurídica (Empresa)</span>
              </button>
            </div>
          </div>

          {/* Documento Tributario Preferido para Facturación */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Documento Tributario Preferido para Facturación *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setCustDocumentoPreferido('01')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center text-center gap-1 ${
                  custDocumentoPreferido === '01'
                    ? 'bg-emerald-600 text-white shadow-md border-emerald-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="leading-tight">Factura FC (01)</span>
                <span className={`text-[9.5px] ${custDocumentoPreferido === '01' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Consumidor Final
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCustDocumentoPreferido('03')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center text-center gap-1 ${
                  custDocumentoPreferido === '03'
                    ? 'bg-purple-600 text-white shadow-md border-purple-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="leading-tight">Crédito Fiscal CCF (03)</span>
                <span className={`text-[9.5px] ${custDocumentoPreferido === '03' ? 'text-purple-100' : 'text-slate-400'}`}>
                  Contribuyentes
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCustDocumentoPreferido('TICKET')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center text-center gap-1 ${
                  custDocumentoPreferido === 'TICKET'
                    ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ReceiptText className="w-4 h-4" />
                <span className="leading-tight">Ticket de Venta</span>
                <span className={`text-[9.5px] ${custDocumentoPreferido === 'TICKET' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Venta Mostrador
                </span>
              </button>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Este documento se seleccionará automáticamente al cotizar o mandar a bodega, y viajará a Caja al facturar.
            </p>
          </div>

          {/* Nombre / Razón Social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {custTipoPersona === 'JURIDICA' ? 'Razón Social (según Tarjeta NRC) *' : 'Nombre Completo *'}
              </label>
              <input
                type="text"
                required
                placeholder={custTipoPersona === 'JURIDICA' ? 'Ej. Distribuidora Las Fragancias S.A. de C.V.' : 'Ej. María Julia Hernández'}
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="clay-input w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nombre Comercial (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Boutique Elegance"
                value={custNombreComercial}
                onChange={(e) => setCustNombreComercial(e.target.value)}
                className="clay-input w-full text-xs"
              />
            </div>
          </div>

          {/* Documentos de Identidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tipo de Documento *
              </label>
              <select
                value={custTipoDocumento}
                onChange={(e) => setCustTipoDocumento(e.target.value as TipoDocumentoCliente)}
                className="clay-input w-full text-xs font-bold"
              >
                <option value="DUI">DUI (El Salvador)</option>
                <option value="NIT">NIT (El Salvador)</option>
                <option value="PASAPORTE">Pasaporte (Extranjero)</option>
                <option value="CARNET_RESIDENCIA">Carnet de Residente</option>
                <option value="OTRO">Otro Documento</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                N° de Documento ({custTipoDocumento}) *
              </label>
              <input
                type="text"
                required
                placeholder={custTipoDocumento === 'DUI' ? '00000000-0' : '0614-000000-000-0'}
                value={custNumDocumento}
                onChange={(e) => setCustNumDocumento(e.target.value)}
                className="clay-input w-full text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                NRC {custTipoPersona === 'JURIDICA' ? '(Requerido CCF) *' : '(Si es Contribuyente)'}
              </label>
              <input
                type="text"
                required={custTipoPersona === 'JURIDICA'}
                placeholder="Ej. 123456-7"
                value={custNrc}
                onChange={(e) => setCustNrc(e.target.value)}
                className="clay-input w-full text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Giro / Actividad Económica para CCF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Actividad Económica / Giro (para Hacienda CCF)
              </label>
              <input
                type="text"
                placeholder="Ej. Venta al por menor de cosméticos y perfumes"
                value={custGiro}
                onChange={(e) => setCustGiro(e.target.value)}
                className="clay-input w-full text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Categoría Contribuyente
              </label>
              <select
                value={custCategoria}
                onChange={(e) => setCustCategoria(e.target.value as CategoriaContribuyente)}
                className="clay-input w-full text-xs font-bold"
              >
                <option value="OTRO">Otro / General</option>
                <option value="MEDIANO">Mediano Contribuyente</option>
                <option value="GRANDE">Gran Contribuyente</option>
              </select>
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Correo Electrónico (Recepción DTE PDF/JSON) *
              </label>
              <input
                type="email"
                required
                placeholder="facturacion@cliente.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                className="clay-input w-full text-xs font-bold font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="text"
                required
                placeholder="7700-0000"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="clay-input w-full text-xs font-mono"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Departamento
              </label>
              <select
                value={custDepartamento}
                onChange={(e) => {
                  const newDept = e.target.value;
                  setCustDepartamento(newDept);
                  const munis = getMunicipiosByDepartamento(newDept);
                  if (munis.length > 0) {
                    setCustMunicipio(munis[0].nombre);
                  }
                }}
                className="clay-input w-full text-xs font-bold"
              >
                {DEPARTAMENTOS_CATALOG.map((dep) => (
                  <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Municipio / Distrito (Oficial MH)
              </label>
              <select
                value={custMunicipio}
                onChange={(e) => setCustMunicipio(e.target.value)}
                className="clay-input w-full text-xs font-bold"
              >
                {getMunicipiosByDepartamento(custDepartamento).map((m) => (
                  <option key={m.id} value={m.nombre}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Dirección Detallada (Calle, Colonia, N° Local o Casa)
            </label>
            <input
              type="text"
              placeholder="Ej. Colonia Escalón, Calle El Mirador #42"
              value={custDireccion}
              onChange={(e) => setCustDireccion(e.target.value)}
              className="clay-input w-full text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="clay-btn clay-btn-primary px-5 py-2 text-xs font-black flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
