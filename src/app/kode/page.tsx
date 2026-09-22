'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  ListOrdered,
  PackageCheck,
  Truck,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
  Check,
  User,
  Sparkles,
  CreditCard,
  Building,
  DollarSign,
  ReceiptText,
  FileText
} from 'lucide-react';
import { DEPARTAMENTOS_CATALOG, MUNICIPIOS_CATALOG, resolveC807DeptoCode, getMunicipiosByDepto } from '@/lib/svTerritory';

interface CatalogoItem {
  id: string;
  codigo: string;
  contratipo: string;
  marca_inspirada: string;
  genero: string;
  precio_normal: string | number;
  precio_extra_shot: string | number;
  imagen_url?: string;
}

interface Vendedora {
  id: string;
  nombre: string;
  email: string;
}

interface PedidoItem {
  id?: string;
  catalogo_id: string;
  codigo: string;
  contratipo: string;
  marca?: string;
  version: 'NORMAL' | 'EXTRA_SHOT';
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  insumo_comprado?: boolean;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  estado: 'Registrado' | 'Insumos comprados' | 'Preparado' | 'Enviado' | 'Entregado' | 'Cancelado' | string;
  tipo_pago: string;
  estado_pago: string;
  subtotal: string | number;
  costo_envio: string | number;
  total: string | number;
  c807_guia_numero?: string;
  c807_link_rastreo?: string;
  c807_estado?: string;
  c807_fecha_guia?: string;
  notas?: string;
  created_at: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  cliente_departamento: string;
  cliente_municipio: string;
  cliente_referencia?: string;
  vendedora_id?: string;
  vendedora_nombre?: string;
  items: PedidoItem[];
}

interface InsumoAgrupado {
  catalogo_id: string;
  codigo: string;
  contratipo: string;
  marca_inspirada: string;
  version: string;
  total_unidades: number | string;
  pedidos: Array<{
    item_id: string;
    pedido_id: string;
    numero_pedido: string;
    cliente_nombre: string;
    cantidad: number;
  }>;
}

