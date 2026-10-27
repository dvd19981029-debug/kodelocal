'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  Mail,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Send,
  MessageCircle,
  Copy,
  ExternalLink,
  Link2,
  Calendar,
  ChevronDown,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import {
  CatalogoItem,
  ClienteDirectorioItem,
  FormaPagoItem,
  Vendedora,
  PedidoItem,
  PagoRegistroItem,
} from '../../types';
import {
  DEPARTAMENTOS_CATALOG,
  getMunicipiosByDepto,
} from '@/lib/svTerritory';
import { compressAndUploadImage } from '../../utils/imageUpload';

interface NuevoPedidoFormProps {
  catalogo: CatalogoItem[];
  directorioClientes: ClienteDirectorioItem[];
  formasPago: FormaPagoItem[];
  vendedoras: Vendedora[];
  vendedoraSeleccionada: string;
  onVendedoraSeleccionadaChange: (id: string) => void;
  currentUser?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  } | null;
  onGuardarPedido: (pedidoPayload: any) => Promise<void>;
  loading: boolean;
  onBack: () => void;
  onRegistrarNuevoCliente: () => void;
  onVerDirectorioClientes: () => void;
  onViewComprobante: (url: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialCliente?: ClienteDirectorioItem | null;
  initialPerfume?: CatalogoItem | null;
}

interface ModalPerfumeFormProps {
  isOpen: boolean;
  onClose: () => void;
  draft: PedidoItem;
  setDraft: React.Dispatch<React.SetStateAction<PedidoItem>>;
  onSave: () => void;
  catalogo: CatalogoItem[];
  idPedidoTemporal: string;
  isEditing: boolean;
}

