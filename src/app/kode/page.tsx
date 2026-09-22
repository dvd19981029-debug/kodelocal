'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  CreditCard,
  Building,
  Sparkles
} from 'lucide-react';
import { DEPARTAMENTOS_CATALOG, MUNICIPIOS_CATALOG } from '@/lib/svTerritory';

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
  estado: 'PENDIENTE_COMPRA' | 'PENDIENTE_PREPARAR' | 'GUIA_CREADA' | 'ENTREGADO' | 'CANCELADO';
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

  // Notificación temporal
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar catálogo y vendedoras al inicio
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
      setLoading(true);
      const res = await fetch('/api/kode/pedidos');
      const data = await res.json();
      if (data.success) {
        setPedidos(data.pedidos);
      }
    } catch (e) {
      console.error('Error cargando pedidos:', e);
    } finally {
      setLoading(false);
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

  // Municipios filtrados según depto seleccionado
  const municipiosDisponibles = useMemo(() => {
    if (!clienteDepto) return [];
    const deptoObj = DEPARTAMENTOS_CATALOG.find((d) => d.nombre.toLowerCase() === clienteDepto.toLowerCase());
    if (!deptoObj) return [];
    return MUNICIPIOS_CATALOG.filter((m) => m.departamentoId === deptoObj.id);
  }, [clienteDepto]);

  // Perfumes filtrados para sugerencias
  const perfumesSugeridos = useMemo(() => {
    if (!busquedaPerfume.trim()) return [];
    const q = busquedaPerfume.toLowerCase().trim();
    return catalogo
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.contratipo.toLowerCase().includes(q) || p.marca_inspirada?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [busquedaPerfume, catalogo]);

  // Agregar perfume al pedido
  const handleAgregarItem = () => {
    if (!perfumeSeleccionado) {
      showToast('Seleccione un perfume del catálogo', 'error');
      return;
    }
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
    };

    setItemsPedido([...itemsPedido, nuevoItem]);
    setPerfumeSeleccionado(null);
    setBusquedaPerfume('');
    setCantidadPerfume(1);
    setVersionSeleccionada('NORMAL');
  };

  const handleEliminarItem = (idx: number) => {
    setItemsPedido(itemsPedido.filter((_, i) => i !== idx));
  };

  // Totales
  const subtotalPedido = useMemo(() => {
    return itemsPedido.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [itemsPedido]);

  const totalPedido = useMemo(() => {
    return subtotalPedido + (parseFloat(costoEnvio.toString()) || 0);
  }, [subtotalPedido, costoEnvio]);

  // Guardar Pedido
  const handleGuardarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim() || !clienteTelefono.trim()) {
      showToast('Nombre y teléfono del cliente son requeridos', 'error');
      return;
    }
    if (itemsPedido.length === 0) {
      showToast('Agregue al menos un perfume al pedido', 'error');
      return;
    }
    if (!clienteDepto || !clienteMuni) {
      showToast('Seleccione Departamento y Municipio', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/kode/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nombre_completo: clienteNombre.trim(),
            telefono_whatsapp: clienteTelefono.trim(),
            direccion_entrega: clienteDireccion.trim(),
            departamento: clienteDepto,
            municipio: clienteMuni,
            punto_referencia: clienteReferencia.trim(),
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
        showToast(`¡Pedido ${data.pedido.numero_pedido} registrado en Rojo (Pendiente de compra)!`, 'success');
        // Limpiar form
        setClienteNombre('');
        setClienteTelefono('');
        setClienteDireccion('');
        setClienteReferencia('');
        setItemsPedido([]);
        setNotasPedido('');
        // Recargar datos
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

  // Marcar insumo individual o agrupado como comprado
  const handleMarcarInsumo = async (catalogo_id: string, version: string, totalCount: number) => {
    try {
      setLoading(true);
      const res = await fetch('/api/kode/insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogo_id,
          version,
          comprado_por: vendedoras.find(v => v.id === vendedoraSeleccionada)?.nombre || 'Bodega',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Insumo comprado marcado. Los pedidos con insumos completos pasaron a Amarillo (Pendiente de preparar).`, 'success');
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

  // Asignar Guía C807
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
          c807_guia_numero: numGuiaInput.trim(),
          c807_link_rastreo: linkGuiaInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Guía ${numGuiaInput} asignada. Pedido en estado Azul (Guía Creada / Enviado).`, 'success');
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

  // Filtro de pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const matchEstado = filtroEstado === 'TODOS' || p.estado === filtroEstado;
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
    const rojos = pedidos.filter((p) => p.estado === 'PENDIENTE_COMPRA').length;
    const amarillos = pedidos.filter((p) => p.estado === 'PENDIENTE_PREPARAR').length;
    const azules = pedidos.filter((p) => p.estado === 'GUIA_CREADA').length;
    return { rojos, amarillos, azules, total: pedidos.length };
  }, [pedidos]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 border transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950 border-rose-500 text-rose-200'
              : 'bg-blue-950 border-blue-500 text-blue-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER KODE */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-xl tracking-wider shadow-lg shadow-amber-500/20">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">KODE</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  kode.aromaniaksv.com
                </span>
              </div>
              <p className="text-xs text-slate-400">Sistema Independiente de Ventas, Insumos y Despacho</p>
            </div>
          </div>

          {/* Vendedora activa selector */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Vendedora:</span>
            <select
              value={vendedoraSeleccionada}
              onChange={(e) => setVendedoraSeleccionada(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {vendedoras.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NAVEGACIÓN DE TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto border-t border-slate-800/60 no-scrollbar">
          <button
            onClick={() => setActiveTab('nuevo_pedido')}
            className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'nuevo_pedido'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Nuevo Pedido WhatsApp
          </button>

          <button
            onClick={() => {
              setActiveTab('listado_pedidos');
              fetchPedidos();
            }}
            className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'listado_pedidos'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Listado de Pedidos
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {metricas.total}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('insumos_comprar');
              fetchInsumos();
            }}
            className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'insumos_comprar'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            Insumos a Comprar
            {insumos.length > 0 && (
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                {insumos.reduce((acc, i) => acc + parseInt(i.total_unidades.toString(), 10), 0)} pendientes
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('rastreo_c807');
              fetchPedidos();
            }}
            className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'rastreo_c807'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            Salida y Guías C807
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
              {metricas.azules}
            </span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* ============================================================== */}
        {/* TAB 1: NUEVO PEDIDO WHATSAPP                                   */}
        {/* ============================================================== */}
        {activeTab === 'nuevo_pedido' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Datos del Cliente */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-amber-400" />
                  Datos del Cliente (WhatsApp)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Mendoza"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono WhatsApp *</label>
                    <input
                      type="text"
                      placeholder="Ej. 78901234"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Departamento *</label>
                    <select
                      value={clienteDepto}
                      onChange={(e) => {
                        setClienteDepto(e.target.value);
                        setClienteMuni('');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">-- Seleccionar --</option>
                      {DEPARTAMENTOS_CATALOG.filter((d) => d.id !== '00').map((d) => (
                        <option key={d.id} value={d.nombre}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Municipio / Distrito *</label>
                    <select
                      value={clienteMuni}
                      onChange={(e) => setClienteMuni(e.target.value)}
                      disabled={!clienteDepto}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">-- Seleccionar Municipio --</option>
                      {municipiosDisponibles.map((m) => (
                        <option key={m.id} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección de Entrega Exacta *</label>
                    <textarea
                      rows={2}
                      placeholder="Colonia, calle, pasaje, número de casa..."
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Punto de Referencia (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Frente a parque, portón negro..."
                      value={clienteReferencia}
                      onChange={(e) => setClienteReferencia(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Perfumes KODE */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Agregar Perfumes KODE al Pedido
                </h2>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Buscar en Catálogo KODE (por Código o Contratipo)
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Dropdown de sugerencias */}
                    {perfumesSugeridos.length > 0 && !perfumeSeleccionado && (
                      <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800/50">
                        {perfumesSugeridos.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setPerfumeSeleccionado(p);
                              setBusquedaPerfume(`${p.codigo} - ${p.contratipo}`);
                            }}
                            className="p-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  #{p.codigo}
                                </span>
                                <span className="text-sm font-semibold text-white">{p.contratipo}</span>
                              </div>
                              <span className="text-xs text-slate-400">{p.marca_inspirada} • {p.genero}</span>
                            </div>
                            <div className="text-right text-xs">
                              <span className="text-emerald-400 font-bold font-mono">${p.precio_normal}</span>
                              <span className="text-slate-500 block">Extra: ${p.precio_extra_shot}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {perfumeSeleccionado && (
                    <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            #{perfumeSeleccionado.codigo}
                          </span>
                          <span className="font-bold text-white text-sm">{perfumeSeleccionado.contratipo}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {perfumeSeleccionado.marca_inspirada} ({perfumeSeleccionado.genero})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Versión Normal vs Extra Shot */}
                        <div>
                          <label className="block text-[10px] text-slate-400 font-medium mb-1">Versión</label>
                          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setVersionSeleccionada('NORMAL')}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                versionSeleccionada === 'NORMAL'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Normal ($20)
                            </button>
                            <button
                              type="button"
                              onClick={() => setVersionSeleccionada('EXTRA_SHOT')}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                versionSeleccionada === 'EXTRA_SHOT'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Extra Shot ($25)
                            </button>
                          </div>
                        </div>

                        {/* Cantidad */}
                        <div>
                          <label className="block text-[10px] text-slate-400 font-medium mb-1">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={cantidadPerfume}
                            onChange={(e) => setCantidadPerfume(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm text-center text-white font-mono focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAgregarItem}
                          className="mt-4 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
                <h2 className="text-base font-bold text-white flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    Perfumes del Pedido ({itemsPedido.length})
                  </span>
                  {itemsPedido.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setItemsPedido([])}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Vaciar
                    </button>
                  )}
                </h2>

                {/* Lista de perfumes agregados */}
                <div className="flex-1 space-y-2.5 max-h-72 overflow-y-auto mb-4 pr-1">
                  {itemsPedido.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                      No hay fragancias agregadas al pedido aún.
                    </div>
                  ) : (
                    itemsPedido.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-amber-400">#{item.codigo}</span>
                            <span className="text-sm font-semibold text-white">{item.contratipo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                item.version === 'EXTRA_SHOT'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-slate-800 text-slate-300'
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
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            ${item.subtotal.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEliminarItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Forma de Pago y Envío */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Método de Pago *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['CONTRAENTREGA', 'TRANSFERENCIA', 'TARJETA'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTipoPago(m)}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all ${
                            tipoPago === m
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {m === 'CONTRAENTREGA' ? 'Contraentrega' : m === 'TRANSFERENCIA' ? 'Transferencia' : 'Tarjeta'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Estado de Pago</label>
                      <select
                        value={estadoPago}
                        onChange={(e: any) => setEstadoPago(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PAGADO">PAGADO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Costo de Envío ($)</label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={costoEnvio}
                        onChange={(e) => setCostoEnvio(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Notas / Observaciones</label>
                    <input
                      type="text"
                      placeholder="Instrucciones especiales para despacho..."
                      value={notasPedido}
                      onChange={(e) => setNotasPedido(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  {/* Resumen Total */}
                  <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal Perfumes:</span>
                      <span className="font-mono">${subtotalPedido.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Envío:</span>
                      <span className="font-mono">${(parseFloat(costoEnvio.toString()) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                      <span>Total Pedido:</span>
                      <span className="font-mono text-emerald-400">${totalPedido.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGuardarPedido}
                    disabled={loading || itemsPedido.length === 0}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
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
            {/* Tarjetas de Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                onClick={() => setFiltroEstado('TODOS')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  filtroEstado === 'TODOS'
                    ? 'bg-slate-800/80 border-slate-600'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-xs text-slate-400 block mb-1">Total Pedidos</span>
                <span className="text-2xl font-black text-white font-mono">{metricas.total}</span>
              </div>

              <div
                onClick={() => setFiltroEstado('PENDIENTE_COMPRA')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  filtroEstado === 'PENDIENTE_COMPRA'
                    ? 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/40'
                    : 'bg-slate-900 border-slate-800 hover:border-rose-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    Rojo: Pendiente de Compra
                  </span>
                </div>
                <span className="text-2xl font-black text-rose-400 font-mono">{metricas.rojos}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Insumos por comprar</span>
              </div>

              <div
                onClick={() => setFiltroEstado('PENDIENTE_PREPARAR')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  filtroEstado === 'PENDIENTE_PREPARAR'
                    ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-900 border-slate-800 hover:border-amber-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Amarillo: Por Fabricar
                  </span>
                </div>
                <span className="text-2xl font-black text-amber-400 font-mono">{metricas.amarillos}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Insumos completos listos</span>
              </div>

              <div
                onClick={() => setFiltroEstado('GUIA_CREADA')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  filtroEstado === 'GUIA_CREADA'
                    ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/40'
                    : 'bg-slate-900 border-slate-800 hover:border-blue-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-400 font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Azul: Guía Creada (C807)
                  </span>
                </div>
                <span className="text-2xl font-black text-blue-400 font-mono">{metricas.azules}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Enviado / Guía lista</span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por # Pedido, Cliente, Teléfono o Guía C807..."
                  value={busquedaPedido}
                  onChange={(e) => setBusquedaPedido(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPedidos}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-4">
              {pedidosFiltrados.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <ListOrdered className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-base font-semibold text-slate-300">No se encontraron pedidos</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {filtroEstado !== 'TODOS'
                      ? `No hay pedidos con estado ${filtroEstado}`
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
                      className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                        p.estado === 'PENDIENTE_COMPRA'
                          ? 'border-rose-900/60 shadow-md shadow-rose-950/20'
                          : p.estado === 'PENDIENTE_PREPARAR'
                          ? 'border-amber-600/60 shadow-md shadow-amber-950/20'
                          : p.estado === 'GUIA_CREADA'
                          ? 'border-blue-700/60 shadow-md shadow-blue-950/20'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Cabecera de la tarjeta del pedido */}
                      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {/* Badge de Estado con Color Estricto */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0 ${
                              p.estado === 'PENDIENTE_COMPRA'
                                ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                                : p.estado === 'PENDIENTE_PREPARAR'
                                ? 'bg-amber-400 shadow-lg shadow-amber-400/50'
                                : p.estado === 'GUIA_CREADA'
                                ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                                : 'bg-emerald-500'
                            }`}
                          />

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-base font-extrabold text-white tracking-tight">
                                {p.numero_pedido}
                              </span>

                              {/* Etiquetas de estado visuales */}
                              {p.estado === 'PENDIENTE_COMPRA' && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700">
                                  🔴 Pendiente de Compra ({insumosPendientesCount} insumos faltantes)
                                </span>
                              )}

                              {p.estado === 'PENDIENTE_PREPARAR' && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-600">
                                  🟡 Pendiente de Preparar / Fabricación
                                </span>
                              )}

                              {p.estado === 'GUIA_CREADA' && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-600">
                                  🔵 Guía C807: {p.c807_guia_numero}
                                </span>
                              )}
                            </div>

                            {/* Cliente y Destino */}
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                              <span className="font-semibold text-white">{p.cliente_nombre}</span>
                              <span className="text-slate-500">•</span>
                              <a
                                href={`https://wa.me/503${p.cliente_telefono}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono font-bold"
                              >
                                <Phone className="w-3 h-3" />
                                {p.cliente_telefono}
                              </a>
                              <span className="text-slate-500">•</span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {p.cliente_municipio}, {p.cliente_departamento}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Columna Derecha: Total, Vendedora y Acciones */}
                        <div className="flex items-center gap-4 ml-auto">
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">
                              {p.tipo_pago} • {p.vendedora_nombre || 'WhatsApp'}
                            </span>
                            <span className="text-lg font-black font-mono text-emerald-400">
                              ${parseFloat(p.total.toString()).toFixed(2)}
                            </span>
                          </div>

                          {/* Botón Acción Asignar Guía C807 */}
                          {p.estado !== 'GUIA_CREADA' && (
                            <button
                              onClick={() => {
                                setGuiaModalPedido(p);
                                setNumGuiaInput(p.c807_guia_numero || '');
                                setLinkGuiaInput(p.c807_link_rastreo || '');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Asignar Guía C807
                            </button>
                          )}

                          {p.estado === 'GUIA_CREADA' && p.c807_guia_numero && (
                            <a
                              href={p.c807_link_rastreo || `https://app.c807.com/tracking?guide=${p.c807_guia_numero}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Rastrear C807
                            </a>
                          )}

                          <button
                            onClick={() => setExpandedPedidoId(isExpanded ? null : p.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Vista Desplegada: Detalle de Perfumes y Dirección Completa */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 sm:p-5 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
                              <span className="font-bold text-slate-400 block mb-1">Dirección Exacta de Entrega:</span>
                              <p className="text-white">{p.cliente_direccion}</p>
                              {p.cliente_referencia && (
                                <p className="text-amber-400 mt-1">Ref: {p.cliente_referencia}</p>
                              )}
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
                              <span className="font-bold text-slate-400 block mb-1">Detalles de Envío y Pago:</span>
                              <div className="flex justify-between text-slate-300">
                                <span>Método de Pago:</span>
                                <span className="font-semibold text-white">{p.tipo_pago}</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Estado Pago:</span>
                                <span className="font-semibold text-emerald-400">{p.estado_pago}</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Vendedora:</span>
                                <span className="text-white">{p.vendedora_nombre || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Tabla de Perfumes Solicitados */}
                          <div>
                            <span className="text-xs font-bold text-slate-300 block mb-2">
                              Perfumes en este Pedido ({p.items.length}):
                            </span>
                            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                              {p.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                      #{it.codigo}
                                    </span>
                                    <span className="font-bold text-white text-sm">{it.contratipo}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        it.version === 'EXTRA_SHOT'
                                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                          : 'bg-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {it.version === 'EXTRA_SHOT' ? 'EXTRA SHOT' : 'NORMAL'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <span className="text-slate-400 font-mono">
                                      Cant: <strong className="text-white">{it.cantidad}</strong>
                                    </span>
                                    <span className="text-emerald-400 font-mono font-bold">
                                      ${parseFloat(it.subtotal.toString()).toFixed(2)}
                                    </span>

                                    {/* Estado del insumo */}
                                    {it.insumo_comprado ? (
                                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Insumo Comprado
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Falta Comprar
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-6 h-6 text-amber-400" />
                  Insumos / Perfumes a Comprar al Proveedor
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Lista consolidada de las fragancias requeridas para los pedidos en <strong>Rojo (Pendiente de compra)</strong>.
                  Márcalas aquí conforme las compres. Si a un pedido le falta comprar 1 perfume, permanece en Rojo; cuando todos sus perfumes estén comprados, pasará automáticamente a <strong>Amarillo (Pendiente de preparar)</strong>.
                </p>
              </div>

              <button
                onClick={fetchInsumos}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar Lista
              </button>
            </div>

            {insumos.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">¡No hay insumos pendientes de compra!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Todos los insumos solicitados ya han sido comprados o los pedidos se encuentran listos para fabricar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insumos.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                          #{item.codigo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.version === 'EXTRA_SHOT'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.version === 'EXTRA_SHOT' ? 'EXTRA SHOT' : 'NORMAL'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white tracking-tight">{item.contratipo}</h3>
                      <p className="text-xs text-slate-400 mb-3">{item.marca_inspirada}</p>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Total a Comprar:</span>
                          <span className="font-mono text-xl font-extrabold text-amber-400">
                            {item.total_unidades} {parseInt(item.total_unidades.toString(), 10) === 1 ? 'unidad' : 'unidades'}
                          </span>
                        </div>

                        {/* Pedidos que esperan este perfume */}
                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
                          <span className="block text-[10px] uppercase font-bold text-slate-500">Para los pedidos:</span>
                          {item.pedidos.map((p, pIdx) => (
                            <div key={pIdx} className="flex justify-between">
                              <span className="font-mono text-slate-300">{p.numero_pedido}</span>
                              <span className="text-slate-400">{p.cliente_nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarcarInsumo(item.catalogo_id, item.version, parseInt(item.total_unidades.toString(), 10))}
                      disabled={loading}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-6 h-6 text-blue-400" />
                  Salida de Pedidos y Rastreo C807
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pedidos con guía de paquetería generada en estado <strong>Azul (Guía creada / Enviado)</strong>.
                </p>
              </div>

              <button
                onClick={fetchPedidos}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar Guías
              </button>
            </div>

            <div className="space-y-4">
              {pedidos.filter((p) => p.estado === 'GUIA_CREADA' || p.c807_guia_numero).length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
                  <Truck className="w-14 h-14 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">No hay envíos con guía C807 generada aún</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ve al listado de pedidos y presiona &quot;Asignar Guía C807&quot; para cambiar un pedido listo a estado Azul.
                  </p>
                </div>
              ) : (
                pedidos
                  .filter((p) => p.estado === 'GUIA_CREADA' || p.c807_guia_numero)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-900 border border-blue-900/50 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-base">{p.numero_pedido}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-700">
                              Guía: {p.c807_guia_numero}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Destino: <strong className="text-white">{p.cliente_nombre}</strong> ({p.cliente_municipio}, {p.cliente_departamento})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={p.c807_link_rastreo || `https://app.c807.com/tracking?guide=${p.c807_guia_numero}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              Asignar Guía C807 al Pedido
            </h3>
            <p className="text-xs text-slate-400">
              Al guardar la guía de paquetería C807, el pedido {guiaModalPedido.numero_pedido} pasará automáticamente a estado <strong>Azul (Guía creada / Enviado)</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número de Guía C807 *
                </label>
                <input
                  type="text"
                  placeholder="Ej. C807-SV-981245"
                  value={numGuiaInput}
                  onChange={(e) => setNumGuiaInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enlace de Rastreo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://app.c807.com/tracking?guide=..."
                  value={linkGuiaInput}
                  onChange={(e) => setLinkGuiaInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGuiaModalPedido(null)}
                className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarGuiaC807}
                disabled={!numGuiaInput.trim() || loading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Check className="w-4 h-4" />
                Guardar y Cambiar a Azul
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
