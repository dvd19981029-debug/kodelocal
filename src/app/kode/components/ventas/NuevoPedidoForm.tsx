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

export function NuevoPedidoForm({
  catalogo,
  directorioClientes,
  formasPago,
  vendedoras,
  vendedoraSeleccionada,
  onVendedoraSeleccionadaChange,
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
  const [filtroGenero, setFiltroGenero] = useState<string>('TODOS');
  const [busquedaPerfume, setBusquedaPerfume] = useState('');

  // Finanzas y Pagos
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
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
          catalogo_id: initialPerfume.id,
          codigo: initialPerfume.codigo,
          contratipo: initialPerfume.contratipo,
          marca: initialPerfume.marca_inspirada,
          version: 'Normal',
          cantidad: 1,
          precio_unitario: precio,
          subtotal: precio,
        },
      ]);
    }
  }, [initialPerfume]);

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

  // Manejo de Items del Pedido
  const handleAgregarItem = (perfume: CatalogoItem) => {
    const existe = itemsPedido.find(
      (item) => item.catalogo_id === perfume.id && item.version === 'Normal'
    );
    if (existe) {
      setItemsPedido(
        itemsPedido.map((item) =>
          item.catalogo_id === perfume.id && item.version === 'Normal'
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio_unitario,
              }
            : item
        )
      );
    } else {
      const precio = parseFloat(perfume.precio_normal?.toString() || '20');
      setItemsPedido([
        ...itemsPedido,
        {
          catalogo_id: perfume.id,
          codigo: perfume.codigo,
          contratipo: perfume.contratipo,
          marca: perfume.marca_inspirada,
          version: 'Normal',
          cantidad: 1,
          precio_unitario: precio,
          subtotal: precio,
        },
      ]);
    }
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

  const handleCambiarVersion = (index: number, version: 'Normal' | 'Plus') => {
    const item = itemsPedido[index];
    const perfume = catalogo.find((p) => p.id === item.catalogo_id);
    let nuevoPrecio = item.precio_unitario;

    if (perfume) {
      nuevoPrecio =
        version === 'Plus'
          ? parseFloat(perfume.precio_extra_shot?.toString() || '25')
          : parseFloat(perfume.precio_normal?.toString() || '20');
    }

    setItemsPedido(
      itemsPedido.map((it, i) =>
        i === index
          ? {
              ...it,
              version,
              precio_unitario: nuevoPrecio,
              subtotal: it.cantidad * nuevoPrecio,
            }
          : it
      )
    );
  };

  const handleEliminarItem = (index: number) => {
    setItemsPedido(itemsPedido.filter((_, i) => i !== index));
  };

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

    // Resolver pagos
    let pagosFinales = [...pagosPedido];
    const sumaActual = pagosFinales.reduce((acc, p) => acc + p.monto, 0);
    const saldoRestante = Math.max(0, totalPedido - sumaActual);

    if (pagosFinales.length === 0) {
      const contraEntrega = formasPago.find((f) => f.id === '1003') || {
        id: '1003',
        nombre: 'Contra Entrega',
        tipo: 'CONTRA_ENTREGA',
      };
      pagosFinales.push({
        id: `${Date.now()}`,
        forma_pago_id: contraEntrega.id,
        forma_pago_nombre: contraEntrega.nombre,
        forma_pago_tipo: contraEntrega.tipo,
        monto: totalPedido,
        num_documento_auto: '',
        observaciones: 'Pago completo contra entrega',
      });
    } else if (saldoRestante > 0) {
      const contraEntrega = formasPago.find((f) => f.id === '1003') || {
        id: '1003',
        nombre: 'Contra Entrega',
        tipo: 'CONTRA_ENTREGA',
      };
      pagosFinales.push({
        id: `${Date.now()}`,
        forma_pago_id: contraEntrega.id,
        forma_pago_nombre: contraEntrega.nombre,
        forma_pago_tipo: contraEntrega.tipo,
        monto: saldoRestante,
        num_documento_auto: '',
        observaciones: 'Saldo restante cobro contra entrega',
      });
    }

    const totalCCE = pagosFinales
      .filter((p) => p.forma_pago_id === '1003')
      .reduce((acc, p) => acc + p.monto, 0);

    const notasConsolidadas = [
      solicitudesEspeciales.trim() ? `Solicitudes: ${solicitudesEspeciales.trim()}` : null,
      contactoAdicional.trim() ? `Contacto Adicional: ${contactoAdicional.trim()}` : null,
      descuento > 0 ? `Descuento: $${descuento}` : null,
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

          {/* Tarjeta Fragancias / Perfumes del Pedido */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">
                Fragancias del Pedido ({itemsPedido.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Subtotal: ${subtotalPedido.toFixed(2)}
              </span>
            </div>

            {/* Selector de Catálogo */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-700">Añadir del Catálogo:</span>
                <div className="flex items-center gap-1">
                  {['TODOS', 'CABALLERO', 'DAMA', 'UNISEX'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFiltroGenero(g)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        filtroGenero === g
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaPerfume}
                  onChange={(e) => setBusquedaPerfume(e.target.value)}
                  placeholder="Filtrar por código o nombre..."
                  className="clay-input w-full text-xs pl-8 pr-7 py-1.5"
                />
                {busquedaPerfume && (
                  <button
                    type="button"
                    onClick={() => setBusquedaPerfume('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                {perfumesFiltrados.slice(0, 30).map((perfume) => (
                  <button
                    key={perfume.id}
                    type="button"
                    onClick={() => handleAgregarItem(perfume)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
                  >
                    <span className="font-mono text-indigo-600 group-hover:text-indigo-800">
                      #{perfume.codigo}
                    </span>
                    <span className="truncate max-w-[140px]">{perfume.contratipo}</span>
                    <span className="font-mono text-[11px] text-emerald-600 font-black">
                      ${parseFloat(perfume.precio_normal?.toString() || '20').toFixed(2)}
                    </span>
                    <Plus className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Items en el Pedido */}
            {itemsPedido.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs font-medium">
                No has agregado ningún perfume al pedido todavía. Haz clic arriba para añadir fragancias.
              </div>
            ) : (
              <div className="space-y-2">
                {itemsPedido.map((item, idx) => (
                  <div
                    key={`${item.catalogo_id}-${item.version}-${idx}`}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        #{item.codigo}
                      </span>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs text-slate-900 block truncate max-w-[200px]">
                          {item.contratipo}
                        </span>
                        {item.marca && (
                          <span className="text-[10px] text-slate-400 block">{item.marca}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Selector de Versión Normal / Plus */}
                      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleCambiarVersion(idx, 'Normal')}
                          className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                            item.version === 'Normal'
                              ? 'bg-amber-400 text-amber-950 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Normal ($20)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCambiarVersion(idx, 'Plus')}
                          className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                            item.version === 'Plus'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Plus ($25)
                        </button>
                      </div>

                      {/* Contador de Cantidad */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleCambiarCantidad(idx, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-600 hover:bg-white cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs px-1.5">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => handleCambiarCantidad(idx, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-600 hover:bg-white cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal Item */}
                      <span className="font-mono font-black text-xs text-slate-900 min-w-[55px] text-right">
                        ${item.subtotal.toFixed(2)}
                      </span>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleEliminarItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Quitar del pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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

            {/* Subtotal, Envío y Descuento */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Sub Total ($)</label>
                <div className="clay-input w-full text-xs font-mono font-bold bg-slate-100">
                  ${subtotalPedido.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Descuento ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={descuento}
                  onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  className="clay-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Costo Envío ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(parseFloat(e.target.value) || 0)}
                  className="clay-input w-full text-xs font-mono font-bold"
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
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                      Forma de Pago *
                    </label>
                    <select
                      value={pagoInputFormaId}
                      onChange={(e) => setPagoInputFormaId(e.target.value)}
                      className="clay-input w-full text-xs font-bold bg-white cursor-pointer"
                    >
                      {formasPago.filter((fp) => fp.activo !== false).map((fp) => (
                        <option key={fp.id} value={fp.id}>
                          {fp.nombre} ({fp.tipo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                      Monto ($) *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder={balancePendiente > 0 ? balancePendiente.toFixed(2) : '0.00'}
                      value={pagoInputMonto}
                      onChange={(e) => setPagoInputMonto(e.target.value)}
                      className="clay-input w-full text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                      No. Voucher / Ref
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. TRF-12345"
                      value={pagoInputDoc}
                      onChange={(e) => setPagoInputDoc(e.target.value)}
                      className="clay-input w-full text-xs font-mono font-medium"
                    />
                  </div>
                </div>

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
                            <span className="text-xs font-bold text-slate-800 block">
                              Comprobante de Transferencia
                            </span>
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
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-xs">
                <div className="flex justify-between font-bold text-slate-700">
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

            {/* Vendedora / Cajera Asignada */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendedora / Cajera Asignada
              </label>
              <select
                value={vendedoraSeleccionada}
                onChange={(e) => onVendedoraSeleccionadaChange(e.target.value)}
                className="clay-input w-full text-xs font-bold cursor-pointer"
              >
                {vendedoras.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
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