function ModalPerfumeForm({
  isOpen,
  onClose,
  draft,
  setDraft,
  onSave,
  catalogo,
  idPedidoTemporal,
  isEditing,
}: ModalPerfumeFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setIsDropdownOpen(false);
      setValidationError('');
    }
  }, [isOpen]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return catalogo.slice(0, 60);
    return catalogo
      .filter((p) => {
        if (p.activo === false) return false;
        return (
          p.codigo.toLowerCase().includes(q) ||
          p.contratipo.toLowerCase().includes(q) ||
          (p.marca_inspirada && p.marca_inspirada.toLowerCase().includes(q)) ||
          (p.genero && p.genero.toLowerCase().includes(q))
        );
      })
      .slice(0, 60);
  }, [catalogo, searchQuery]);

  const selectedLabel = draft.contratipo
    ? `${draft.contratipo}${draft.marca ? ` - ${draft.marca}` : ''}${draft.genero ? ` - ${draft.genero}` : ''} - ${draft.codigo}`
    : '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSelectPerfume = (p: CatalogoItem) => {
    const isPlus = draft.version === 'Plus';
    const precio = isPlus
      ? parseFloat(p.precio_extra_shot?.toString() || '25')
      : parseFloat(p.precio_normal?.toString() || '20');

    setDraft((prev) => ({
      ...prev,
      catalogo_id: p.id,
      codigo: p.codigo,
      contratipo: p.contratipo,
      marca: p.marca_inspirada,
      genero: p.genero,
      precio_unitario: precio,
      subtotal: (prev.cantidad || 1) * precio,
    }));
    setValidationError('');
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleConfirmSave = () => {
    if (!draft.catalogo_id || !draft.contratipo) {
      setValidationError('Por favor haz clic en "Kodigo" y selecciona un perfume de la lista.');
      setIsDropdownOpen(true);
      return;
    }
    setValidationError('');
    onSave();
  };

  const handleChangeVersion = (ver: 'Normal' | 'Plus') => {
    const perfume = catalogo.find((p) => p.id === draft.catalogo_id);
    let precio = draft.precio_unitario;

    if (perfume) {
      precio =
        ver === 'Plus'
          ? parseFloat(perfume.precio_extra_shot?.toString() || '25')
          : parseFloat(perfume.precio_normal?.toString() || '20');
    } else {
      precio = ver === 'Plus' ? 25 : 20;
    }

    setDraft((prev) => ({
      ...prev,
      version: ver,
      precio_unitario: precio,
      subtotal: (prev.cantidad || 1) * precio,
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#18191c] rounded-3xl p-5 sm:p-6 border border-slate-800 text-slate-100 shadow-2xl max-w-md w-full space-y-4 max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
        {/* Header: ID Pedido & Cerrar */}
        <div className="flex items-start justify-between">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              ID Pedido
            </label>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#26272b] text-slate-200 text-xs font-mono font-bold border border-slate-700">
              {draft.id || idPedidoTemporal}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fecha Registro */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Fecha Registro
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={draft.fecha_registro || new Date().toLocaleString('es-SV')}
              className="w-full bg-[#202125] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none cursor-default"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Kodigo (Buscador desplegable) */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Kodigo
          </label>
          <div
            className={`relative rounded-xl border transition-all ${
              draft.catalogo_id
                ? 'border-blue-500 ring-1 ring-blue-500 bg-[#202125]'
                : 'border-slate-700/80 bg-[#202125]'
            }`}
          >
            <input
              type="text"
              value={isDropdownOpen ? searchQuery : selectedLabel}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isDropdownOpen) setIsDropdownOpen(true);
              }}
              onFocus={() => {
                setSearchQuery('');
                setIsDropdownOpen(true);
              }}
              placeholder="Buscar perfume (ej. Bleu De Chanel, Paco Rabanne)..."
              className="w-full bg-transparent px-3.5 py-2.5 pr-16 text-xs text-slate-100 font-medium focus:outline-none placeholder:text-slate-500"
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {draft.catalogo_id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDraft((prev) => ({
                      ...prev,
                      catalogo_id: '',
                      codigo: '',
                      contratipo: '',
                      marca: '',
                      genero: '',
                      precio_unitario: prev.version === 'Plus' ? 25 : 20,
                      subtotal: (prev.cantidad || 1) * (prev.version === 'Plus' ? 25 : 20),
                    }));
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Limpiar selección"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Menú desplegable */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#202125] border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800">
              {filteredCatalog.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 font-medium">
                  No se encontraron fragancias para &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredCatalog.map((p) => {
                  const isSelected = draft.catalogo_id === p.id;
                  const formattedOption = `${p.contratipo}${p.marca_inspirada ? ` - ${p.marca_inspirada}` : ''}${p.genero ? ` - ${p.genero}` : ''} - ${p.codigo}`;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPerfume(p)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 font-bold'
                          : 'text-slate-200 hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="truncate pr-2">{formattedOption}</span>
                      <span className="font-mono text-[11px] text-emerald-400 shrink-0 font-bold">
                        ${parseFloat(p.precio_normal?.toString() || '20').toFixed(2)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
          {/* Error si no seleccionó perfume */}
          {validationError && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Inv Fisico */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Inv Fisico
          </label>
          <input
            type="number"
            min="0"
            value={draft.inv_fisico ?? 0}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, inv_fisico: Number(e.target.value) || 0 }))
            }
            className="w-full bg-[#202125] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Version */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Version
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleChangeVersion('Normal')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                draft.version === 'Normal'
                  ? 'bg-[#2563eb] text-white shadow-sm border border-blue-500'
                  : 'bg-[#202125] text-slate-300 border border-slate-700/80 hover:bg-[#282a2f]'
              }`}
            >
              Normal ($20)
            </button>
            <button
              type="button"
              onClick={() => handleChangeVersion('Plus')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                draft.version === 'Plus'
                  ? 'bg-[#2563eb] text-white shadow-sm border border-blue-500'
                  : 'bg-[#202125] text-slate-300 border border-slate-700/80 hover:bg-[#282a2f]'
              }`}
            >
              Plus ($25)
            </button>
          </div>
        </div>

        {/* Estado Compra */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Estado Compra
          </label>
          <div className="relative">
            <select
              value={draft.estado_compra || 'Registrado'}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, estado_compra: e.target.value }))
              }
              className="w-full bg-[#202125] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium appearance-none cursor-pointer focus:outline-none focus:border-blue-500 pr-9"
            >
              <option value="Registrado">Registrado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Comprado">Comprado</option>
              <option value="No Aplica">No Aplica</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Subtotal Preview */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#202125] border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">
            Precio Unitario: <strong className="text-slate-200 font-mono">${(Number(draft.precio_unitario) || 20).toFixed(2)}</strong>
          </span>
          <span className="text-slate-300 font-semibold font-mono">
            Subtotal: <strong className="text-emerald-400 font-mono">${(Number(draft.subtotal) || 20).toFixed(2)}</strong>
          </span>
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="w-full py-2.5 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-900/40 cursor-pointer"
          >
            {isEditing ? 'Guardar Cambios' : 'Añadir a la Orden'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NuevoPedidoForm({
  catalogo,
  directorioClientes,
  formasPago,
  vendedoras,
  vendedoraSeleccionada,
  onVendedoraSeleccionadaChange,
  currentUser,
  onGuardarPedido,
  loading,
  onBack,
  onRegistrarNuevoCliente,
  onVerDirectorioClientes,
  onViewComprobante,
  showToast,
  initialCliente,
  initialPerfume,
}: NuevoPedidoFormProps) {
  // Datos del Cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteTipoDoc, setClienteTipoDoc] = useState('DUI');
  const [clienteNumDoc, setClienteNumDoc] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteDepto, setClienteDepto] = useState('');
  const [clienteMuni, setClienteMuni] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteReferencia, setClienteReferencia] = useState('');
  const [contactoAdicional, setContactoAdicional] = useState('');
  const [mostrarSugerenciasCliente, setMostrarSugerenciasCliente] = useState(false);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string | null>(null);

  // Fragancias del Pedido
  const [itemsPedido, setItemsPedido] = useState<PedidoItem[]>([]);
  const [idPedidoTemporal] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const mon = pad(d.getMonth() + 1);
    const yr = d.getFullYear();
    const rand = Math.random().toString(36).substring(2, 6);
    return `PED-${day}${mon}${yr}-${rand}`;
  });
  const [filtroGenero, setFiltroGenero] = useState<string>('TODOS');
  const [busquedaPerfume, setBusquedaPerfume] = useState('');

  // Finanzas y Pagos
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
  const [descuentoManual, setDescuentoManual] = useState<boolean>(false);
  const [solicitudesEspeciales, setSolicitudesEspeciales] = useState('');
  const [pagosPedido, setPagosPedido] = useState<PagoRegistroItem[]>([]);
  const [pagoInputFormaId, setPagoInputFormaId] = useState<string>('1003');
  const [pagoInputMonto, setPagoInputMonto] = useState<string>('');
  const [pagoInputDoc, setPagoInputDoc] = useState<string>('');
  const [pagoInputComprobante, setPagoInputComprobante] = useState<string>('');
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);

  // Aplicar initialCliente o initialPerfume si se recibieron
  useEffect(() => {
    if (initialCliente) {
      setClienteNombre(initialCliente.nombre);
      setClienteTelefono(initialCliente.telefono);
      setClienteDireccion(initialCliente.direccion);
      setClienteDepto(initialCliente.departamento);
      setClienteMuni(initialCliente.municipio);
      setClienteReferencia(initialCliente.referencia || '');
      setClienteTipoDoc(initialCliente.tipo_documento || 'DUI');
      setClienteNumDoc(initialCliente.numero_documento || '');
      setClienteEmail(initialCliente.email || '');
      setClienteSeleccionadoId(initialCliente.id);
    }
  }, [initialCliente]);

  useEffect(() => {
    if (initialPerfume && itemsPedido.length === 0) {
      const precio = parseFloat(initialPerfume.precio_normal?.toString() || '20');
      setItemsPedido([
        {
          id: idPedidoTemporal,
          catalogo_id: initialPerfume.id,
          codigo: initialPerfume.codigo,
          contratipo: initialPerfume.contratipo,
          marca: initialPerfume.marca_inspirada,
          genero: initialPerfume.genero,
          version: 'Normal',
          cantidad: 1,
          precio_unitario: precio,
          subtotal: precio,
          inv_fisico: 0,
          estado_compra: 'Registrado',
          fecha_registro: new Date().toLocaleString('es-SV'),
        },
      ]);
    }
  }, [initialPerfume, idPedidoTemporal]);

  const municipiosDisponibles = useMemo(() => {
    if (!clienteDepto) return [];
    return getMunicipiosByDepto(clienteDepto);
  }, [clienteDepto]);

  // Autocompletado de Clientes
  const clientesSugeridos = useMemo(() => {
    if (!clienteNombre.trim() || clienteSeleccionadoId) return [];
    const q = clienteNombre.toLowerCase().trim();
    return directorioClientes
      .filter((c) => {
        const nom = (c.nombre || '').toLowerCase();
        const tel = (c.telefono || '').toLowerCase();
        const doc = (c.numero_documento || '').toLowerCase();
        return nom.includes(q) || tel.includes(q) || doc.includes(q);
      })
      .slice(0, 6);
  }, [clienteNombre, clienteSeleccionadoId, directorioClientes]);

  const handleSeleccionarClienteSugerido = (c: ClienteDirectorioItem) => {
    setClienteNombre(c.nombre);
    setClienteTelefono(c.telefono);
    setClienteDireccion(c.direccion);
    setClienteDepto(c.departamento);
    setClienteMuni(c.municipio);
    setClienteReferencia(c.referencia || '');
    setClienteTipoDoc(c.tipo_documento || 'DUI');
    setClienteNumDoc(c.numero_documento || '');
    setClienteEmail(c.email || '');
    setClienteSeleccionadoId(c.id);
    setMostrarSugerenciasCliente(false);
    showToast(`Cliente "${c.nombre}" seleccionado`, 'info');
  };

  // Filtrado de Catálogo en el formulario
  const perfumesFiltrados = useMemo(() => {
    return catalogo.filter((p) => {
      if (p.activo === false) return false;
      if (filtroGenero !== 'TODOS') {
        const gen = (p.genero || '').toUpperCase();
        if (filtroGenero === 'CABALLERO' && !gen.includes('CABALLERO') && !gen.includes('HOMBRE') && gen !== 'H') return false;
        if (filtroGenero === 'DAMA' && !gen.includes('DAMA') && !gen.includes('MUJER') && gen !== 'F') return false;
        if (filtroGenero === 'UNISEX' && !gen.includes('UNISEX') && !gen.includes('MIXTO') && (gen.includes('CABALLERO') || gen.includes('DAMA'))) return false;
      }
      if (busquedaPerfume.trim()) {
        const q = busquedaPerfume.toLowerCase();
        return (
          p.codigo.toLowerCase().includes(q) ||
          p.contratipo.toLowerCase().includes(q) ||
          (p.marca_inspirada || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalogo, filtroGenero, busquedaPerfume]);

  const getFechaRegistroActual = () => {
    return new Date().toLocaleString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Estados para Modal de Agregar / Editar Perfume
  const [modalPerfumeOpen, setModalPerfumeOpen] = useState(false);
  const [perfumeEnEdicionIndex, setPerfumeEnEdicionIndex] = useState<number | null>(null);
  const [modalDraft, setModalDraft] = useState<PedidoItem>({
    id: '',
    catalogo_id: '',
    codigo: '',
    contratipo: '',
    marca: '',
    genero: '',
    version: 'Normal',
    cantidad: 1,
    precio_unitario: 20,
    subtotal: 20,
    inv_fisico: 0,
    estado_compra: 'Registrado',
    fecha_registro: '',
  });

  const handleAbrirModalNuevo = () => {
    setPerfumeEnEdicionIndex(null);
    setModalDraft({
      id: idPedidoTemporal,
      catalogo_id: '',
      codigo: '',
      contratipo: '',
      marca: '',
      genero: '',
      version: 'Normal',
      cantidad: 1,
      precio_unitario: 20,
      subtotal: 20,
      inv_fisico: 0,
      estado_compra: 'Registrado',
      fecha_registro: getFechaRegistroActual(),
    });
    setModalPerfumeOpen(true);
  };

  const handleAbrirModalEditar = (idx: number) => {
    setPerfumeEnEdicionIndex(idx);
    setModalDraft({ ...itemsPedido[idx] });
    setModalPerfumeOpen(true);
  };

  const handleGuardarModalDraft = () => {
    if (!modalDraft.catalogo_id || !modalDraft.contratipo) {
      showToast('Por favor selecciona una fragancia en Kodigo', 'error');
      return;
    }

    if (perfumeEnEdicionIndex === null) {
      setItemsPedido((prev) => [...prev, modalDraft]);
      showToast(`Perfume "${modalDraft.contratipo}" añadido a la orden`, 'success');
    } else {
      setItemsPedido((prev) =>
        prev.map((it, i) => (i === perfumeEnEdicionIndex ? modalDraft : it))
      );
      showToast(`Perfume "${modalDraft.contratipo}" actualizado`, 'info');
    }

    setModalPerfumeOpen(false);
  };

  const handleAgregarNuevoPerfume = (perfume?: CatalogoItem) => {
    const fecha = getFechaRegistroActual();
    const precio = perfume
      ? parseFloat(perfume.precio_normal?.toString() || '20')
      : 20;

    const nuevoItem: PedidoItem = {
      id: `${idPedidoTemporal}`,
      catalogo_id: perfume ? perfume.id : '',
      codigo: perfume ? perfume.codigo : '',
      contratipo: perfume ? perfume.contratipo : '',
      marca: perfume ? perfume.marca_inspirada : '',
      genero: perfume ? perfume.genero : '',
      version: 'Normal',
      cantidad: 1,
      precio_unitario: precio,
      subtotal: precio,
      inv_fisico: 0,
      estado_compra: 'Registrado',
      fecha_registro: fecha,
    };

    setItemsPedido((prev) => [...prev, nuevoItem]);
  };

  const handleCambiarCantidad = (index: number, delta: number) => {
    const target = itemsPedido[index];
    const nuevaCant = target.cantidad + delta;
    if (nuevaCant <= 0) {
      setItemsPedido(itemsPedido.filter((_, i) => i !== index));
    } else {
      setItemsPedido(
        itemsPedido.map((item, i) =>
          i === index
            ? { ...item, cantidad: nuevaCant, subtotal: nuevaCant * item.precio_unitario }
            : item
        )
      );
    }
  };

  const handleEliminarItem = (index: number) => {
    setItemsPedido(itemsPedido.filter((_, i) => i !== index));
  };

  // Total de frascos de perfume en el pedido
  const totalFrascos = useMemo(() => {
    return itemsPedido.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
  }, [itemsPedido]);

  // Regla Promoción KÖDE:
  // - 1er perfume a precio regular ($20 Normal o $25 Plus).
  // - A partir del 2do perfume, $5.00 de descuento por cada perfume adicional.
  const descuentoPromoCalculado = useMemo(() => {
    return totalFrascos >= 2 ? (totalFrascos - 1) * 5 : 0;
  }, [totalFrascos]);

  // Sincronizar automáticamente el descuento de la promoción mientras no haya override manual
  useEffect(() => {
    if (!descuentoManual) {
      setDescuento(descuentoPromoCalculado);
    }
  }, [descuentoPromoCalculado, descuentoManual]);

  // Si se vacía la lista de items, resetear el flag manual
  useEffect(() => {
    if (itemsPedido.length === 0) {
      setDescuentoManual(false);
    }
  }, [itemsPedido.length]);

  // Cálculos Financieros
  const subtotalPedido = useMemo(() => {
    return itemsPedido.reduce((acc, it) => acc + it.subtotal, 0);
  }, [itemsPedido]);

  const totalPedido = useMemo(() => {
    return Math.max(0, subtotalPedido + (costoEnvio || 0) - (descuento || 0));
  }, [subtotalPedido, costoEnvio, descuento]);

  const totalPagadoPedido = useMemo(() => {
    return pagosPedido.reduce((acc, p) => acc + p.monto, 0);
  }, [pagosPedido]);

  const totalAnticipoBancos = useMemo(() => {
    return pagosPedido
      .filter((p) => p.forma_pago_id !== '1003')
      .reduce((acc, p) => acc + p.monto, 0);
  }, [pagosPedido]);

  const montoCobroEntrega = useMemo(() => {
    return pagosPedido
      .filter((p) => p.forma_pago_id === '1003')
      .reduce((acc, p) => acc + p.monto, 0);
  }, [pagosPedido]);

  const balancePendiente = useMemo(() => {
    return Math.max(0, totalPedido - totalPagadoPedido);
  }, [totalPedido, totalPagadoPedido]);

  // Agregar Pago
  const handleAgregarPago = () => {
    const monto = parseFloat(pagoInputMonto);
    if (isNaN(monto) || monto <= 0) {
      showToast('Ingresa un monto válido para el pago ($)', 'error');
      return;
    }
    const forma = formasPago.find((f) => f.id === pagoInputFormaId);
    if (!forma) {
      showToast('Selecciona una forma de pago válida', 'error');
      return;
    }
    if (subiendoComprobante) {
      showToast('Espera a que termine de subir la captura del comprobante', 'error');
      return;
    }
    if (forma.tipo === 'BANCO' && !pagoInputComprobante.trim()) {
      showToast('Es obligatorio adjuntar la captura del comprobante para pagos de cuenta bancaria', 'error');
      return;
    }

    const nuevoPago: PagoRegistroItem = {
      id: `${Date.now()}`,
      forma_pago_id: forma.id,
      forma_pago_nombre: forma.nombre,
      forma_pago_tipo: forma.tipo,
      monto,
      num_documento_auto: pagoInputDoc.trim() || undefined,
      comprobante_url: pagoInputComprobante.trim() || null,
      observaciones: '',
    };

    setPagosPedido([...pagosPedido, nuevoPago]);
    setPagoInputMonto('');
    setPagoInputDoc('');
    setPagoInputComprobante('');
    showToast(`Pago de $${monto.toFixed(2)} (${forma.nombre}) agregado`, 'success');
  };

  const handleAgregarPagoDirecto = (
    formaId: string,
    formaNombre: string,
    formaTipo: string,
    monto: number,
    numDoc: string = '',
    obs: string = ''
  ) => {
    const nuevoPago: PagoRegistroItem = {
      id: `${Date.now()}`,
      forma_pago_id: formaId,
      forma_pago_nombre: formaNombre,
      forma_pago_tipo: formaTipo,
      monto,
      num_documento_auto: numDoc || undefined,
      observaciones: obs,
    };
    setPagosPedido([...pagosPedido, nuevoPago]);
    showToast(`Registrado $${monto.toFixed(2)} en ${formaNombre}`, 'info');
  };

  const handleEliminarPago = (index: number) => {
    setPagosPedido(pagosPedido.filter((_, i) => i !== index));
  };

  // Submit Final
  const handleGuardar = () => {
    if (!clienteNombre.trim() || !clienteTelefono.trim() || !clienteDepto || !clienteMuni || !clienteDireccion.trim()) {
      showToast('Por favor completa todos los datos obligatorios del cliente (*)', 'error');
      return;
    }
    if (itemsPedido.length === 0) {
      showToast('Debes agregar al menos un perfume al pedido', 'error');
      return;
    }
    const perfumeIncompleto = itemsPedido.some((it) => !it.catalogo_id || !it.contratipo);
    if (perfumeIncompleto) {
      showToast('Por favor selecciona la fragancia (Kodigo) en cada perfume del pedido', 'error');
      return;
    }

    if (subiendoComprobante) {
      showToast('Espera a que termine de subir la captura del comprobante', 'error');
      return;
    }

    // Exigir que se haya registrado explícitamente la forma de pago en la lista de pagos del pedido
    if (pagosPedido.length === 0) {
      showToast('Debes registrar una forma de pago (haz clic en "+ Agregar Pago") antes de guardar el pedido', 'error');
      return;
    }

    const pagosFinales = [...pagosPedido];

    const pagoBancoSinComprobante = pagosFinales.find(
      (p) => p.forma_pago_tipo === 'BANCO' && !p.comprobante_url?.trim()
    );
    if (pagoBancoSinComprobante) {
      showToast(
        `Es obligatorio adjuntar la captura del comprobante para el pago en ${pagoBancoSinComprobante.forma_pago_nombre}`,
        'error'
      );
      return;
    }

    const sumaActual = pagosFinales.reduce((acc, p) => acc + p.monto, 0);
    const saldoRestante = Number((totalPedido - sumaActual).toFixed(2));

    if (saldoRestante > 0) {
      showToast(
        `Aún queda un saldo sin asignar de $${saldoRestante.toFixed(2)}. Registra la forma de pago restante antes de guardar el pedido.`,
        'error'
      );
      return;
    }

    const totalCCE = pagosFinales
      .filter((p) => p.forma_pago_id === '1003')
      .reduce((acc, p) => acc + p.monto, 0);

    const esPromoOficial = totalFrascos >= 2 && descuento === descuentoPromoCalculado;
    const notaDescuento = esPromoOficial
      ? `Promo KÖDE (-$${descuento.toFixed(2)})`
      : descuento > 0
      ? `Descuento: $${descuento.toFixed(2)}`
      : null;

    const notasConsolidadas = [
      solicitudesEspeciales.trim() ? `Solicitudes: ${solicitudesEspeciales.trim()}` : null,
      contactoAdicional.trim() ? `Contacto Adicional: ${contactoAdicional.trim()}` : null,
      notaDescuento,
      totalCCE > 0 ? `Cobro CCE: $${totalCCE.toFixed(2)}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    onGuardarPedido({
      cliente: {
        nombre_completo: clienteNombre.trim(),
        telefono_whatsapp: clienteTelefono.trim(),
        departamento: clienteDepto,
        municipio: clienteMuni,
        direccion_entrega: clienteDireccion.trim(),
        punto_referencia: clienteReferencia.trim() || undefined,
        tipo_documento: clienteTipoDoc.trim() || 'DUI',
        numero_documento: clienteNumDoc.trim() || undefined,
        email: clienteEmail.trim() || undefined,
      },
      items: itemsPedido,
      costo_envio: costoEnvio,
      descuento: descuento,
      vendedora_id: vendedoraSeleccionada,
      notas: notasConsolidadas,
      pagos: pagosFinales.map((p) => ({
        forma_pago_id: p.forma_pago_id,
        monto: p.monto,
        num_documento_auto: p.num_documento_auto || '',
        comprobante_url: p.comprobante_url || '',
        observaciones: p.observaciones || '',
      })),
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Volver a Ventas
        </button>
        <span className="text-xs text-slate-500 font-medium">Formulario de Pedido WhatsApp</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Datos de Cliente & Fragancias */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tarjeta Datos del Cliente */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">Datos del Cliente</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onRegistrarNuevoCliente}
                  className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Registrar Cliente</span>
                </button>
                {directorioClientes.length > 0 && (
                  <button
                    type="button"
                    onClick={onVerDirectorioClientes}
                    className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Seleccionar ({directorioClientes.length})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Buscar Cliente / Nombre *</span>
                  </span>
                  {clienteSeleccionadoId && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Seleccionado</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe nombre, teléfono o DUI..."
                    value={clienteNombre}
                    onFocus={() => setMostrarSugerenciasCliente(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerenciasCliente(false), 200)}
                    onChange={(e) => {
                      setClienteNombre(e.target.value);
                      setClienteSeleccionadoId(null);
                      setMostrarSugerenciasCliente(true);
                    }}
                    className="clay-input w-full text-xs font-bold pr-8"
                    required
                  />
                  {clienteNombre && (
                    <button
                      type="button"
                      onClick={() => {
                        setClienteNombre('');
                        setClienteTelefono('');
                        setClienteDireccion('');
                        setClienteReferencia('');
                        setClienteNumDoc('');
                        setClienteEmail('');
                        setClienteSeleccionadoId(null);
                        setMostrarSugerenciasCliente(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Limpiar datos del cliente"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {mostrarSugerenciasCliente && clientesSugeridos.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 flex items-center justify-between">
                      <span>CLIENTES COINCIDENTES ({clientesSugeridos.length})</span>
                      <span className="text-[9px] text-indigo-600 font-semibold">Clic para autocompletar</span>
                    </div>
                    {clientesSugeridos.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={() => handleSeleccionarClienteSugerido(c)}
                        className="p-3 hover:bg-indigo-50/80 cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900">{c.nombre}</span>
                          <span className="font-mono text-[11px] text-emerald-700 font-bold">
                            {c.telefono}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {c.municipio}, {c.departamento} {c.direccion ? `• ${c.direccion}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Teléfono WhatsApp *</span>
                  {clienteTelefono.length >= 8 && (
                    <a
                      href={`https://wa.me/503${clienteTelefono.replace(/\D/g, '')}`}
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
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tipo de Doc.</span>
                </label>
                <select
                  value={clienteTipoDoc}
                  onChange={(e) => setClienteTipoDoc(e.target.value)}
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
                  N° de Documento
                </label>
                <input
                  type="text"
                  placeholder="Ej. 01234567-8"
                  value={clienteNumDoc}
                  onChange={(e) => setClienteNumDoc(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  placeholder="cliente@correo.com"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
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
                  value={clienteDepto}
                  onChange={(e) => {
                    const depto = e.target.value;
                    setClienteDepto(depto);
                    setClienteMuni('');
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
                  value={clienteMuni}
                  onChange={(e) => setClienteMuni(e.target.value)}
                  disabled={!clienteDepto}
                  className="clay-input w-full text-xs font-bold cursor-pointer disabled:opacity-50"
                  required
                >
                  <option value="">
                    {clienteDepto ? '-- Seleccionar Municipio --' : '-- Selecciona departamento --'}
                  </option>
                  {municipiosDisponibles.map((m: any) => {
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
                placeholder="Calle, número de casa, colonia, pasaje..."
                value={clienteDireccion}
                onChange={(e) => setClienteDireccion(e.target.value)}
                className="clay-input w-full text-xs font-medium resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Punto de Referencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Frente a Farmacia San Nicolás..."
                  value={clienteReferencia}
                  onChange={(e) => setClienteReferencia(e.target.value)}
                  className="clay-input w-full text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Contacto Adicional (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Recibe vigilante o familiar..."
                  value={contactoAdicional}
                  onChange={(e) => setContactoAdicional(e.target.value)}
                  className="clay-input w-full text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Modal de Formulario para Agregar o Editar Perfume */}
          <ModalPerfumeForm
            isOpen={modalPerfumeOpen}
            onClose={() => setModalPerfumeOpen(false)}
            draft={modalDraft}
            setDraft={setModalDraft}
            onSave={handleGuardarModalDraft}
            catalogo={catalogo}
            idPedidoTemporal={idPedidoTemporal}
            isEditing={perfumeEnEdicionIndex !== null}
          />

          {/* Tarjeta Detalle Pedido (Resumen en Tabla Limpia y Legible) */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Detalle del Pedido
                </h3>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {itemsPedido.length} {itemsPedido.length === 1 ? 'perfume' : 'perfumes'}
                </span>
                {totalFrascos > 0 && (
                  <span className="text-[11px] font-bold text-slate-500">
                    ({totalFrascos} {totalFrascos === 1 ? 'frasco total' : 'frascos totales'})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {totalFrascos >= 2 ? (
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                    <span>🎁</span> Promo 2+: -${descuentoPromoCalculado.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">
                    Subtotal: <strong className="text-slate-900">${subtotalPedido.toFixed(2)}</strong>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleAbrirModalNuevo}
                  className="clay-btn clay-btn-primary px-3.5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Perfume</span>
                </button>
              </div>
            </div>

            {/* Listado / Tabla Resumen */}
            {itemsPedido.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    No has agregado perfumes al pedido todavía
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pulsa &quot;+ Agregar Perfume&quot; para abrir el formulario y elegir la fragancia y su versión.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAbrirModalNuevo}
                  className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black rounded-xl inline-flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Primer Perfume</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                        <th className="py-3 px-3.5">Fragancia / Kodigo</th>
                        <th className="py-3 px-3 text-center">Versión</th>
                        <th className="py-3 px-3 text-right">Precio Unitario</th>
                        <th className="py-3 px-3 text-center">Cantidad</th>
                        <th className="py-3 px-3 text-right">Subtotal</th>
                        <th className="py-3 pr-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemsPedido.map((item, idx) => (
                        <tr key={`item-${idx}`} className="hover:bg-indigo-50/40 transition-colors">
                          {/* Fragancia / Kodigo */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200 shrink-0">
                                #{item.codigo || '—'}
                              </span>
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900 block truncate">
                                  {item.contratipo || 'Sin fragancia seleccionada'}
                                </span>
                                {item.marca && (
                                  <span className="text-[11px] text-slate-500 font-medium block truncate">
                                    {item.marca} {item.genero ? `• ${item.genero}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Version */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                                item.version === 'Plus'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {item.version}
                            </span>
                          </td>

                          {/* Precio Unitario */}
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700 whitespace-nowrap text-xs sm:text-sm">
                            ${(Number(item.precio_unitario) || 20).toFixed(2)}
                          </td>

                          {/* Cantidad con botones +/- */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidad(idx, -1)}
                                className="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-600 hover:bg-white hover:text-slate-900 cursor-pointer shadow-2xs"
                                title="Restar 1"
                              >
                                –
                              </button>
                              <span className="font-mono font-black text-xs px-1.5 text-slate-900">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidad(idx, 1)}
                                className="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-600 hover:bg-white hover:text-slate-900 cursor-pointer shadow-2xs"
                                title="Sumar 1"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-600 whitespace-nowrap text-sm">
                            ${(Number(item.subtotal) || 20).toFixed(2)}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 pr-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAbrirModalEditar(idx)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                                title="Editar perfume"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarItem(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                                title="Eliminar de la orden"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer de la tabla */}
                <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500">
                  <span className="font-medium">
                    Total frascos en pedido:{' '}
                    <strong className="text-slate-900 font-mono font-black">{totalFrascos}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleAbrirModalNuevo}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Otro Perfume</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Finanzas, Pagos y Confirmación */}
        <div className="lg:col-span-5 space-y-6">
          <div className="clay-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3">
              Resumen y Finanzas del Pedido
            </h3>

            {/* Banner Informativo de Promoción KÖDE */}
            {totalFrascos >= 2 ? (
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎁</span>
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      ¡Promoción KÖDE Aplicada!
                    </span>
                  </div>
                  <span className="font-mono font-black text-xs text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-2xs">
                    -${descuentoPromoCalculado.toFixed(2)} OFF
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  1er perfume a precio regular, y <strong>$5.00 de descuento</strong> en los <strong>{totalFrascos - 1}</strong> {totalFrascos - 1 === 1 ? 'frasco adicional' : 'frascos adicionales'}.
                </p>
                {descuento !== descuentoPromoCalculado && (
                  <div className="pt-1.5 border-t border-emerald-200/70 flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] text-amber-800 font-bold">
                      ⚠️ Descuento manual activo: ${descuento.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDescuento(descuentoPromoCalculado);
                        setDescuentoManual(false);
                      }}
                      className="text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                    >
                      ✨ Reaplicar promo oficial (-${descuentoPromoCalculado.toFixed(2)})
                    </button>
                  </div>
                )}
              </div>
            ) : totalFrascos === 1 ? (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center gap-2 text-amber-900 shadow-2xs animate-in fade-in duration-200">
                <span className="text-base">🏷️</span>
                <span className="text-[11px] font-medium leading-snug">
                  <strong>Promo KÖDE:</strong> ¡Agrega un 2° perfume y recibe <strong>$5.00 de descuento</strong> por cada frasco adicional!
                </span>
              </div>
            ) : null}

            {/* Subtotal, Envío y Descuento */}
            <div className="grid grid-cols-3 gap-2.5 items-end">
              <div className="flex flex-col justify-end">
                <div className="min-h-[22px] flex items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Sub Total ($)</label>
                </div>
                <div className="clay-input w-full h-[42px] flex items-center text-xs font-mono font-bold bg-slate-100">
                  ${subtotalPedido.toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="min-h-[22px] flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Descuento ($)</label>
                  {descuentoPromoCalculado > 0 && descuento === descuentoPromoCalculado && (
                    <span className="text-[8px] leading-none font-black uppercase text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300 whitespace-nowrap shrink-0">
                      Auto
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={descuento}
                  onChange={(e) => {
                    setDescuentoManual(true);
                    setDescuento(parseFloat(e.target.value) || 0);
                  }}
                  className={`clay-input w-full h-[42px] text-xs font-mono font-bold ${
                    descuento > 0 ? 'text-emerald-700 border-emerald-300 bg-emerald-50/30' : ''
                  }`}
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="min-h-[22px] flex items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Costo Envío ($)</label>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(parseFloat(e.target.value) || 0)}
                  className="clay-input w-full h-[42px] text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Módulo de Pagos / Abonos Mixtos */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-extrabold text-slate-800">
                    Formas de Pago / Abonos
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Pagos Mixtos
                </span>
              </div>

              {/* Formulario para agregar un pago */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2.5 shadow-xs">
                {(() => {
                  const formaActual = formasPago.find((f) => f.id === pagoInputFormaId);
                  const esWompi = Boolean(formaActual?.nombre?.toLowerCase().includes('wompi') || formaActual?.id === '1006');
                  const montoParaWompi = parseFloat(pagoInputMonto) || balancePendiente || totalPedido;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <div className="sm:col-span-5 flex flex-col justify-end">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase whitespace-nowrap">
                          Forma de Pago *
                        </label>
                        <select
                          value={pagoInputFormaId}
                          onChange={(e) => setPagoInputFormaId(e.target.value)}
                          className="clay-input w-full h-[42px] text-xs font-bold bg-white cursor-pointer"
                        >
                          {formasPago.filter((fp) => fp.activo !== false).map((fp) => (
                            <option key={fp.id} value={fp.id}>
                              {fp.nombre} ({fp.tipo})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 flex flex-col justify-end">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase whitespace-nowrap">
                          Monto ($) *
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder={balancePendiente > 0 ? balancePendiente.toFixed(2) : '0.00'}
                          value={pagoInputMonto}
                          onChange={(e) => setPagoInputMonto(e.target.value)}
                          className="clay-input w-full h-[42px] text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-4 flex flex-col justify-end">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase flex items-center justify-between whitespace-nowrap">
                          <span>{esWompi ? 'No. Auto Wompi' : 'No. Voucher / Ref'}</span>
                          {esWompi && (
                            <span className="text-[9px] font-bold text-indigo-600 lowercase bg-indigo-50 px-1 rounded">
                              código de aprobación
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={esWompi ? 'Ej. 984723 o Auto Wompi' : 'Ej. TRF-12345'}
                          value={pagoInputDoc}
                          onChange={(e) => setPagoInputDoc(e.target.value)}
                          className={`clay-input w-full h-[42px] text-xs font-mono ${
                            esWompi ? 'font-bold border-indigo-300 text-indigo-900 bg-indigo-50/20' : 'font-medium'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Adjuntar comprobante / captura */}
                {(() => {
                  const formaActual = formasPago.find((f) => f.id === pagoInputFormaId);
                  const esBanco = formaActual?.tipo === 'BANCO';
                  return (
                    <div
                      onPaste={async (e) => {
                        const items = e.clipboardData?.items;
                        if (!items) return;
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf('image') !== -1) {
                            const file = items[i].getAsFile();
                            if (file) {
                              e.preventDefault();
                              try {
                                setSubiendoComprobante(true);
                                const url = await compressAndUploadImage(file);
                                setPagoInputComprobante(url);
                                showToast('¡Comprobante adjuntado desde el portapapeles!', 'success');
                              } catch (err: any) {
                                showToast(err.message || 'Error al procesar captura', 'error');
                              } finally {
                                setSubiendoComprobante(false);
                              }
                              break;
                            }
                          }
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all ${
                        esBanco ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50/80 border-slate-200/70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                              esBanco ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            📸
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800">
                                Comprobante de Transferencia {esBanco ? '*' : ''}
                              </span>
                              {esBanco && !pagoInputComprobante && (
                                <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded leading-none">
                                  Obligatorio
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              Sube captura o pega con <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+V</kbd>
                            </span>
                          </div>
                        </div>

                        {pagoInputComprobante ? (
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-2xs">
                            <img
                              src={pagoInputComprobante}
                              alt="Comprobante"
                              className="w-8 h-8 rounded object-cover border border-slate-200 cursor-pointer hover:opacity-85"
                              onClick={() => onViewComprobante(pagoInputComprobante)}
                              title="Ver en tamaño completo"
                            />
                            <div className="text-[11px]">
                              <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Lista
                              </span>
                              <button
                                type="button"
                                onClick={() => onViewComprobante(pagoInputComprobante)}
                                className="text-indigo-600 hover:underline font-semibold block text-[10px] cursor-pointer"
                              >
                                Ver
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPagoInputComprobante('')}
                              className="text-slate-400 hover:text-rose-600 p-1 ml-1 rounded hover:bg-rose-50 cursor-pointer"
                              title="Eliminar captura"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label
                            className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-2xs ${
                              subiendoComprobante
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : esBanco
                                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            {subiendoComprobante ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Subiendo captura...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Adjuntar Captura</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={subiendoComprobante}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setSubiendoComprobante(true);
                                  const url = await compressAndUploadImage(file);
                                  setPagoInputComprobante(url);
                                  showToast('Comprobante adjuntado con éxito', 'success');
                                } catch (err: any) {
                                  showToast(err.message || 'Error al subir imagen', 'error');
                                } finally {
                                  setSubiendoComprobante(false);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Acciones para agregar pago */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {balancePendiente > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const contraEntrega = formasPago.find((f) => f.id === '1003') || {
                              id: '1003',
                              nombre: 'Contra Entrega',
                              tipo: 'CONTRA_ENTREGA',
                            };
                            handleAgregarPagoDirecto(
                              contraEntrega.id,
                              contraEntrega.nombre,
                              contraEntrega.tipo,
                              balancePendiente,
                              '',
                              'Cobro contra entrega C807'
                            );
                          }}
                          className="text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Asignar saldo restante a Contra Entrega"
                        >
                          ⚡ Saldar resto (${balancePendiente.toFixed(2)}) en Contra Entrega
                        </button>
                        <button
                          type="button"
                          onClick={() => setPagoInputMonto(balancePendiente.toFixed(2))}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline px-1 cursor-pointer"
                        >
                          Usar saldo (${balancePendiente.toFixed(2)})
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAgregarPago}
                    className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Pago
                  </button>
                </div>
              </div>

              {/* Lista de Pagos Agregados */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block px-1">
                  Pagos registrados para este pedido ({pagosPedido.length}):
                </span>

                {pagosPedido.length === 0 ? (
                  <div className="p-3 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-1.5">
                    <p className="font-semibold text-slate-700">No has registrado formas de pago aún.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const contraEntrega = formasPago.find((f) => f.id === '1003') || {
                          id: '1003',
                          nombre: 'Contra Entrega',
                          tipo: 'CONTRA_ENTREGA',
                        };
                        handleAgregarPagoDirecto(
                          contraEntrega.id,
                          contraEntrega.nombre,
                          contraEntrega.tipo,
                          totalPedido,
                          '',
                          'Cobro completo contra entrega'
                        );
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      📦 Registrar 100% Contra Entrega (${totalPedido.toFixed(2)})
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Forma de Pago</th>
                          <th className="py-2 px-3">Monto</th>
                          <th className="py-2 px-3">Comprobante / Ref</th>
                          <th className="py-2 px-3 text-center">Quitar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagosPedido.map((pago, idx) => (
                          <tr key={pago.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>{pago.forma_pago_id === '1003' ? '📦' : '🏦'}</span>
                                <span>{pago.forma_pago_nombre}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">
                              ${pago.monto.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {pago.num_documento_auto && (
                                  <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                    #{pago.num_documento_auto}
                                  </span>
                                )}
                                {pago.comprobante_url ? (
                                  <button
                                    type="button"
                                    onClick={() => onViewComprobante(pago.comprobante_url || '')}
                                    className="text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-0.5 rounded transition-colors shadow-2xs cursor-pointer"
                                  >
                                    Ver Captura
                                  </button>
                                ) : (
                                  !pago.num_documento_auto && (
                                    <span className="text-slate-400 font-mono text-[11px]">-</span>
                                  )
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleEliminarPago(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Eliminar pago"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Resumen Financiero en vivo */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalFrascos} {totalFrascos === 1 ? 'frasco' : 'frascos'}):</span>
                  <span className="font-mono font-bold text-slate-800">
                    ${subtotalPedido.toFixed(2)}
                  </span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span className="flex items-center gap-1">
                      <span>🎁 Descuento {descuento === descuentoPromoCalculado && totalFrascos >= 2 ? 'Promo KÖDE' : ''}:</span>
                    </span>
                    <span className="font-mono font-black text-emerald-700">
                      -${descuento.toFixed(2)}
                    </span>
                  </div>
                )}
                {costoEnvio > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Costo de Envío:</span>
                    <span className="font-mono font-bold text-slate-800">
                      +${costoEnvio.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-800 pt-1.5 border-t border-slate-100">
                  <span>Total del Pedido:</span>
                  <span className="font-mono text-indigo-700 text-sm font-black">
                    ${totalPedido.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Pagos Asignados:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ${totalPagadoPedido.toFixed(2)}
                  </span>
                </div>
                {totalAnticipoBancos > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>↳ Anticipo Transferencia/Bancos:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      ${totalAnticipoBancos.toFixed(2)}
                    </span>
                  </div>
                )}
                {montoCobroEntrega > 0 && (
                  <div className="flex justify-between text-amber-700 text-[11px] font-bold">
                    <span>↳ Cobro Contra Entrega (C807):</span>
                    <span className="font-mono font-bold">${montoCobroEntrega.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1.5 border-t border-slate-100">
                  <span>Saldo por asignar:</span>
                  <span
                    className={`font-mono font-black ${
                      balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    ${balancePendiente.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vendedora / Cajera Asignada (Fijada a la sesión activa) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendedora / Cajera Asignada (Sesión Activa)
              </label>
              <div className="clay-input w-full text-xs font-bold bg-slate-100 text-slate-800 flex items-center justify-between select-none">
                <span>
                  {currentUser?.nombre ||
                    vendedoras.find((v) => v.id === vendedoraSeleccionada)?.nombre ||
                    'Vendedor en Sesión'}
                </span>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  Sesión Activa
                </span>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observaciones y Solicitudes Especiales
              </label>
              <input
                type="text"
                placeholder="Observaciones de entrega, referencias adicionales..."
                value={solicitudesEspeciales}
                onChange={(e) => setSolicitudesEspeciales(e.target.value)}
                className="clay-input w-full text-xs font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleGuardar}
              disabled={loading || itemsPedido.length === 0}
              className="clay-btn clay-btn-success w-full py-3 text-xs font-black shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Guardando pedido...' : 'Registrar Pedido WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