export default function KodeSystemPage() {
  const [activeTab, setActiveTab] = useState<'nuevo_pedido' | 'listado_pedidos' | 'insumos_comprar' | 'rastreo_c807'>('nuevo_pedido');
  
  // Datos maestros
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [insumos, setInsumos] = useState<InsumoAgrupado[]>([]);
  
  // Loading & Toasts
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Formulario Nuevo Pedido
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDepto, setClienteDepto] = useState('');
  const [clienteMuni, setClienteMuni] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteReferencia, setClienteReferencia] = useState('');
  const [tipoPago, setTipoPago] = useState<'TRANSFERENCIA' | 'TARJETA' | 'CONTRAENTREGA'>('CONTRAENTREGA');
  const [estadoPago, setEstadoPago] = useState<'PENDIENTE' | 'PAGADO'>('PENDIENTE');
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [notasPedido, setNotasPedido] = useState('');

  // Selector de perfumes en el form
  const [busquedaPerfume, setBusquedaPerfume] = useState('');
  const [perfumeSeleccionado, setPerfumeSeleccionado] = useState<CatalogoItem | null>(null);
  const [versionSeleccionada, setVersionSeleccionada] = useState<'NORMAL' | 'EXTRA_SHOT'>('NORMAL');
  const [cantidadPerfume, setCantidadPerfume] = useState<number>(1);
  const [itemsPedido, setItemsPedido] = useState<PedidoItem[]>([]);

  // Filtros de Listado
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busquedaPedido, setBusquedaPedido] = useState('');
  const [expandedPedidoId, setExpandedPedidoId] = useState<string | null>(null);

  // Modal Guía C807
  const [guiaModalPedido, setGuiaModalPedido] = useState<Pedido | null>(null);
  const [numGuiaInput, setNumGuiaInput] = useState('');
  const [linkGuiaInput, setLinkGuiaInput] = useState('');
  const [generandoGuia, setGenerandoGuia] = useState(false);

  // Modal y estado Factura Llama (DTE)
  const [emitiendoDteId, setEmitiendoDteId] = useState<string | null>(null);
  const [dteResultModal, setDteResultModal] = useState<{
    pedido: Pedido;
    result: any;
  } | null>(null);

  // Notificación temporal
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar datos
  useEffect(() => {
    fetchCatalogo();
    fetchVendedoras();
    fetchPedidos();
    fetchInsumos();
  }, []);

  const fetchCatalogo = async () => {
    try {
      const res = await fetch('/api/kode/catalogo');
      const data = await res.json();
      if (data.success) {
        setCatalogo(data.perfumes);
      }
    } catch (e) {
      console.error('Error cargando catalogo:', e);
    }
  };

  const fetchVendedoras = async () => {
    try {
      const res = await fetch('/api/kode/vendedoras');
      const data = await res.json();
      if (data.success && data.vendedoras.length > 0) {
        setVendedoras(data.vendedoras);
        setVendedoraSeleccionada(data.vendedoras[0].id);
      }
    } catch (e) {
      console.error('Error cargando vendedoras:', e);
    }
  };

  const fetchPedidos = async () => {
    try {
      const res = await fetch('/api/kode/pedidos');
      const data = await res.json();
      if (data.success) {
        setPedidos(data.pedidos);
      }
    } catch (e) {
      console.error('Error cargando pedidos:', e);
    }
  };

  const fetchInsumos = async () => {
    try {
      const res = await fetch('/api/kode/insumos');
      const data = await res.json();
      if (data.success) {
        setInsumos(data.insumos);
      }
    } catch (e) {
      console.error('Error cargando insumos:', e);
    }
  };

  // Municipios dinámicos
  const municipiosDisponibles = useMemo(() => {
    if (!clienteDepto) return [];
    return getMunicipiosByDepto(clienteDepto);
  }, [clienteDepto]);

  // Búsqueda en catálogo
  const perfumesSugeridos = useMemo(() => {
    if (!busquedaPerfume.trim()) return [];
    const q = busquedaPerfume.toLowerCase();
    return catalogo
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.contratipo.toLowerCase().includes(q) || p.marca_inspirada.toLowerCase().includes(q))
      .slice(0, 10);
  }, [catalogo, busquedaPerfume]);

  // Agregar perfume a la orden actual
  const handleAgregarItem = () => {
    if (!perfumeSeleccionado) return;
    const precio = versionSeleccionada === 'EXTRA_SHOT'
      ? parseFloat(perfumeSeleccionado.precio_extra_shot.toString())
      : parseFloat(perfumeSeleccionado.precio_normal.toString());

    const nuevoItem: PedidoItem = {
      catalogo_id: perfumeSeleccionado.id,
      codigo: perfumeSeleccionado.codigo,
      contratipo: perfumeSeleccionado.contratipo,
      marca: perfumeSeleccionado.marca_inspirada,
      version: versionSeleccionada,
      cantidad: cantidadPerfume,
      precio_unitario: precio,
      subtotal: precio * cantidadPerfume,
      insumo_comprado: false,
    };

    setItemsPedido((prev) => [...prev, nuevoItem]);
    setPerfumeSeleccionado(null);
    setBusquedaPerfume('');
    setCantidadPerfume(1);
    setVersionSeleccionada('NORMAL');
  };

  const handleEliminarItem = (index: number) => {
    setItemsPedido((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModificarCantidad = (index: number, delta: number) => {
    setItemsPedido((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nuevaCantidad = Math.max(1, item.cantidad + delta);
        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: item.precio_unitario * nuevaCantidad,
        };
      })
    );
  };

  // Totales
  const subtotalPedido = useMemo(() => {
    return itemsPedido.reduce((acc, it) => acc + it.subtotal, 0);
  }, [itemsPedido]);

  const totalPedido = useMemo(() => {
    return subtotalPedido + (parseFloat(costoEnvio.toString()) || 0);
  }, [subtotalPedido, costoEnvio]);

  // Guardar Pedido Nuevo (Inicia en Rojo)
  const handleGuardarPedido = async () => {
    if (!clienteNombre.trim() || !clienteTelefono.trim() || !clienteDepto || !clienteMuni || !clienteDireccion.trim()) {
      showToast('Por favor completa todos los datos obligatorios del cliente.', 'error');
      return;
    }

    if (itemsPedido.length === 0) {
      showToast('Debes agregar al menos un perfume al pedido.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/kode/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nombre: clienteNombre.trim(),
            telefono: clienteTelefono.trim(),
            departamento: clienteDepto,
            municipio: clienteMuni,
            direccion: clienteDireccion.trim(),
            referencia: clienteReferencia.trim() || undefined,
          },
          items: itemsPedido,
          tipo_pago: tipoPago,
          estado_pago: estadoPago,
          costo_envio: costoEnvio,
          vendedora_id: vendedoraSeleccionada,
          notas: notasPedido.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Pedido ${data.pedido.numero_pedido} registrado en Rojo (Pendiente de compra)`, 'success');
        setClienteNombre('');
        setClienteTelefono('');
        setClienteDireccion('');
        setClienteReferencia('');
        setItemsPedido([]);
        setNotasPedido('');
        fetchPedidos();
        fetchInsumos();
        setActiveTab('listado_pedidos');
      } else {
        showToast(data.error || 'Error al registrar pedido', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Marcar insumo comprado
  const handleMarcarInsumo = async (catalogo_id: string, version: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/kode/insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogo_id,
          version,
          comprado_por: vendedoras.find((v) => v.id === vendedoraSeleccionada)?.nombre || 'Bodega',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Insumo marcado como comprado. Los pedidos completos pasaron a Amarillo automáticamente.', 'success');
        fetchInsumos();
        fetchPedidos();
      } else {
        showToast(data.error || 'Error al marcar insumo', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Asignar Guía C807 Manualmente
  const handleGuardarGuiaC807 = async () => {
    if (!guiaModalPedido || !numGuiaInput.trim()) {
      showToast('Ingrese el número de guía C807', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/kode/guia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: guiaModalPedido.id,
          modo: 'manual',
          c807_guia_numero: numGuiaInput.trim(),
          c807_link_rastreo: linkGuiaInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Guía ${numGuiaInput} asignada. Pedido en estado Azul.`, 'success');
        setGuiaModalPedido(null);
        setNumGuiaInput('');
        setLinkGuiaInput('');
        fetchPedidos();
      } else {
        showToast(data.error || 'Error al asignar guía', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generar Guía Directamente con la API de C807 Express
  const handleGenerarGuiaAutomaticaC807 = async () => {
    if (!guiaModalPedido) return;

    try {
      setGenerandoGuia(true);
      const res = await fetch('/api/kode/guia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: guiaModalPedido.id,
          modo: 'automatico',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`🚀 ¡Guía ${data.numero_guia} generada en C807! Pedido en estado Azul.`, 'success');
        setGuiaModalPedido(null);
        setNumGuiaInput('');
        setLinkGuiaInput('');
        fetchPedidos();
      } else {
        showToast(data.error || 'Error al generar guía con C807 Express', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setGenerandoGuia(false);
    }
  };

  // Emitir Factura Electrónica DTE mediante Factura Llama
  const handleEmitirDte = async (pedido: Pedido) => {
    try {
      setEmitiendoDteId(pedido.id);
      const res = await fetch('/api/kode/dte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido_id: pedido.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ DTE emitido: ${data.codigo_generacion.slice(0, 8)}...`, 'success');
        setDteResultModal({ pedido, result: data });
      } else {
        showToast(data.mensaje || data.error || 'Error al emitir DTE', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error de conexión con Factura Llama', 'error');
    } finally {
      setEmitiendoDteId(null);
    }
  };

  // Filtrado de pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      let matchEstado = filtroEstado === 'TODOS';
      if (!matchEstado) {
        if (filtroEstado === 'Registrado') {
          matchEstado = p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA';
        } else if (filtroEstado === 'Insumos comprados') {
          matchEstado = p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR';
        } else if (filtroEstado === 'Preparado') {
          matchEstado = p.estado === 'Preparado';
        } else if (filtroEstado === 'Enviado') {
          matchEstado = p.estado === 'Enviado' || p.estado === 'GUIA_CREADA';
        } else if (filtroEstado === 'Entregado') {
          matchEstado = p.estado === 'Entregado' || p.estado === 'ENTREGADO';
        } else if (filtroEstado === 'Cancelado') {
          matchEstado = p.estado === 'Cancelado' || p.estado === 'CANCELADO';
        } else {
          matchEstado = p.estado === filtroEstado;
        }
      }

      const matchQuery =
        !busquedaPedido.trim() ||
        p.numero_pedido.toLowerCase().includes(busquedaPedido.toLowerCase()) ||
        p.cliente_nombre.toLowerCase().includes(busquedaPedido.toLowerCase()) ||
        p.cliente_telefono.includes(busquedaPedido) ||
        (p.c807_guia_numero && p.c807_guia_numero.toLowerCase().includes(busquedaPedido.toLowerCase()));
      return matchEstado && matchQuery;
    });
  }, [pedidos, filtroEstado, busquedaPedido]);

  // Métricas
  const metricas = useMemo(() => {
    const registrados = pedidos.filter((p) => p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA').length;
    const insumosComprados = pedidos.filter((p) => p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR').length;
    const preparados = pedidos.filter((p) => p.estado === 'Preparado').length;
    const enviados = pedidos.filter((p) => p.estado === 'Enviado' || p.estado === 'GUIA_CREADA').length;
    const entregados = pedidos.filter((p) => p.estado === 'Entregado' || p.estado === 'ENTREGADO').length;
    const cancelados = pedidos.filter((p) => p.estado === 'Cancelado' || p.estado === 'CANCELADO').length;
    return {
      registrados,
      insumosComprados,
      preparados,
      enviados,
      entregados,
      cancelados,
      total: pedidos.length,
    };
  }, [pedidos]);

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-slate-800 flex flex-col font-sans antialiased pb-16">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-indigo-50 border-indigo-300 text-indigo-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER CLAYMORPHIC AROMANIAK STYLE */}
      <header className="sticky top-0 z-40 bg-[#f1f4f9]/95 backdrop-blur-md pt-4 pb-2 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="clay-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Marca KODE */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl shadow-md border border-white/40">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">KÖDE</span>
                <span className="clay-badge text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  kode.aromaniaksv.com
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Sistema de Ventas WhatsApp, Insumos y Envíos C807</p>
            </div>
          </div>

          {/* Vendedora Activa */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-2xl shadow-inner">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">Vendedora:</span>
            <select
              value={vendedoraSeleccionada}
              onChange={(e) => setVendedoraSeleccionada(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {vendedoras.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CLAYMORPHIC TABS TRACK */}
        <div className="mt-3">
          <div className="clay-tabs-track p-1.5 flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('nuevo_pedido')}
              className={`clay-tab-item flex-1 py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 ${
                activeTab === 'nuevo_pedido' ? 'clay-tab-active' : 'clay-tab-inactive'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Nuevo Pedido WhatsApp</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('listado_pedidos');
                fetchPedidos();
              }}
              className={`clay-tab-item flex-1 py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 ${
                activeTab === 'listado_pedidos' ? 'clay-tab-active' : 'clay-tab-inactive'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Listado de Pedidos</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  activeTab === 'listado_pedidos' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {metricas.total}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('insumos_comprar');
                fetchInsumos();
              }}
              className={`clay-tab-item flex-1 py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 ${
                activeTab === 'insumos_comprar' ? 'clay-tab-active' : 'clay-tab-inactive'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Insumos a Comprar</span>
              {insumos.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    activeTab === 'insumos_comprar' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {insumos.reduce((acc, i) => acc + parseInt(i.total_unidades.toString(), 10), 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('rastreo_c807');
                fetchPedidos();
              }}
              className={`clay-tab-item flex-1 py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 ${
                activeTab === 'rastreo_c807' ? 'clay-tab-active' : 'clay-tab-inactive'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Salida y Guías C807</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  activeTab === 'rastreo_c807' ? 'bg-white/30 text-white' : 'bg-sky-100 text-sky-700'
                }`}
              >
                {metricas.azules}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3 flex-1">
        {/* ============================================================== */}
        {/* TAB 1: NUEVO PEDIDO WHATSAPP                                   */}
        {/* ============================================================== */}
        {activeTab === 'nuevo_pedido' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Datos del Cliente */}
            <div className="lg:col-span-7 space-y-6">
              <div className="clay-card p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-extrabold text-slate-800">Datos del Cliente (WhatsApp)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Mendoza"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="clay-input w-full text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Teléfono WhatsApp *</label>
                    <input
                      type="text"
                      placeholder="Ej. 78901234"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="clay-input w-full text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Departamento *</label>
                    <select
                      value={clienteDepto}
                      onChange={(e) => {
                        setClienteDepto(e.target.value);
                        setClienteMuni('');
                      }}
                      className="clay-input w-full text-xs font-bold cursor-pointer"
                    >
                      <option value="">-- Seleccionar --</option>
                      {DEPARTAMENTOS_CATALOG.filter((d) => d.id !== '00').map((d) => (
                        <option key={d.id} value={d.nombre_depto || d.nombre}>
                          {d.nombre_depto || d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Municipio / Distrito *</label>
                    <select
                      value={clienteMuni}
                      onChange={(e) => setClienteMuni(e.target.value)}
                      disabled={!clienteDepto}
                      className="clay-input w-full text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- Seleccionar Municipio --</option>
                      {municipiosDisponibles.map((m: any) => (
                        <option key={m.id_municipio || m.id} value={m.nombre_municipio || m.nombre}>
                          {m.nombre_municipio || m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Dirección Exacta de Entrega *</label>
                    <textarea
                      rows={2}
                      placeholder="Colonia, calle, pasaje, número de casa..."
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      className="clay-input w-full text-xs font-medium resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Punto de Referencia (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Frente a parque, portón negro..."
                      value={clienteReferencia}
                      onChange={(e) => setClienteReferencia(e.target.value)}
                      className="clay-input w-full text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Perfumes KODE */}
              <div className="clay-card p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-extrabold text-slate-800">Agregar Perfumes KÖDE al Pedido</h2>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Buscar en Catálogo KÖDE (por Código o Contratipo)
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ej. 100, 343, Sauvage, 1 Million..."
                        value={busquedaPerfume}
                        onChange={(e) => {
                          setBusquedaPerfume(e.target.value);
                          if (perfumeSeleccionado && e.target.value !== perfumeSeleccionado.contratipo) {
                            setPerfumeSeleccionado(null);
                          }
                        }}
                        className="clay-input has-icon w-full text-xs font-bold"
                      />
                    </div>

                    {/* Dropdown de sugerencias */}
                    {perfumesSugeridos.length > 0 && !perfumeSeleccionado && (
                      <div className="absolute z-20 w-full mt-1.5 clay-card p-2 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {perfumesSugeridos.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setPerfumeSeleccionado(p);
                              setBusquedaPerfume(`${p.codigo} - ${p.contratipo}`);
                            }}
                            className="p-2.5 hover:bg-indigo-50/70 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              {p.imagen_url && (
                                <img
                                  src={p.imagen_url}
                                  alt={p.contratipo}
                                  className="w-8 h-8 rounded-lg object-cover bg-white shadow-sm border border-slate-200"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2">
                                    #{p.codigo}
                                  </span>
                                  <span className="text-xs font-extrabold text-slate-900">{p.contratipo}</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {p.marca_inspirada} • {p.genero}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <span className="text-emerald-700 font-black font-mono">${p.precio_normal}</span>
                              <span className="text-slate-400 block text-[10px]">Extra: ${p.precio_extra_shot}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {perfumeSeleccionado && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-inner">
                      <div className="flex items-center gap-3">
                        {perfumeSeleccionado.imagen_url && (
                          <img
                            src={perfumeSeleccionado.imagen_url}
                            alt={perfumeSeleccionado.contratipo}
                            className="w-10 h-10 rounded-xl object-cover bg-white shadow-sm border border-indigo-200"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                              #{perfumeSeleccionado.codigo}
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {perfumeSeleccionado.contratipo}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {perfumeSeleccionado.marca_inspirada} ({perfumeSeleccionado.genero})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Selector Versión Normal vs Extra Shot */}
                        <div>
                          <label className="block text-[10px] text-slate-600 font-bold mb-1">Versión</label>
                          <div className="flex rounded-xl bg-slate-200/80 p-0.5 border border-slate-300/80">
                            <button
                              type="button"
                              onClick={() => setVersionSeleccionada('NORMAL')}
                              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                versionSeleccionada === 'NORMAL'
                                  ? 'bg-white text-indigo-700 shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Normal ($20)
                            </button>
                            <button
                              type="button"
                              onClick={() => setVersionSeleccionada('EXTRA_SHOT')}
                              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                versionSeleccionada === 'EXTRA_SHOT'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Extra Shot ($25)
                            </button>
                          </div>
                        </div>

                        {/* Cantidad */}
                        <div>
                          <label className="block text-[10px] text-slate-600 font-bold mb-1">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={cantidadPerfume}
                            onChange={(e) => setCantidadPerfume(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-14 clay-input text-xs text-center font-mono font-bold py-1 px-1"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAgregarItem}
                          className="clay-btn clay-btn-primary mt-4 px-4 py-2 text-xs font-extrabold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Resumen de Pedido y Pago */}
            <div className="lg:col-span-5 space-y-6">
              <div className="clay-card p-6 flex flex-col h-full space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-sm font-extrabold text-slate-800">
                      Perfumes del Pedido ({itemsPedido.length})
                    </h2>
                  </div>
                  {itemsPedido.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setItemsPedido([])}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                    >
                      Vaciar
                    </button>
                  )}
                </div>

                {/* Lista de perfumes agregados */}
                <div className="flex-1 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {itemsPedido.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                      No hay fragancias agregadas al pedido aún.
                    </div>
                  ) : (
                    itemsPedido.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700">
                              #{item.codigo}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">{item.contratipo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                                item.version === 'EXTRA_SHOT'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.version === 'EXTRA_SHOT' ? 'EXTRA SHOT' : 'NORMAL'}
                            </span>
                            <span>
                              {item.cantidad} x ${item.precio_unitario.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-inner">
                            <button
                              type="button"
                              onClick={() => handleModificarCantidad(idx, -1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-mono font-bold text-xs">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => handleModificarCantidad(idx, 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-mono font-black text-indigo-700 text-sm">
                            ${item.subtotal.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleEliminarItem(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Forma de Pago y Envío */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Método de Pago *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['CONTRAENTREGA', 'TRANSFERENCIA', 'TARJETA'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTipoPago(m)}
                          className={`clay-btn py-2 px-1 text-center rounded-xl text-xs font-extrabold ${
                            tipoPago === m ? 'clay-btn-primary' : 'clay-btn-light'
                          }`}
                        >
                          {m === 'CONTRAENTREGA' ? 'Contraentrega' : m === 'TRANSFERENCIA' ? 'Transferencia' : 'Tarjeta'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Estado de Pago</label>
                      <select
                        value={estadoPago}
                        onChange={(e: any) => setEstadoPago(e.target.value)}
                        className="clay-input w-full text-xs font-bold"
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PAGADO">PAGADO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Costo de Envío ($)</label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={costoEnvio}
                        onChange={(e) => setCostoEnvio(parseFloat(e.target.value) || 0)}
                        className="clay-input w-full text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Notas / Observaciones</label>
                    <input
                      type="text"
                      placeholder="Instrucciones para despacho..."
                      value={notasPedido}
                      onChange={(e) => setNotasPedido(e.target.value)}
                      className="clay-input w-full text-xs font-medium"
                    />
                  </div>

                  {/* Resumen Total */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1.5 text-xs shadow-inner">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal Perfumes:</span>
                      <span className="font-mono font-bold text-slate-800">${subtotalPedido.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Envío:</span>
                      <span className="font-mono font-bold text-slate-800">
                        ${(parseFloat(costoEnvio.toString()) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Pedido:</span>
                      <span className="font-mono text-indigo-700 text-lg">${totalPedido.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGuardarPedido}
                    disabled={loading || itemsPedido.length === 0}
                    className="clay-btn clay-btn-success w-full py-3.5 text-sm font-black shadow-lg disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Registrar Pedido (Entra en Rojo)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: LISTADO DE PEDIDOS (ROJO / AMARILLO / AZUL)             */}
        {/* ============================================================== */}
        {activeTab === 'listado_pedidos' && (
          <div className="space-y-6">
            {/* Tarjetas de Métricas Claymorphic */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div
                onClick={() => setFiltroEstado('TODOS')}
                className={`clay-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                  filtroEstado === 'TODOS' ? 'border-2 border-indigo-400 bg-indigo-50/20' : ''
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Total Pedidos</span>
                <span className="text-xl font-black text-slate-900 font-mono">{metricas.total}</span>
              </div>

              <div
                onClick={() => setFiltroEstado('Registrado')}
                className={`clay-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                  filtroEstado === 'Registrado' ? 'border-2 border-rose-400 bg-rose-50/30' : ''
                }`}
              >
                <span className="text-[11px] text-rose-700 font-black flex items-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  🔴 Registrado
                </span>
                <span className="text-xl font-black text-rose-600 font-mono">{metricas.registrados}</span>
                <span className="text-[10px] text-slate-400 block">Faltan insumos</span>
              </div>

              <div
                onClick={() => setFiltroEstado('Insumos comprados')}
                className={`clay-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                  filtroEstado === 'Insumos comprados' ? 'border-2 border-amber-400 bg-amber-50/30' : ''
                }`}
              >
                <span className="text-[11px] text-amber-800 font-black flex items-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  🟡 Insumos comprados
                </span>
                <span className="text-xl font-black text-amber-700 font-mono">{metricas.insumosComprados}</span>
                <span className="text-[10px] text-slate-400 block">Listo preparar</span>
              </div>

              <div
                onClick={() => setFiltroEstado('Enviado')}
                className={`clay-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                  filtroEstado === 'Enviado' ? 'border-2 border-sky-400 bg-sky-50/30' : ''
                }`}
              >
                <span className="text-[11px] text-sky-700 font-black flex items-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  🔵 Enviado
                </span>
                <span className="text-xl font-black text-sky-600 font-mono">{metricas.enviados}</span>
                <span className="text-[10px] text-slate-400 block">Con guía C807</span>
              </div>

              <div
                onClick={() => setFiltroEstado('Entregado')}
                className={`clay-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                  filtroEstado === 'Entregado' ? 'border-2 border-emerald-400 bg-emerald-50/30' : ''
                }`}
              >
                <span className="text-[11px] text-emerald-700 font-black flex items-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  🟢 Entregado
                </span>
                <span className="text-xl font-black text-emerald-600 font-mono">{metricas.entregados}</span>
                <span className="text-[10px] text-slate-400 block">Confirmado C807</span>
              </div>

              <div
                onClick={() => setFiltroEstado('Cancelado')}
                className={`clay-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                  filtroEstado === 'Cancelado' ? 'border-2 border-slate-400 bg-slate-100' : ''
                }`}
              >
                <span className="text-[11px] text-slate-600 font-black flex items-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  ⚫ Cancelado
                </span>
                <span className="text-xl font-black text-slate-600 font-mono">{metricas.cancelados}</span>
                <span className="text-[10px] text-slate-400 block">Cancelados</span>
              </div>
            </div>

            {/* Barra de Búsqueda y Actualización */}
            <div className="clay-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por # Pedido, Cliente, Teléfono o Guía C807..."
                  value={busquedaPedido}
                  onChange={(e) => setBusquedaPedido(e.target.value)}
                  className="clay-input has-icon w-full text-xs font-bold"
                />
              </div>

              <button
                onClick={fetchPedidos}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar
              </button>
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-4">
              {pedidosFiltrados.length === 0 ? (
                <div className="clay-card text-center py-16">
                  <ListOrdered className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-extrabold text-slate-800">No se encontraron pedidos</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {filtroEstado !== 'TODOS'
                      ? `No hay pedidos con filtro ${filtroEstado}`
                      : 'Comienza ingresando un pedido en la pestaña "Nuevo Pedido WhatsApp"'}
                  </p>
                </div>
              ) : (
                pedidosFiltrados.map((p) => {
                  const isExpanded = expandedPedidoId === p.id;
                  const insumosPendientesCount = p.items.filter((i) => !i.insumo_comprado).length;

                  return (
                    <div
                      key={p.id}
                      className={`clay-card p-5 space-y-3 transition-all hover:scale-[1.005] ${
                        p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA'
                          ? 'border-l-4 border-l-rose-500'
                          : p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR'
                          ? 'border-l-4 border-l-amber-500'
                          : p.estado === 'Preparado'
                          ? 'border-l-4 border-l-purple-500'
                          : p.estado === 'Enviado' || p.estado === 'GUIA_CREADA'
                          ? 'border-l-4 border-l-sky-500'
                          : p.estado === 'Entregado' || p.estado === 'ENTREGADO'
                          ? 'border-l-4 border-l-emerald-500'
                          : 'border-l-4 border-l-slate-400'
                      }`}
                    >
                      {/* Cabecera del Pedido */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-3.5 h-3.5 rounded-full mt-1.5 shrink-0 ${
                              p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA'
                                ? 'bg-rose-500 shadow-md shadow-rose-300'
                                : p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR'
                                ? 'bg-amber-400 shadow-md shadow-amber-300'
                                : p.estado === 'Preparado'
                                ? 'bg-purple-500 shadow-md shadow-purple-300'
                                : p.estado === 'Enviado' || p.estado === 'GUIA_CREADA'
                                ? 'bg-sky-500 shadow-md shadow-sky-300'
                                : p.estado === 'Entregado' || p.estado === 'ENTREGADO'
                                ? 'bg-emerald-500 shadow-md shadow-emerald-300'
                                : 'bg-slate-400'
                            }`}
                          />

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-base font-black text-slate-900 tracking-tight">
                                {p.numero_pedido}
                              </span>

                              {/* Badges de Estado Oficiales */}
                              {(p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA') && (
                                <span className="clay-badge text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                  🔴 Registrado ({insumosPendientesCount > 0 ? `${insumosPendientesCount} insumos por comprar` : 'Pendiente compra'})
                                </span>
                              )}

                              {(p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR') && (
                                <span className="clay-badge text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                  🟡 Insumos comprados (Listo preparar)
                                </span>
                              )}

                              {p.estado === 'Preparado' && (
                                <span className="clay-badge text-[11px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200">
                                  🟣 Preparado (Listo para envío)
                                </span>
                              )}

                              {(p.estado === 'Enviado' || p.estado === 'GUIA_CREADA') && (
                                <span className="clay-badge text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                                  🔵 Enviado (Guía C807: {p.c807_guia_numero})
                                </span>
                              )}

                              {(p.estado === 'Entregado' || p.estado === 'ENTREGADO') && (
                                <span className="clay-badge text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  🟢 Entregado (Confirmado C807)
                                </span>
                              )}

                              {(p.estado === 'Cancelado' || p.estado === 'CANCELADO') && (
                                <span className="clay-badge text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                                  ⚫ Cancelado
                                </span>
                              )}
                            </div>

                            {/* Cliente y Destino */}
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                              <span className="font-bold text-slate-900">{p.cliente_nombre}</span>
                              <span className="text-slate-300">•</span>
                              <a
                                href={`https://wa.me/503${p.cliente_telefono}`}
                                target="_blank"
                                rel="noreferrer"
                                className="clay-badge text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {p.cliente_telefono}
                              </a>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3 h-3 text-indigo-600" />
                                {p.cliente_municipio}, {p.cliente_departamento}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total, Vendedora y Acciones */}
                        <div className="flex items-center gap-4 ml-auto">
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block font-medium">
                              {p.tipo_pago} • {p.vendedora_nombre || 'WhatsApp'}
                            </span>
                            <span className="text-lg font-black font-mono text-indigo-700">
                              ${parseFloat(p.total.toString()).toFixed(2)}
                            </span>
                          </div>

                          {/* Botón Asignar Guía C807 */}
                          {p.estado !== 'Enviado' && p.estado !== 'GUIA_CREADA' && p.estado !== 'Entregado' && p.estado !== 'ENTREGADO' && p.estado !== 'Cancelado' && (
                            <button
                              onClick={() => {
                                setGuiaModalPedido(p);
                                setNumGuiaInput(p.c807_guia_numero || '');
                                setLinkGuiaInput(p.c807_link_rastreo || '');
                              }}
                              className="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-black"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Asignar Guía C807
                            </button>
                          )}

                          {(p.estado === 'Enviado' || p.estado === 'GUIA_CREADA' || p.estado === 'Entregado' || p.estado === 'ENTREGADO') && p.c807_guia_numero && (
                            <a
                              href={p.c807_link_rastreo || `https://app.c807.com/tracking?guide=${p.c807_guia_numero}`}
                              target="_blank"
                              rel="noreferrer"
                              className="clay-btn clay-btn-light text-sky-700 hover:bg-sky-50 border border-sky-300 px-3 py-1.5 text-xs font-bold"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Rastrear C807
                            </a>
                          )}

                          {/* Botón Facturar DTE con Factura Llama */}
                          <button
                            onClick={() => handleEmitirDte(p)}
                            disabled={emitiendoDteId === p.id}
                            className="clay-btn bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                            title="Emitir Factura Electrónica (DTE) con Factura Llama"
                          >
                            <ReceiptText className={`w-3.5 h-3.5 ${emitiendoDteId === p.id ? 'animate-spin' : 'text-emerald-600'}`} />
                            <span>{emitiendoDteId === p.id ? 'Emitiendo...' : 'Facturar DTE'}</span>
                          </button>

                          <button
                            onClick={() => setExpandedPedidoId(isExpanded ? null : p.id)}
                            className="clay-btn clay-btn-light p-1.5 text-slate-500 hover:text-slate-800"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Vista Desplegada: Detalle de Perfumes y Dirección Completa */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 pt-4 mt-2 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                              <span className="font-extrabold text-slate-700 block mb-1">Dirección Exacta de Entrega:</span>
                              <p className="text-slate-800 font-medium">{p.cliente_direccion}</p>
                              {p.cliente_referencia && (
                                <p className="text-indigo-600 mt-1 font-bold">Ref: {p.cliente_referencia}</p>
                              )}
                            </div>

                            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                              <span className="font-extrabold text-slate-700 block mb-1">Detalles de Envío y Pago:</span>
                              <div className="flex justify-between text-slate-600 font-medium">
                                <span>Método de Pago:</span>
                                <span className="font-bold text-slate-900">{p.tipo_pago}</span>
                              </div>
                              <div className="flex justify-between text-slate-600 font-medium">
                                <span>Estado Pago:</span>
                                <span className="font-bold text-emerald-700">{p.estado_pago}</span>
                              </div>
                              <div className="flex justify-between text-slate-600 font-medium">
                                <span>Vendedora:</span>
                                <span className="font-bold text-slate-900">{p.vendedora_nombre || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Tabla de Perfumes Solicitados */}
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 block mb-2">
                              Perfumes en este Pedido ({p.items.length}):
                            </span>
                            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-inner">
                              {p.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700">
                                      #{it.codigo}
                                    </span>
                                    <span className="font-extrabold text-slate-900 text-sm">{it.contratipo}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        it.version === 'EXTRA_SHOT'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {it.version === 'EXTRA_SHOT' ? 'EXTRA SHOT' : 'NORMAL'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <span className="text-slate-600 font-medium">
                                      Cant: <strong className="text-slate-900 font-bold">{it.cantidad}</strong>
                                    </span>
                                    <span className="text-indigo-700 font-mono font-black">
                                      ${parseFloat(it.subtotal.toString()).toFixed(2)}
                                    </span>

                                    {/* Estado del insumo */}
                                    {it.insumo_comprado ? (
                                      <span className="clay-badge text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <Check className="w-3 h-3 text-emerald-600" /> Insumo Comprado
                                      </span>
                                    ) : (
                                      <span className="clay-badge text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-rose-600" /> Falta Comprar
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SECCIÓN DE INSUMOS A COMPRAR (PROVEEDOR)                */}
        {/* ============================================================== */}
        {activeTab === 'insumos_comprar' && (
          <div className="space-y-6">
            <div className="clay-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-indigo-600" />
                  Insumos / Perfumes a Comprar al Proveedor
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Lista consolidada de fragancias requeridas para los pedidos en <strong>Rojo (Pendiente de compra)</strong>.
                  Márcalas aquí conforme las compres. Si a un pedido le falta comprar 1 perfume, permanece en Rojo; cuando todos sus perfumes estén comprados, pasará automáticamente a <strong>Amarillo (Pendiente de preparar)</strong>.
                </p>
              </div>

              <button
                onClick={fetchInsumos}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar Lista
              </button>
            </div>

            {insumos.length === 0 ? (
              <div className="clay-card text-center py-20">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-base font-extrabold text-slate-900">¡No hay insumos pendientes de compra!</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Todos los insumos solicitados ya han sido comprados o los pedidos se encuentran listos para fabricar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insumos.map((item, idx) => (
                  <div key={idx} className="clay-card p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          #{item.codigo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.version === 'EXTRA_SHOT'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.version === 'EXTRA_SHOT' ? 'EXTRA SHOT' : 'NORMAL'}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{item.contratipo}</h3>
                      <p className="text-xs text-slate-500 mb-3 font-medium">{item.marca_inspirada}</p>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-inner">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-bold">Total a Comprar:</span>
                          <span className="font-mono text-xl font-black text-indigo-700">
                            {item.total_unidades} {parseInt(item.total_unidades.toString(), 10) === 1 ? 'unidad' : 'unidades'}
                          </span>
                        </div>

                        {/* Pedidos que esperan este perfume */}
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1 font-medium">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Para los pedidos:</span>
                          {item.pedidos.map((p, pIdx) => (
                            <div key={pIdx} className="flex justify-between">
                              <span className="font-mono text-slate-700 font-bold">{p.numero_pedido}</span>
                              <span className="text-slate-600">{p.cliente_nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarcarInsumo(item.catalogo_id, item.version)}
                      disabled={loading}
                      className="clay-btn clay-btn-success w-full py-2.5 text-xs font-black shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      Marcar como Comprado ({item.total_unidades})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SALIDA Y GUÍAS C807 (AZUL)                              */}
        {/* ============================================================== */}
        {activeTab === 'rastreo_c807' && (
          <div className="space-y-6">
            <div className="clay-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-sky-600" />
                  Salida de Pedidos y Rastreo C807
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Pedidos con guía de paquetería generada en estado <strong>Azul (Enviado / En ruta)</strong> o <strong>Verde (Entregado)</strong>.
                </p>
              </div>

              <button
                onClick={fetchPedidos}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar Guías
              </button>
            </div>

            <div className="space-y-4">
              {pedidos.filter((p) => p.estado === 'Enviado' || p.estado === 'GUIA_CREADA' || p.estado === 'Entregado' || p.estado === 'ENTREGADO' || p.c807_guia_numero).length === 0 ? (
                <div className="clay-card text-center py-20">
                  <Truck className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-extrabold text-slate-900">No hay envíos con guía C807 generada aún</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Ve al listado de pedidos y presiona &quot;Asignar Guía C807&quot; para cambiar un pedido listo a estado Azul (Enviado).
                  </p>
                </div>
              ) : (
                pedidos
                  .filter((p) => p.estado === 'Enviado' || p.estado === 'GUIA_CREADA' || p.estado === 'Entregado' || p.estado === 'ENTREGADO' || p.c807_guia_numero)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="clay-card p-5 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-sky-500"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-bold shadow-inner">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 text-base">{p.numero_pedido}</span>
                            <span className="clay-badge text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                              Guía: {p.c807_guia_numero}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-medium">
                            Destino: <strong className="text-slate-800">{p.cliente_nombre}</strong> ({p.cliente_municipio}, {p.cliente_departamento})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={p.c807_link_rastreo || `https://app.c807.com/tracking?guide=${p.c807_guia_numero}`}
                          target="_blank"
                          rel="noreferrer"
                          className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver Rastreo en C807
                        </a>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: ASIGNAR GUÍA C807                                       */}
      {/* ============================================================== */}
      {guiaModalPedido && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Asignar Guía C807 al Pedido</h3>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Al guardar la guía de paquetería C807, el pedido <strong>{guiaModalPedido.numero_pedido}</strong> pasará automáticamente a estado <strong>Azul (Guía creada / Enviado)</strong>.
            </p>

            {guiaModalPedido.cliente_departamento && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">
                    Destino: <strong className="text-slate-800">{guiaModalPedido.cliente_municipio}, {guiaModalPedido.cliente_departamento}</strong>
                  </span>
                  <span className="clay-badge bg-sky-100 text-sky-800 font-black">C807: {resolveC807DeptoCode(guiaModalPedido.cliente_departamento)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Modalidad: <strong className="text-slate-700">{guiaModalPedido.tipo_pago}</strong></span>
                  <span>{guiaModalPedido.tipo_pago === 'CONTRAENTREGA' ? `Cobro C807: $${Number(guiaModalPedido.total || 0).toFixed(2)}` : 'Servicio Pagado (SER)'}</span>
                </div>
              </div>
            )}

            {/* BOTÓN DE GENERACIÓN DIRECTA AUTOMÁTICA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGenerarGuiaAutomaticaC807}
                disabled={generandoGuia || loading}
                className="w-full clay-btn bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Truck className={`w-4 h-4 ${generandoGuia ? 'animate-spin' : ''}`} />
                <span>{generandoGuia ? 'Generando en C807 Express...' : '🚀 Generar Guía Automática con C807'}</span>
              </button>
            </div>

            <div className="relative my-1 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <span className="relative bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">o ingresar guía existente</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Número de Guía C807 *</label>
                <input
                  type="text"
                  placeholder="Ej. C807-SV-981245"
                  value={numGuiaInput}
                  onChange={(e) => setNumGuiaInput(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Enlace de Rastreo (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://app.c807.com/tracking?guide=..."
                  value={linkGuiaInput}
                  onChange={(e) => setLinkGuiaInput(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGuiaModalPedido(null)}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleGuardarGuiaC807}
                disabled={!numGuiaInput.trim() || loading || generandoGuia}
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Guardar Manualmente
              </button>
            </div>
          </div>
        </div>
      {/* ============================================================== */}
      {/* MODAL: FACTURA ELECTRÓNICA DTE (FACTURA LLAMA)                */}
      {/* ============================================================== */}
      {dteResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Factura Electrónica Emitida (DTE)</h3>
                <p className="text-xs text-slate-500 font-medium">Pedido #{dteResultModal.pedido.numero_pedido} - {dteResultModal.pedido.cliente_nombre}</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">Estado Hacienda:</span>
                <span className="clay-badge bg-emerald-100 text-emerald-800 font-black">
                  ✓ {dteResultModal.result.estado || 'PROCESADO'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">Código Generación:</span>
                <span className="font-mono text-slate-800 font-black truncate max-w-[220px]" title={dteResultModal.result.codigo_generacion}>
                  {dteResultModal.result.codigo_generacion}
                </span>
              </div>
              {dteResultModal.result.numero_control && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Número Control:</span>
                  <span className="font-mono text-slate-800 font-black">{dteResultModal.result.numero_control}</span>
                </div>
              )}
              {dteResultModal.result.sello_recepcion && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Sello Recepción MH:</span>
                  <span className="font-mono text-slate-800 font-bold truncate max-w-[220px]" title={dteResultModal.result.sello_recepcion}>
                    {dteResultModal.result.sello_recepcion}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {dteResultModal.result.pdf_url && (
                <a
                  href={dteResultModal.result.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 clay-btn clay-btn-primary py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Descargar PDF Factura
                </a>
              )}
              {dteResultModal.result.json_url && (
                <a
                  href={dteResultModal.result.json_url}
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
                onClick={() => setDteResultModal(null)}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
